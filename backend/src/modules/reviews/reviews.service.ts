import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';
import { CreateReviewDto, ReplyToReviewDto } from './dto';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
  ) {}

  // ─── Create review (customer) ─────────────────────────────────────────────────

  async create(
    customerId: string,
    tenantId: string,
    dto: CreateReviewDto,
  ): Promise<ReviewDocument> {
    // Verify booking belongs to this customer and tenant
    const booking = await this.bookingModel.findOne({
      _id: new Types.ObjectId(dto.bookingId),
      customerId: new Types.ObjectId(customerId),
      tenantId: new Types.ObjectId(tenantId),
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== 'completed') {
      throw new BadRequestException('Can only review completed bookings');
    }

    // Check for existing review on this booking
    const existing = await this.reviewModel.findOne({
      bookingId: new Types.ObjectId(dto.bookingId),
    });

    if (existing) {
      throw new ConflictException('You have already reviewed this booking');
    }

    const review = await this.reviewModel.create({
      tenantId: new Types.ObjectId(tenantId),
      bookingId: new Types.ObjectId(dto.bookingId),
      customerId: new Types.ObjectId(customerId),
      serviceId: new Types.ObjectId(dto.serviceId),
      rating: dto.rating,
      comment: dto.comment || '',
    });

    // Update tenant aggregate rating
    await this.recalculateTenantRating(tenantId);

    this.logger.log(`Review created for booking ${dto.bookingId} by ${customerId}`);

    return review;
  }

  // ─── Reply to review (client admin) ───────────────────────────────────────────

  async replyToReview(
    reviewId: string,
    tenantId: string,
    dto: ReplyToReviewDto,
  ): Promise<ReviewDocument> {
    const review = await this.reviewModel.findOne({
      _id: new Types.ObjectId(reviewId),
      tenantId: new Types.ObjectId(tenantId),
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.reply = { text: dto.text, repliedAt: new Date() };
    await review.save();

    return review;
  }

  // ─── List reviews for a tenant (public, for storefront) ───────────────────────

  async findByTenant(
    tenantId: string,
    page = 1,
    limit = 10,
  ) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find({ tenantId: new Types.ObjectId(tenantId), isVisible: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('customerId', 'name avatar')
        .populate('serviceId', 'name')
        .lean(),
      this.reviewModel.countDocuments({
        tenantId: new Types.ObjectId(tenantId),
        isVisible: true,
      }),
    ]);

    return {
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── List reviews for dashboard (client admin — includes hidden) ──────────────

  async findByTenantAdmin(
    tenantId: string,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find({ tenantId: new Types.ObjectId(tenantId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('customerId', 'name email avatar')
        .populate('serviceId', 'name')
        .populate('bookingId', 'bookingRef date startTime')
        .lean(),
      this.reviewModel.countDocuments({
        tenantId: new Types.ObjectId(tenantId),
      }),
    ]);

    return {
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── Toggle visibility (client admin) ─────────────────────────────────────────

  async toggleVisibility(
    reviewId: string,
    tenantId: string,
  ): Promise<ReviewDocument> {
    const review = await this.reviewModel.findOne({
      _id: new Types.ObjectId(reviewId),
      tenantId: new Types.ObjectId(tenantId),
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.isVisible = !review.isVisible;
    await review.save();

    return review;
  }

  // ─── Delete review (super admin only) ─────────────────────────────────────────

  async remove(reviewId: string): Promise<void> {
    const review = await this.reviewModel.findByIdAndDelete(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.recalculateTenantRating(review.tenantId.toString());
  }

  // ─── Private: Recalculate aggregate rating on Tenant ──────────────────────────

  private async recalculateTenantRating(tenantId: string): Promise<void> {
    const result = await this.reviewModel.aggregate([
      { $match: { tenantId: new Types.ObjectId(tenantId), isVisible: true } },
      {
        $group: {
          _id: null,
          average: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    const rating = result.length > 0
      ? { average: Math.round(result[0].average * 10) / 10, count: result[0].count }
      : { average: 0, count: 0 };

    await this.tenantModel.findByIdAndUpdate(tenantId, { rating });
  }
}
