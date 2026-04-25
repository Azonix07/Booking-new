import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../redis';
import {
  ServiceRequest,
  ServiceRequestDocument,
  ServiceRequestStatus,
} from './schemas/service-request.schema';
import {
  TrackingSession,
  TrackingSessionDocument,
  TrackingStatus,
} from './schemas/tracking-session.schema';
import {
  CreateServiceRequestDto,
  AcceptServiceRequestDto,
  UpdateStatusDto,
  UpdateLocationDto,
  RateServiceDto,
} from './dto/service-request.dto';

@Injectable()
export class ServiceRequestsService {
  private readonly logger = new Logger(ServiceRequestsService.name);

  constructor(
    @InjectModel(ServiceRequest.name) private requestModel: Model<ServiceRequestDocument>,
    @InjectModel(TrackingSession.name) private trackingModel: Model<TrackingSessionDocument>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  // ─── Customer: Create a service request ──────────────────────────────────────

  async createRequest(
    tenantId: string,
    customerId: string,
    dto: CreateServiceRequestDto,
  ): Promise<ServiceRequestDocument> {
    const request = await this.requestModel.create({
      tenantId: new Types.ObjectId(tenantId),
      customerId: new Types.ObjectId(customerId),
      category: dto.category,
      title: dto.title,
      description: dto.description || '',
      customerLocation: {
        type: 'Point',
        coordinates: [dto.longitude, dto.latitude],
      },
      customerAddress: dto.address,
      estimatedAmount: dto.estimatedAmount || 0,
      notes: dto.notes || '',
      status: ServiceRequestStatus.PENDING,
    });

    // Publish to Redis for real-time notifications
    await this.redis.publish(
      `tenant:${tenantId}:new-request`,
      JSON.stringify({ requestId: request._id, category: dto.category }),
    ).catch(() => {});

    this.logger.log(`Service request ${request.requestRef} created by ${customerId}`);
    return request;
  }

  // ─── Provider: Accept a request ──────────────────────────────────────────────

  async acceptRequest(
    tenantId: string,
    providerId: string,
    dto: AcceptServiceRequestDto,
  ): Promise<{ request: ServiceRequestDocument; tracking: TrackingSessionDocument }> {
    const request = await this.requestModel.findOne({
      _id: dto.requestId,
      tenantId: new Types.ObjectId(tenantId),
      status: ServiceRequestStatus.PENDING,
    });

    if (!request) {
      throw new NotFoundException('Request not found or already accepted');
    }

    request.providerId = new Types.ObjectId(providerId);
    request.status = ServiceRequestStatus.ACCEPTED;
    request.acceptedAt = new Date();
    request.providerLocation = {
      type: 'Point',
      coordinates: [dto.longitude, dto.latitude],
    };
    await request.save();

    // Create tracking session
    const tracking = await this.trackingModel.create({
      requestId: request._id,
      providerId: new Types.ObjectId(providerId),
      userId: request.customerId,
      tenantId: new Types.ObjectId(tenantId),
      currentLocation: {
        type: 'Point',
        coordinates: [dto.longitude, dto.latitude],
      },
      status: TrackingStatus.ACTIVE,
    });

    // Cache tracking data in Redis for fast lookups
    await this.redis.setex(
      `tracking:${request._id}`,
      3600, // 1 hour TTL
      JSON.stringify({
        trackingId: tracking._id,
        providerId,
        userId: request.customerId.toString(),
        lat: dto.latitude,
        lng: dto.longitude,
        status: ServiceRequestStatus.ACCEPTED,
      }),
    ).catch(() => {});

    this.logger.log(`Request ${request.requestRef} accepted by provider ${providerId}`);
    return { request, tracking };
  }

  // ─── Provider: Update status ─────────────────────────────────────────────────

  async updateStatus(
    tenantId: string,
    providerId: string,
    dto: UpdateStatusDto,
  ): Promise<ServiceRequestDocument> {
    const request = await this.requestModel.findOne({
      _id: dto.requestId,
      tenantId: new Types.ObjectId(tenantId),
      providerId: new Types.ObjectId(providerId),
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    const validTransitions: Record<string, string[]> = {
      [ServiceRequestStatus.ACCEPTED]: [ServiceRequestStatus.ON_THE_WAY, ServiceRequestStatus.CANCELLED],
      [ServiceRequestStatus.ON_THE_WAY]: [ServiceRequestStatus.ARRIVED, ServiceRequestStatus.CANCELLED],
      [ServiceRequestStatus.ARRIVED]: [ServiceRequestStatus.WORKING],
      [ServiceRequestStatus.WORKING]: [ServiceRequestStatus.COMPLETED],
    };

    const allowed = validTransitions[request.status] || [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${request.status} to ${dto.status}`,
      );
    }

    request.status = dto.status;

    switch (dto.status) {
      case ServiceRequestStatus.ARRIVED:
        request.arrivedAt = new Date();
        break;
      case ServiceRequestStatus.WORKING:
        request.workStartedAt = new Date();
        break;
      case ServiceRequestStatus.COMPLETED:
        request.completedAt = new Date();
        if (dto.finalAmount != null) request.finalAmount = dto.finalAmount;
        // Close tracking session
        await this.trackingModel.updateOne(
          { requestId: request._id },
          { status: TrackingStatus.COMPLETED, completedAt: new Date() },
        );
        // Clean up Redis
        await this.redis.del(`tracking:${request._id}`).catch(() => {});
        break;
    }

    await request.save();

    // Publish status update
    await this.redis.publish(
      `tracking:${request._id}:status`,
      JSON.stringify({ status: dto.status, requestId: request._id }),
    ).catch(() => {});

    return request;
  }

  // ─── Provider: Update location ───────────────────────────────────────────────

  async updateLocation(
    providerId: string,
    dto: UpdateLocationDto,
  ): Promise<void> {
    const tracking = await this.trackingModel.findOne({
      requestId: new Types.ObjectId(dto.requestId),
      providerId: new Types.ObjectId(providerId),
      status: TrackingStatus.ACTIVE,
    });

    if (!tracking) return;

    // Update current location
    tracking.currentLocation = {
      type: 'Point',
      coordinates: [dto.longitude, dto.latitude],
    };
    tracking.heading = dto.heading || 0;
    tracking.speed = dto.speed || 0;

    // Append to location history (keep last 100 points)
    tracking.locationHistory.push({
      lat: dto.latitude,
      lng: dto.longitude,
      timestamp: new Date(),
    });
    if (tracking.locationHistory.length > 100) {
      tracking.locationHistory = tracking.locationHistory.slice(-100);
    }

    await tracking.save();

    // Update Redis cache for fast reads
    const cached = {
      lat: dto.latitude,
      lng: dto.longitude,
      heading: dto.heading || 0,
      speed: dto.speed || 0,
      timestamp: Date.now(),
    };
    await this.redis.setex(
      `tracking:${dto.requestId}:location`,
      300, // 5 min TTL
      JSON.stringify(cached),
    ).catch(() => {});

    // Also update the service request's providerLocation
    await this.requestModel.updateOne(
      { _id: dto.requestId },
      {
        providerLocation: {
          type: 'Point',
          coordinates: [dto.longitude, dto.latitude],
        },
      },
    );
  }

  // ─── Customer: Rate the service ──────────────────────────────────────────────

  async rateService(
    customerId: string,
    dto: RateServiceDto,
  ): Promise<ServiceRequestDocument> {
    const request = await this.requestModel.findOne({
      _id: dto.requestId,
      customerId: new Types.ObjectId(customerId),
      status: ServiceRequestStatus.COMPLETED,
    });

    if (!request) {
      throw new NotFoundException('Completed request not found');
    }

    request.customerRating = dto.rating;
    request.customerReview = dto.review || '';
    await request.save();
    return request;
  }

  // ─── Queries ─────────────────────────────────────────────────────────────────

  async getRequestById(requestId: string, userId: string): Promise<ServiceRequestDocument> {
    const request = await this.requestModel
      .findById(requestId)
      .populate('customerId', 'name email phone avatar')
      .populate('providerId', 'name email phone avatar')
      .lean();

    if (!request) throw new NotFoundException('Request not found');

    // Only the customer or provider can view
    const uid = userId;
    if (
      request.customerId?._id?.toString() !== uid &&
      request.providerId?._id?.toString() !== uid
    ) {
      throw new ForbiddenException('Not authorized to view this request');
    }

    return request as any;
  }

  async getCustomerRequests(
    tenantId: string,
    customerId: string,
    status?: string,
  ): Promise<ServiceRequestDocument[]> {
    const filter: any = {
      tenantId: new Types.ObjectId(tenantId),
      customerId: new Types.ObjectId(customerId),
    };
    if (status) filter.status = status;

    return this.requestModel
      .find(filter)
      .populate('providerId', 'name phone avatar')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean() as any;
  }

  async getProviderRequests(
    tenantId: string,
    providerId: string,
    status?: string,
  ): Promise<ServiceRequestDocument[]> {
    const filter: any = {
      tenantId: new Types.ObjectId(tenantId),
      providerId: new Types.ObjectId(providerId),
    };
    if (status) filter.status = status;

    return this.requestModel
      .find(filter)
      .populate('customerId', 'name phone avatar')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean() as any;
  }

  async getPendingRequests(tenantId: string): Promise<ServiceRequestDocument[]> {
    return this.requestModel
      .find({
        tenantId: new Types.ObjectId(tenantId),
        status: ServiceRequestStatus.PENDING,
      })
      .populate('customerId', 'name phone avatar')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean() as any;
  }

  async getTrackingSession(requestId: string): Promise<TrackingSessionDocument | null> {
    return this.trackingModel
      .findOne({ requestId: new Types.ObjectId(requestId), status: TrackingStatus.ACTIVE })
      .lean() as any;
  }

  async getLocationFromCache(requestId: string): Promise<any> {
    const cached = await this.redis.get(`tracking:${requestId}:location`).catch(() => null);
    return cached ? JSON.parse(cached) : null;
  }
}
