import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  FullServiceRequest,
  FullServiceRequestSchema,
} from './schemas/full-service-request.schema';
import { FullServiceController } from './full-service.controller';
import { FullServiceService } from './full-service.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FullServiceRequest.name, schema: FullServiceRequestSchema },
    ]),
  ],
  controllers: [FullServiceController],
  providers: [FullServiceService],
  exports: [FullServiceService],
})
export class FullServiceModule {}
