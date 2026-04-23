import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, ReplyToReviewDto } from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthenticatedUser } from '../../common/interfaces/auth.interface';
import { ParseObjectIdPipe } from '../../common/pipes/parse-objectid.pipe';
import { UserRole } from '../users/schemas/user.schema';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /**
   * POST /reviews — Create a review for a completed booking (customer)
   */
  @Roles(UserRole.CUSTOMER)
  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateReviewDto,
  ) {
    const review = await this.reviewsService.create(
      user.userId,
      tenantId,
      dto,
    );
    return { success: true, data: review };
  }

  /**
   * GET /reviews/tenant/:tenantId — Public: list visible reviews for a storefront
   */
  @Public()
  @Get('tenant/:tenantId')
  async findByTenant(
    @Param('tenantId', ParseObjectIdPipe) tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.reviewsService.findByTenant(
      tenantId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
    return { success: true, ...result };
  }

  /**
   * GET /reviews/dashboard — Client admin: list all reviews (including hidden)
   */
  @Roles(UserRole.CLIENT_ADMIN)
  @Get('dashboard')
  async findForDashboard(
    @CurrentTenant() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.reviewsService.findByTenantAdmin(
      tenantId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return { success: true, ...result };
  }

  /**
   * POST /reviews/:id/reply — Client admin: reply to a review
   */
  @Roles(UserRole.CLIENT_ADMIN)
  @Post(':id/reply')
  async reply(
    @Param('id', ParseObjectIdPipe) reviewId: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: ReplyToReviewDto,
  ) {
    const review = await this.reviewsService.replyToReview(
      reviewId,
      tenantId,
      dto,
    );
    return { success: true, data: review };
  }

  /**
   * PATCH /reviews/:id/visibility — Client admin: toggle review visibility
   */
  @Roles(UserRole.CLIENT_ADMIN)
  @Patch(':id/visibility')
  async toggleVisibility(
    @Param('id', ParseObjectIdPipe) reviewId: string,
    @CurrentTenant() tenantId: string,
  ) {
    const review = await this.reviewsService.toggleVisibility(reviewId, tenantId);
    return { success: true, data: review };
  }

  /**
   * DELETE /reviews/:id — Super admin: remove a review
   */
  @Roles(UserRole.SUPER_ADMIN)
  @Delete(':id')
  async remove(@Param('id', ParseObjectIdPipe) reviewId: string) {
    await this.reviewsService.remove(reviewId);
    return { success: true, message: 'Review deleted' };
  }
}
