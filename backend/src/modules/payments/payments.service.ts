import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';

import {
  Payment,
  PaymentDocument,
  PaymentStatus,
  PaymentProvider,
} from './schemas/payment.schema';
import {
  Booking,
  BookingDocument,
  BookingStatus,
} from '../bookings/schemas/booking.schema';
import { BookingsService } from '../bookings/bookings.service';

// Razorpay SDK types
import Razorpay = require('razorpay');

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private razorpay: InstanceType<typeof Razorpay>;
  private readonly webhookSecret: string;

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private bookingsService: BookingsService,
    private configService: ConfigService,
  ) {
    const keyId = this.configService.get<string>('razorpay.keyId');
    const keySecret = this.configService.get<string>('razorpay.keySecret');
    this.webhookSecret =
      this.configService.get<string>('razorpay.webhookSecret') || '';

    if (keyId && keySecret) {
      this.razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
      this.logger.log('Razorpay initialized');
    } else {
      this.logger.warn(
        'Razorpay credentials not configured — payment features disabled',
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  CREATE RAZORPAY ORDER — called after booking is created (status: pending)
  // ═══════════════════════════════════════════════════════════════════════════════

  async createOrder(
    tenantId: string,
    customerId: string,
    bookingId: string,
  ): Promise<{
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    bookingRef: string;
  }> {
    if (!this.razorpay) {
      throw new InternalServerErrorException(
        'Payment gateway not configured',
      );
    }

    // Load the booking and validate ownership
    const booking = await this.bookingModel.findOne({
      _id: new Types.ObjectId(bookingId),
      tenantId: new Types.ObjectId(tenantId),
      customerId: new Types.ObjectId(customerId),
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(
        `Cannot create payment for booking with status "${booking.status}"`,
      );
    }

    // Check if a payment already exists for this booking
    const existingPayment = await this.paymentModel.findOne({
      bookingId: booking._id,
      status: { $nin: [PaymentStatus.FAILED] },
    });

    if (existingPayment && existingPayment.providerOrderId) {
      // Return the existing order — idempotent
      return {
        orderId: existingPayment.providerOrderId,
        amount: existingPayment.amount,
        currency: existingPayment.currency,
        keyId: this.configService.get<string>('razorpay.keyId') || '',
        bookingRef: booking.bookingRef,
      };
    }

    // Amount in paise (Razorpay uses smallest currency unit)
    const amountInPaise = Math.round(booking.totalAmount * 100);

    // Create Razorpay order
    const order = await this.razorpay.orders.create({
      amount: amountInPaise,
      currency: booking.currency || 'INR',
      receipt: booking.bookingRef,
      notes: {
        bookingId: booking._id.toString(),
        tenantId: tenantId,
        customerId: customerId,
      },
    });

    // Create payment record
    await this.paymentModel.create({
      tenantId: new Types.ObjectId(tenantId),
      bookingId: booking._id,
      customerId: new Types.ObjectId(customerId),
      amount: booking.totalAmount,
      currency: booking.currency || 'INR',
      provider: PaymentProvider.RAZORPAY,
      providerOrderId: order.id,
      status: PaymentStatus.PENDING,
    });

    this.logger.log(
      `Razorpay order ${order.id} created for booking ${booking.bookingRef}`,
    );

    return {
      orderId: order.id,
      amount: amountInPaise,
      currency: booking.currency || 'INR',
      keyId: this.configService.get<string>('razorpay.keyId') || '',
      bookingRef: booking.bookingRef,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  VERIFY PAYMENT — called by frontend after Razorpay checkout success
  // ═══════════════════════════════════════════════════════════════════════════════

  async verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ): Promise<{ booking: BookingDocument; payment: PaymentDocument }> {
    // 1. Verify signature using HMAC SHA256
    const keySecret = this.configService.get<string>('razorpay.keySecret') || '';
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      this.logger.warn(
        `Payment verification failed: signature mismatch for order ${razorpayOrderId}`,
      );
      throw new BadRequestException('Payment verification failed — invalid signature');
    }

    // 2. Find the payment record
    const payment = await this.paymentModel.findOne({
      providerOrderId: razorpayOrderId,
    });

    if (!payment) {
      throw new NotFoundException(
        `No payment found for Razorpay order ${razorpayOrderId}`,
      );
    }

    // Idempotent — if already succeeded, return existing
    if (payment.status === PaymentStatus.SUCCEEDED) {
      const booking = await this.bookingModel.findById(payment.bookingId);
      if (!booking) throw new NotFoundException('Booking not found');
      return { booking, payment };
    }

    // 3. Update payment status
    payment.providerPaymentId = razorpayPaymentId;
    payment.status = PaymentStatus.SUCCEEDED;
    await payment.save();

    // 4. Confirm the booking
    const booking = await this.bookingsService.confirmBooking(
      payment.bookingId.toString(),
      payment._id as Types.ObjectId,
    );

    this.logger.log(
      `Payment ${razorpayPaymentId} verified — booking ${booking.bookingRef} confirmed`,
    );

    return { booking, payment };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  WEBHOOK HANDLER — Razorpay server-to-server notifications
  // ═══════════════════════════════════════════════════════════════════════════════

  async handleWebhook(
    rawBody: string,
    signature: string,
  ): Promise<void> {
    // 1. Verify webhook signature
    if (!this.webhookSecret) {
      this.logger.warn('Webhook secret not configured — skipping');
      return;
    }

    const expectedSig = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSig !== signature) {
      this.logger.warn('Webhook signature verification failed');
      throw new BadRequestException('Invalid webhook signature');
    }

    // 2. Parse event
    const event = JSON.parse(rawBody);
    const eventType = event.event;

    this.logger.log(`Razorpay webhook: ${eventType}`);

    switch (eventType) {
      case 'payment.captured': {
        const paymentEntity = event.payload?.payment?.entity;
        if (!paymentEntity) break;

        const payment = await this.paymentModel.findOne({
          providerOrderId: paymentEntity.order_id,
        });

        if (!payment) {
          this.logger.warn(
            `Webhook: no payment found for order ${paymentEntity.order_id}`,
          );
          break;
        }

        // Only process if still pending (idempotent)
        if (payment.status === PaymentStatus.PENDING) {
          payment.providerPaymentId = paymentEntity.id;
          payment.status = PaymentStatus.SUCCEEDED;
          payment.webhookPayload = event;
          await payment.save();

          await this.bookingsService.confirmBooking(
            payment.bookingId.toString(),
            payment._id as Types.ObjectId,
          );

          this.logger.log(
            `Webhook: payment ${paymentEntity.id} captured — booking confirmed`,
          );
        }
        break;
      }

      case 'payment.failed': {
        const paymentEntity = event.payload?.payment?.entity;
        if (!paymentEntity) break;

        const payment = await this.paymentModel.findOne({
          providerOrderId: paymentEntity.order_id,
        });

        if (payment && payment.status === PaymentStatus.PENDING) {
          payment.providerPaymentId = paymentEntity.id;
          payment.status = PaymentStatus.FAILED;
          payment.webhookPayload = event;
          await payment.save();

          this.logger.warn(
            `Webhook: payment ${paymentEntity.id} failed for order ${paymentEntity.order_id}`,
          );
        }
        break;
      }

      case 'refund.created': {
        const refundEntity = event.payload?.refund?.entity;
        if (!refundEntity) break;

        const payment = await this.paymentModel.findOne({
          providerPaymentId: refundEntity.payment_id,
        });

        if (payment) {
          payment.refundId = refundEntity.id;
          payment.refundAmount = refundEntity.amount / 100;
          payment.status =
            refundEntity.amount / 100 >= payment.amount
              ? PaymentStatus.REFUNDED
              : PaymentStatus.PARTIALLY_REFUNDED;
          payment.refundedAt = new Date();
          payment.webhookPayload = event;
          await payment.save();

          this.logger.log(
            `Webhook: refund ${refundEntity.id} processed for payment ${refundEntity.payment_id}`,
          );
        }
        break;
      }

      default:
        this.logger.log(`Webhook: unhandled event type "${eventType}"`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  GET PAYMENT BY BOOKING — for frontend status checks
  // ═══════════════════════════════════════════════════════════════════════════════

  async getPaymentByBooking(
    tenantId: string,
    bookingId: string,
  ): Promise<PaymentDocument | null> {
    return this.paymentModel.findOne({
      tenantId: new Types.ObjectId(tenantId),
      bookingId: new Types.ObjectId(bookingId),
    });
  }
}
