import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument, BookingStatus } from '../bookings/schemas/booking.schema';
import { Service, ServiceDocument } from '../services/schemas/service.schema';
import { DashboardPeriod, BookingsFilterDto } from './dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════════
  //  STATS OVERVIEW — key metrics for dashboard cards
  // ═══════════════════════════════════════════════════════════════════════════════

  async getStats(tenantId: string, period: DashboardPeriod = DashboardPeriod.TODAY) {
    const tid = new Types.ObjectId(tenantId);
    const dateRange = this.getDateRange(period);

    const [
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      revenueAgg,
      todaysBookings,
      upcomingBookings,
      serviceCount,
    ] = await Promise.all([
      // All bookings in period
      this.bookingModel.countDocuments({
        tenantId: tid,
        createdAt: dateRange,
      }),
      // Confirmed bookings in period
      this.bookingModel.countDocuments({
        tenantId: tid,
        createdAt: dateRange,
        status: BookingStatus.CONFIRMED,
      }),
      // Cancelled in period
      this.bookingModel.countDocuments({
        tenantId: tid,
        createdAt: dateRange,
        status: BookingStatus.CANCELLED,
      }),
      // Revenue in period
      this.bookingModel.aggregate([
        {
          $match: {
            tenantId: tid,
            createdAt: dateRange,
            status: { $nin: [BookingStatus.CANCELLED, BookingStatus.REFUNDED] },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalPlayers: { $sum: '$numberOfPersons' },
          },
        },
      ]),
      // Today's bookings count
      this.bookingModel.countDocuments({
        tenantId: tid,
        date: this.todayUTC(),
        status: { $nin: [BookingStatus.CANCELLED, BookingStatus.REFUNDED] },
      }),
      // Upcoming (future) bookings
      this.bookingModel.countDocuments({
        tenantId: tid,
        date: { $gte: this.todayUTC() },
        status: BookingStatus.CONFIRMED,
      }),
      // Active services
      this.serviceModel.countDocuments({ tenantId: tid, isActive: true }),
    ]);

    const rev = revenueAgg[0] || { totalRevenue: 0, totalPlayers: 0 };

    return {
      period,
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      totalRevenue: rev.totalRevenue,
      totalPlayers: rev.totalPlayers,
      todaysBookings,
      upcomingBookings,
      activeServices: serviceCount,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  BOOKINGS LIST — paginated, filterable
  // ═══════════════════════════════════════════════════════════════════════════════

  async getBookings(tenantId: string, filter: BookingsFilterDto) {
    const tid = new Types.ObjectId(tenantId);
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const query: any = { tenantId: tid };

    // Date range filter
    if (filter.startDate || filter.endDate) {
      query.date = {};
      if (filter.startDate) query.date.$gte = new Date(filter.startDate + 'T00:00:00.000Z');
      if (filter.endDate) query.date.$lte = new Date(filter.endDate + 'T00:00:00.000Z');
    }

    // Service filter
    if (filter.serviceId) {
      query.serviceId = new Types.ObjectId(filter.serviceId);
    }

    // Status filter
    if (filter.status) {
      query.status = filter.status;
    }

    // Search by booking ref or notes
    if (filter.search) {
      query.$or = [
        { bookingRef: { $regex: filter.search, $options: 'i' } },
        { customerNotes: { $regex: filter.search, $options: 'i' } },
      ];
    }

    const [bookings, total] = await Promise.all([
      this.bookingModel
        .find(query)
        .populate('serviceId', 'name category images')
        .populate('customerId', 'name email phone')
        .sort({ date: -1, startTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.bookingModel.countDocuments(query),
    ]);

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  RECENT BOOKINGS — latest N bookings for quick view
  // ═══════════════════════════════════════════════════════════════════════════════

  async getRecentBookings(tenantId: string, count: number = 10) {
    return this.bookingModel
      .find({ tenantId: new Types.ObjectId(tenantId) })
      .populate('serviceId', 'name category')
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(count)
      .lean();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  REVENUE BY SERVICE — breakdown for charts
  // ═══════════════════════════════════════════════════════════════════════════════

  async getRevenueByService(tenantId: string, period: DashboardPeriod = DashboardPeriod.MONTH) {
    const tid = new Types.ObjectId(tenantId);
    const dateRange = this.getDateRange(period);

    return this.bookingModel.aggregate([
      {
        $match: {
          tenantId: tid,
          createdAt: dateRange,
          status: { $nin: [BookingStatus.CANCELLED, BookingStatus.REFUNDED] },
        },
      },
      {
        $group: {
          _id: '$serviceId',
          totalRevenue: { $sum: '$totalAmount' },
          totalBookings: { $sum: 1 },
          totalPlayers: { $sum: '$numberOfPersons' },
        },
      },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'service',
        },
      },
      { $unwind: '$service' },
      {
        $project: {
          serviceName: '$service.name',
          category: '$service.category',
          totalRevenue: 1,
          totalBookings: 1,
          totalPlayers: 1,
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  DAILY BOOKING TREND — aggregation for chart
  // ═══════════════════════════════════════════════════════════════════════════════

  async getDailyTrend(tenantId: string, days: number = 30) {
    const tid = new Types.ObjectId(tenantId);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    return this.bookingModel.aggregate([
      {
        $match: {
          tenantId: tid,
          date: { $gte: startDate },
          status: { $nin: [BookingStatus.CANCELLED, BookingStatus.REFUNDED] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          bookings: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          players: { $sum: '$numberOfPersons' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          bookings: 1,
          revenue: 1,
          players: 1,
          _id: 0,
        },
      },
    ]);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  Helpers
  // ═══════════════════════════════════════════════════════════════════════════════

  private getDateRange(period: DashboardPeriod): { $gte: Date; $lte: Date } {
    const now = new Date();
    const start = new Date();

    switch (period) {
      case DashboardPeriod.TODAY:
        start.setHours(0, 0, 0, 0);
        break;
      case DashboardPeriod.WEEK:
        start.setDate(now.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      case DashboardPeriod.MONTH:
        start.setDate(now.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        break;
    }

    return { $gte: start, $lte: now };
  }

  private todayUTC(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }
}
