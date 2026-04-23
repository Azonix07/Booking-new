import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentOrderDto, VerifyPaymentDto } from './dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthenticatedUser } from '../../common/interfaces/auth.interface';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ─── Create Razorpay order ─────────────────────────────────────────────────

  /**
   * POST /payments/create-order
   *
   * Creates a Razorpay order for a pending booking.
   * Called by the frontend after booking creation.
   */
  @Post('create-order')
  @HttpCode(HttpStatus.CREATED)
  async createOrder(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePaymentOrderDto,
  ) {
    const order = await this.paymentsService.createOrder(
      tenantId,
      user.userId,
      dto.bookingId,
    );

    return {
      success: true,
      data: order,
    };
  }

  // ─── Verify payment ───────────────────────────────────────────────────────

  /**
   * POST /payments/verify
   *
   * Verifies the Razorpay payment signature after checkout.
   * On success, confirms the booking.
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyPayment(
    @Body() dto: VerifyPaymentDto,
  ) {
    const result = await this.paymentsService.verifyPayment(
      dto.razorpay_order_id,
      dto.razorpay_payment_id,
      dto.razorpay_signature,
    );

    return {
      success: true,
      message: 'Payment verified — booking confirmed',
      data: {
        bookingId: result.booking._id,
        bookingRef: result.booking.bookingRef,
        paymentId: result.payment._id,
        status: result.booking.status,
      },
    };
  }

  // ─── Razorpay webhook ─────────────────────────────────────────────────────

  /**
   * POST /payments/webhook
   *
   * Razorpay server-to-server webhook handler.
   * Public endpoint — auth via signature verification.
   */
  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('x-razorpay-signature') signature: string,
    @Req() req: any,
  ) {
    // Use raw body buffer for accurate signature verification
    const rawBody: string = req.rawBody
      ? req.rawBody.toString('utf8')
      : JSON.stringify(req.body);

    await this.paymentsService.handleWebhook(rawBody, signature || '');

    return { success: true };
  }
}
