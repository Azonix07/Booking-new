import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServiceRequest, ServiceRequestSchema } from './schemas/service-request.schema';
import { TrackingSession, TrackingSessionSchema } from './schemas/tracking-session.schema';
import { ServiceRequestsController } from './service-requests.controller';
import { ServiceRequestsService } from './service-requests.service';
import { TrackingGateway } from './tracking.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServiceRequest.name, schema: ServiceRequestSchema },
      { name: TrackingSession.name, schema: TrackingSessionSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestsService, TrackingGateway],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {}
