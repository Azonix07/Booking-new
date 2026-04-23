import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  FullServiceRequest,
  FullServiceRequestDocument,
  FullServiceRequestStatus,
} from './schemas/full-service-request.schema';
import {
  CreateFullServiceRequestDto,
  UpdateFullServiceStatusDto,
} from './dto/full-service.dto';

/**
 * Legal status transitions — enforced in updateStatus().
 * Prevents e.g. moving from COMPLETED back to PENDING.
 */
const ALLOWED_TRANSITIONS: Record<
  FullServiceRequestStatus,
  FullServiceRequestStatus[]
> = {
  [FullServiceRequestStatus.PENDING]: [
    FullServiceRequestStatus.CONTACTED,
    FullServiceRequestStatus.CANCELLED,
  ],
  [FullServiceRequestStatus.CONTACTED]: [
    FullServiceRequestStatus.IN_PROGRESS,
    FullServiceRequestStatus.CANCELLED,
  ],
  [FullServiceRequestStatus.IN_PROGRESS]: [
    FullServiceRequestStatus.COMPLETED,
    FullServiceRequestStatus.CANCELLED,
  ],
  [FullServiceRequestStatus.COMPLETED]: [],
  [FullServiceRequestStatus.CANCELLED]: [FullServiceRequestStatus.PENDING],
};

@Injectable()
export class FullServiceService {
  private readonly logger = new Logger(FullServiceService.name);

  constructor(
    @InjectModel(FullServiceRequest.name)
    private model: Model<FullServiceRequestDocument>,
  ) {}

  /**
   * Submit a new full-service request. Works both for logged-in users
   * (tenantId/requestedBy populated) and anonymous marketing-page submissions.
   */
  async create(
    dto: CreateFullServiceRequestDto,
    context: { tenantId?: string | null; userId?: string | null } = {},
  ) {
    const request = await this.model.create({
      tenantId: context.tenantId ? new Types.ObjectId(context.tenantId) : null,
      requestedBy: context.userId ? new Types.ObjectId(context.userId) : null,
      businessName: dto.businessName,
      businessType: dto.businessType,
      businessDescription: dto.businessDescription,
      features: dto.features ?? [],
      designPreferences: dto.designPreferences ?? '',
      targetAudience: dto.targetAudience ?? '',
      existingWebsite: dto.existingWebsite ?? '',
      budget: dto.budget ?? null,
      timeline: dto.timeline ?? '',
      additionalNotes: dto.additionalNotes ?? '',
      contact: dto.contact,
      status: FullServiceRequestStatus.PENDING,
    });

    this.logger.log(
      `FullServiceRequest created (${request._id}) for "${dto.businessName}"` +
        (context.userId ? ` by user ${context.userId}` : ' [anonymous]'),
    );

    // TODO(notifications): hook admin email / Slack / in-app here.
    // Intentionally non-blocking — notification failures must not fail submission.

    return request;
  }

  async findByUser(userId: string) {
    return this.model
      .find({ requestedBy: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();
  }

  async findByTenant(tenantId: string) {
    return this.model
      .find({ tenantId: new Types.ObjectId(tenantId) })
      .sort({ createdAt: -1 })
      .lean();
  }

  async findOneForUser(id: string, userId: string) {
    const req = await this.model
      .findOne({
        _id: new Types.ObjectId(id),
        requestedBy: new Types.ObjectId(userId),
      })
      .lean();
    if (!req) throw new NotFoundException('Request not found');
    return req;
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  async adminList(query: {
    status?: FullServiceRequestStatus;
    assignedTo?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.assignedTo)
      filter.assignedTo = new Types.ObjectId(query.assignedTo);
    if (query.search) {
      filter.$or = [
        { businessName: { $regex: query.search, $options: 'i' } },
        { 'contact.email': { $regex: query.search, $options: 'i' } },
      ];
    }

    const page = query.page || 1;
    const limit = query.limit || 25;
    const skip = (page - 1) * limit;

    const [data, total, counts] = await Promise.all([
      this.model
        .find(filter)
        .populate('tenantId', 'name slug')
        .populate('requestedBy', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.model.countDocuments(filter),
      this.model.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const statusCounts = counts.reduce(
      (acc, cur) => ({ ...acc, [cur._id]: cur.count }),
      {} as Record<string, number>,
    );

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      statusCounts,
    };
  }

  async adminGet(id: string) {
    const request = await this.model
      .findById(id)
      .populate('tenantId', 'name slug')
      .populate('requestedBy', 'name email phone')
      .populate('assignedTo', 'name email')
      .lean();
    if (!request) throw new NotFoundException('Request not found');
    return request;
  }

  async updateStatus(
    id: string,
    dto: UpdateFullServiceStatusDto,
    adminUserId: string,
  ) {
    const request = await this.model.findById(id);
    if (!request) throw new NotFoundException('Request not found');

    const allowed = ALLOWED_TRANSITIONS[request.status];
    if (!allowed.includes(dto.status) && dto.status !== request.status) {
      throw new BadRequestException(
        `Cannot transition from "${request.status}" to "${dto.status}"`,
      );
    }

    const now = new Date();
    request.status = dto.status;
    if (dto.adminNotes !== undefined) request.adminNotes = dto.adminNotes;
    if (dto.deliveredDomain !== undefined)
      request.deliveredDomain = dto.deliveredDomain;

    if (
      dto.status === FullServiceRequestStatus.CONTACTED &&
      !request.contactedAt
    ) {
      request.contactedAt = now;
    }
    if (
      dto.status === FullServiceRequestStatus.IN_PROGRESS &&
      !request.startedAt
    ) {
      request.startedAt = now;
    }
    if (dto.status === FullServiceRequestStatus.COMPLETED) {
      request.completedAt = now;
    }

    await request.save();

    this.logger.log(
      `FullServiceRequest ${id} → ${dto.status} by admin ${adminUserId}`,
    );

    return request.toObject();
  }

  async assign(id: string, assigneeId: string) {
    const request = await this.model.findByIdAndUpdate(
      id,
      { assignedTo: new Types.ObjectId(assigneeId) },
      { new: true },
    );
    if (!request) throw new NotFoundException('Request not found');
    return request.toObject();
  }
}
