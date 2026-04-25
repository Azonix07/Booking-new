import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AiAssistantController } from './ai-assistant.controller';
import { AiAssistantService } from './ai-assistant.service';
import { Tenant, TenantSchema } from '../tenants/schemas/tenant.schema';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import {
  SetupWizard,
  SetupWizardSchema,
} from '../setup-wizard/schemas/setup-wizard.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: SetupWizard.name, schema: SetupWizardSchema },
    ]),
  ],
  controllers: [AiAssistantController],
  providers: [AiAssistantService],
  exports: [AiAssistantService],
})
export class AiAssistantModule {}
