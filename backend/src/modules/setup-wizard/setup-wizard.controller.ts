import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { SetupWizardService } from './setup-wizard.service';
import {
  SaveBusinessTypeDto,
  SaveLocationDto,
  SaveBusinessHoursDto,
  SaveServicesDto,
  SaveSlotConfigDto,
  SavePricingDto,
  SavePaymentMethodDto,
  SaveCustomerFieldsDto,
} from './dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('setup-wizard')
@Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
export class SetupWizardController {
  constructor(private readonly wizardService: SetupWizardService) {}

  /** GET /setup-wizard — get current wizard progress & all saved data */
  @Get()
  async getProgress(@CurrentTenant() tenantId: string) {
    const data = await this.wizardService.getProgress(tenantId);
    return { success: true, data };
  }

  /** PUT /setup-wizard/step/business-type */
  @Put('step/business-type')
  async saveBusinessType(
    @CurrentTenant() tenantId: string,
    @Body() dto: SaveBusinessTypeDto,
  ) {
    await this.wizardService.saveBusinessType(tenantId, dto);
    return { success: true, message: 'Business type saved' };
  }

  /** PUT /setup-wizard/step/location */
  @Put('step/location')
  async saveLocation(
    @CurrentTenant() tenantId: string,
    @Body() dto: SaveLocationDto,
  ) {
    await this.wizardService.saveLocation(tenantId, dto);
    return { success: true, message: 'Location saved' };
  }

  /** PUT /setup-wizard/step/business-hours */
  @Put('step/business-hours')
  async saveBusinessHours(
    @CurrentTenant() tenantId: string,
    @Body() dto: SaveBusinessHoursDto,
  ) {
    await this.wizardService.saveBusinessHours(tenantId, dto);
    return { success: true, message: 'Business hours saved' };
  }

  /** PUT /setup-wizard/step/services */
  @Put('step/services')
  async saveServices(
    @CurrentTenant() tenantId: string,
    @Body() dto: SaveServicesDto,
  ) {
    await this.wizardService.saveServices(tenantId, dto);
    return { success: true, message: 'Services saved' };
  }

  /** PUT /setup-wizard/step/slot-config */
  @Put('step/slot-config')
  async saveSlotConfig(
    @CurrentTenant() tenantId: string,
    @Body() dto: SaveSlotConfigDto,
  ) {
    await this.wizardService.saveSlotConfig(tenantId, dto);
    return { success: true, message: 'Slot configuration saved' };
  }

  /** PUT /setup-wizard/step/pricing */
  @Put('step/pricing')
  async savePricing(
    @CurrentTenant() tenantId: string,
    @Body() dto: SavePricingDto,
  ) {
    await this.wizardService.savePricing(tenantId, dto);
    return { success: true, message: 'Pricing saved' };
  }

  /** PUT /setup-wizard/step/payment-method */
  @Put('step/payment-method')
  async savePaymentMethod(
    @CurrentTenant() tenantId: string,
    @Body() dto: SavePaymentMethodDto,
  ) {
    await this.wizardService.savePaymentMethod(tenantId, dto);
    return { success: true, message: 'Payment method saved' };
  }

  /** PUT /setup-wizard/step/customer-fields */
  @Put('step/customer-fields')
  async saveCustomerFields(
    @CurrentTenant() tenantId: string,
    @Body() dto: SaveCustomerFieldsDto,
  ) {
    await this.wizardService.saveCustomerFields(tenantId, dto);
    return { success: true, message: 'Customer fields saved' };
  }

  /** POST /setup-wizard/finalize — apply all wizard data and activate */
  @Post('finalize')
  async finalize(@CurrentTenant() tenantId: string) {
    const result = await this.wizardService.finalizeSetup(tenantId);
    return result;
  }
}
