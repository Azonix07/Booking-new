import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SetupWizardController } from './setup-wizard.controller';
import { SetupWizardService } from './setup-wizard.service';
import { SetupWizard, SetupWizardSchema } from './schemas/setup-wizard.schema';
import { Tenant, TenantSchema } from '../tenants/schemas/tenant.schema';
import { Service, ServiceSchema } from '../services/schemas/service.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SetupWizard.name, schema: SetupWizardSchema },
      { name: Tenant.name, schema: TenantSchema },
      { name: Service.name, schema: ServiceSchema },
    ]),
  ],
  controllers: [SetupWizardController],
  providers: [SetupWizardService],
  exports: [SetupWizardService],
})
export class SetupWizardModule {}
