import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../redis';
import { ServiceRequestsService } from './service-requests.service';

interface AuthSocket extends Socket {
  userId?: string;
  tenantId?: string;
  role?: string;
}

@WebSocketGateway({
  namespace: '/tracking',
  cors: {
    origin: true,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingGateway.name);

  // Provider socket mapping: providerId -> socketId
  private providerSockets = new Map<string, string>();

  // Throttle tracker: providerId -> last update timestamp
  private lastLocationUpdate = new Map<string, number>();
  private readonly MIN_UPDATE_INTERVAL = 3000; // 3 seconds minimum between updates

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly requestsService: ServiceRequestsService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  // ─── Connection lifecycle ────────────────────────────────────────────────────

  async handleConnection(client: AuthSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        throw new UnauthorizedException('No token');
      }

      const secret = this.configService.get<string>('jwt.secret');
      const payload = this.jwtService.verify(token, { secret });

      client.userId = payload.sub;
      client.tenantId = payload.tenantId;
      client.role = payload.role;

      this.logger.log(`Client connected: ${client.userId} (${client.role})`);
    } catch {
      this.logger.warn(`Unauthorized connection attempt`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthSocket) {
    if (client.userId) {
      this.providerSockets.delete(client.userId);
      this.logger.log(`Client disconnected: ${client.userId}`);
    }
  }

  // ─── Join tracking room ──────────────────────────────────────────────────────

  @SubscribeMessage('join-tracking')
  async handleJoinTracking(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { requestId: string },
  ) {
    if (!client.userId || !data.requestId) return;

    // Verify the user is authorized for this request
    try {
      await this.requestsService.getRequestById(data.requestId, client.userId);
    } catch {
      client.emit('error', { message: 'Not authorized for this tracking session' });
      return;
    }

    const room = `tracking:${data.requestId}`;
    client.join(room);

    // If provider, register socket mapping
    if (client.role === 'client_admin') {
      this.providerSockets.set(client.userId, client.id);
    }

    // Send current tracking state
    const tracking = await this.requestsService.getTrackingSession(data.requestId);
    const location = await this.requestsService.getLocationFromCache(data.requestId);

    client.emit('tracking-state', {
      tracking,
      liveLocation: location,
    });

    this.logger.log(`${client.userId} joined tracking room ${room}`);
  }

  @SubscribeMessage('leave-tracking')
  handleLeaveTracking(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { requestId: string },
  ) {
    if (data.requestId) {
      client.leave(`tracking:${data.requestId}`);
    }
  }

  // ─── Provider sends location update ──────────────────────────────────────────

  @SubscribeMessage('location-update')
  async handleLocationUpdate(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody()
    data: {
      requestId: string;
      latitude: number;
      longitude: number;
      heading?: number;
      speed?: number;
    },
  ) {
    if (!client.userId || client.role !== 'client_admin') return;

    // Throttle: minimum 3 seconds between updates
    const now = Date.now();
    const lastUpdate = this.lastLocationUpdate.get(client.userId) || 0;
    if (now - lastUpdate < this.MIN_UPDATE_INTERVAL) return;
    this.lastLocationUpdate.set(client.userId, now);

    // Persist to DB + Redis
    await this.requestsService.updateLocation(client.userId, {
      requestId: data.requestId,
      latitude: data.latitude,
      longitude: data.longitude,
      heading: data.heading,
      speed: data.speed,
    });

    // Broadcast to all users in the tracking room
    const room = `tracking:${data.requestId}`;
    this.server.to(room).emit('provider-location', {
      requestId: data.requestId,
      latitude: data.latitude,
      longitude: data.longitude,
      heading: data.heading || 0,
      speed: data.speed || 0,
      timestamp: now,
    });
  }

  // ─── Provider sends status update ────────────────────────────────────────────

  @SubscribeMessage('status-update')
  async handleStatusUpdate(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { requestId: string; status: string },
  ) {
    if (!client.userId || client.role !== 'client_admin') return;

    // Broadcast status change to the tracking room
    const room = `tracking:${data.requestId}`;
    this.server.to(room).emit('status-changed', {
      requestId: data.requestId,
      status: data.status,
      timestamp: Date.now(),
    });

    // If completed, clean up
    if (data.status === 'completed') {
      this.providerSockets.delete(client.userId);
      this.lastLocationUpdate.delete(client.userId);

      // Disconnect all clients from room after a delay
      setTimeout(() => {
        this.server.to(room).emit('tracking-ended', { requestId: data.requestId });
      }, 2000);
    }
  }

  // ─── ETA update ──────────────────────────────────────────────────────────────

  @SubscribeMessage('eta-update')
  handleEtaUpdate(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { requestId: string; etaMinutes: number; distanceKm: number },
  ) {
    if (!client.userId || client.role !== 'client_admin') return;

    const room = `tracking:${data.requestId}`;
    this.server.to(room).emit('eta-changed', {
      requestId: data.requestId,
      etaMinutes: data.etaMinutes,
      distanceKm: data.distanceKm,
      timestamp: Date.now(),
    });
  }
}
