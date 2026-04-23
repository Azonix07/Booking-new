import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Service, ServiceDocument } from './schemas/service.schema';
import { CreateServiceDto, UpdateServiceDto, ReorderServicesDto } from './dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════════
  //  PUBLIC — storefront
  // ═══════════════════════════════════════════════════════════════════════════════

  async findAllByTenant(tenantId: string) {
    return this.serviceModel
      .find({ tenantId: new Types.ObjectId(tenantId), isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();
  }

  async findById(tenantId: string, serviceId: string) {
    const service = await this.serviceModel
      .findOne({
        _id: new Types.ObjectId(serviceId),
        tenantId: new Types.ObjectId(tenantId),
      })
      .lean();

    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  ADMIN — list all (including inactive)
  // ═══════════════════════════════════════════════════════════════════════════════

  async findAllForAdmin(tenantId: string) {
    return this.serviceModel
      .find({ tenantId: new Types.ObjectId(tenantId) })
      .sort({ sortOrder: 1, name: 1 })
      .lean();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  CREATE
  // ═══════════════════════════════════════════════════════════════════════════════

  async create(tenantId: string, dto: CreateServiceDto): Promise<ServiceDocument> {
    const service = new this.serviceModel({
      ...dto,
      tenantId: new Types.ObjectId(tenantId),
      maxTotalPlayers: (dto.numberOfDevices ?? 1) * (dto.maxPlayersPerDevice ?? 1),
    });
    return service.save();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  UPDATE
  // ═══════════════════════════════════════════════════════════════════════════════

  async update(
    tenantId: string,
    serviceId: string,
    dto: UpdateServiceDto,
  ): Promise<ServiceDocument> {
    const service = await this.serviceModel.findOne({
      _id: new Types.ObjectId(serviceId),
      tenantId: new Types.ObjectId(tenantId),
    });

    if (!service) throw new NotFoundException('Service not found');

    // Apply fields
    const fields: Array<keyof UpdateServiceDto> = [
      'name', 'description', 'images', 'category',
      'numberOfDevices', 'maxPlayersPerDevice',
      'defaultDuration', 'bufferTime', 'durationOptions',
      'price', 'pricePerAdditionalPerson', 'currency',
      'minPersons', 'maxPersons', 'sortOrder', 'isActive',
    ];

    for (const field of fields) {
      if (dto[field] !== undefined) {
        (service as any)[field] = dto[field];
      }
    }

    // Recompute capacity if device config changed
    if (dto.numberOfDevices !== undefined || dto.maxPlayersPerDevice !== undefined) {
      service.maxTotalPlayers = service.numberOfDevices * service.maxPlayersPerDevice;
    }

    return service.save();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  DELETE (soft — set isActive = false)
  // ═══════════════════════════════════════════════════════════════════════════════

  async softDelete(tenantId: string, serviceId: string): Promise<ServiceDocument> {
    const service = await this.serviceModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(serviceId),
        tenantId: new Types.ObjectId(tenantId),
      },
      { $set: { isActive: false } },
      { new: true },
    );

    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  REORDER — update sortOrder for multiple services at once
  // ═══════════════════════════════════════════════════════════════════════════════

  async reorder(tenantId: string, dto: ReorderServicesDto): Promise<void> {
    const ops = dto.items.map((item) => ({
      updateOne: {
        filter: {
          _id: new Types.ObjectId(item.serviceId),
          tenantId: new Types.ObjectId(tenantId),
        },
        update: { $set: { sortOrder: item.sortOrder } },
      },
    }));

    await this.serviceModel.bulkWrite(ops);
  }
}
