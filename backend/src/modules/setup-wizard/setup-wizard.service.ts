import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  SetupWizard,
  SetupWizardDocument,
  WizardStep,
  WizardStatus,
} from './schemas/setup-wizard.schema';
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
import { Tenant, TenantDocument, TenantStatus } from '../tenants/schemas/tenant.schema';
import { Service, ServiceDocument } from '../services/schemas/service.schema';

const STEP_ORDER: WizardStep[] = [
  WizardStep.BUSINESS_TYPE,
  WizardStep.LOCATION,
  WizardStep.BUSINESS_HOURS,
  WizardStep.SERVICES,
  WizardStep.SLOT_CONFIG,
  WizardStep.PRICING,
  WizardStep.PAYMENT_METHOD,
  WizardStep.CUSTOMER_FIELDS,
  WizardStep.REVIEW_CREATE,
];

@Injectable()
export class SetupWizardService {
  private readonly logger = new Logger(SetupWizardService.name);

  constructor(
    @InjectModel(SetupWizard.name) private wizardModel: Model<SetupWizardDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
  ) {}

  // ─── Get or create wizard ─────────────────────────────────────────────────

  async getOrCreateWizard(tenantId: string): Promise<SetupWizardDocument> {
    let wizard = await this.wizardModel.findOne({
      tenantId: new Types.ObjectId(tenantId),
    });

    if (!wizard) {
      wizard = await this.wizardModel.create({
        tenantId: new Types.ObjectId(tenantId),
      });
      this.logger.log(`Setup wizard created for tenant ${tenantId}`);
    }

    return wizard;
  }

  // ─── Get current progress ─────────────────────────────────────────────────

  async getProgress(tenantId: string) {
    const wizard = await this.getOrCreateWizard(tenantId);
    return {
      currentStep: wizard.currentStep,
      currentStepNumber: wizard.currentStepNumber,
      status: wizard.status,
      completedSteps: wizard.completedSteps,
      totalSteps: 9,
      data: {
        businessType: wizard.businessType,
        location: wizard.location,
        businessHours: wizard.businessHours,
        services: wizard.services,
        slotConfig: wizard.slotConfig,
        pricing: wizard.pricing,
        paymentMethod: wizard.paymentMethod,
        customerFields: wizard.customerFields,
      },
    };
  }

  // ─── Step 1: Business Type ────────────────────────────────────────────────

  async saveBusinessType(tenantId: string, dto: SaveBusinessTypeDto) {
    const wizard = await this.getOrCreateWizard(tenantId);
    wizard.businessType = {
      category: dto.category,
      customCategory: dto.customCategory,
    };
    this.markStepComplete(wizard, WizardStep.BUSINESS_TYPE, 1);
    return wizard.save();
  }

  // ─── Step 2: Location ─────────────────────────────────────────────────

  async saveLocation(tenantId: string, dto: SaveLocationDto) {
    const wizard = await this.getOrCreateWizard(tenantId);
    wizard.location = {
      address: dto.address,
      coordinates: dto.coordinates,
      gmapUrl: dto.gmapUrl,
    };
    this.markStepComplete(wizard, WizardStep.LOCATION, 2);
    return wizard.save();
  }

  // ─── Step 3: Business Hours ───────────────────────────────────────────────

  async saveBusinessHours(tenantId: string, dto: SaveBusinessHoursDto) {
    const wizard = await this.getOrCreateWizard(tenantId);
    wizard.businessHours = {
      sameForAllDays: dto.sameForAllDays,
      hours: dto.hours,
    };
    this.markStepComplete(wizard, WizardStep.BUSINESS_HOURS, 3);
    return wizard.save();
  }

  // ─── Step 3: Services ─────────────────────────────────────────────────────

  async saveServices(tenantId: string, dto: SaveServicesDto) {
    const wizard = await this.getOrCreateWizard(tenantId);
    wizard.services = dto.services;
    this.markStepComplete(wizard, WizardStep.SERVICES, 4);
    return wizard.save();
  }

  // ─── Step 4: Slot Config ──────────────────────────────────────────────────

  async saveSlotConfig(tenantId: string, dto: SaveSlotConfigDto) {
    const wizard = await this.getOrCreateWizard(tenantId);
    wizard.slotConfig = dto;
    this.markStepComplete(wizard, WizardStep.SLOT_CONFIG, 5);
    return wizard.save();
  }

  // ─── Step 5: Pricing ──────────────────────────────────────────────────────

  async savePricing(tenantId: string, dto: SavePricingDto) {
    const wizard = await this.getOrCreateWizard(tenantId);
    wizard.pricing = dto.pricing.map((p) => ({
      serviceName: p.serviceName,
      basePrice: p.basePrice,
      pricePerAdditionalPerson: p.pricePerAdditionalPerson || 0,
      currency: p.currency || 'INR',
      durationOptions: p.durationOptions,
    }));
    this.markStepComplete(wizard, WizardStep.PRICING, 6);
    return wizard.save();
  }

  // ─── Step 6: Payment Method ───────────────────────────────────────────────

  async savePaymentMethod(tenantId: string, dto: SavePaymentMethodDto) {
    const wizard = await this.getOrCreateWizard(tenantId);
    wizard.paymentMethod = dto;
    this.markStepComplete(wizard, WizardStep.PAYMENT_METHOD, 7);
    return wizard.save();
  }

  // ─── Step 7: Customer Fields ──────────────────────────────────────────────

  async saveCustomerFields(tenantId: string, dto: SaveCustomerFieldsDto) {
    const wizard = await this.getOrCreateWizard(tenantId);
    wizard.customerFields = {
      nameRequired: dto.nameRequired,
      phoneRequired: dto.phoneRequired,
      emailRequired: dto.emailRequired,
      customFields: dto.customFields || [],
    };
    this.markStepComplete(wizard, WizardStep.CUSTOMER_FIELDS, 8);
    return wizard.save();
  }

  // ─── Step 8: Finalize — apply wizard data to actual tenant + services ─────

  async finalizeSetup(tenantId: string) {
    const wizard = await this.getOrCreateWizard(tenantId);

    // Apply business type to tenant
    if (wizard.businessType?.category) {
      await this.tenantModel.findByIdAndUpdate(tenantId, {
        category: wizard.businessType.customCategory || wizard.businessType.category,
      });
    }

    // Apply business hours to tenant
    if (wizard.businessHours?.hours?.length) {
      await this.tenantModel.findByIdAndUpdate(tenantId, {
        businessHours: wizard.businessHours.hours,
      });
    }

    // Apply location to tenant
    if (wizard.location?.coordinates) {
      const update: any = {
        location: {
          type: 'Point',
          coordinates: [
            wizard.location.coordinates.longitude,
            wizard.location.coordinates.latitude,
          ],
        },
      };
      if (wizard.location.address) {
        update.address = wizard.location.address;
      }
      await this.tenantModel.findByIdAndUpdate(tenantId, update);
    }

    // Apply slot config to tenant shopSettings
    if (wizard.slotConfig) {
      await this.tenantModel.findByIdAndUpdate(tenantId, {
        'shopSettings.slotInterval': wizard.slotConfig.slotDurationMinutes,
        'shopSettings.minBookingNotice': wizard.slotConfig.minBookingNoticeHours ?? 1,
        'shopSettings.maxAdvanceBooking': wizard.slotConfig.maxAdvanceBookingDays ?? 30,
        'shopSettings.bufferBetweenSlots': wizard.slotConfig.bufferBetweenSlotsMinutes ?? 0,
        'shopSettings.allowWalkIns': wizard.slotConfig.allowWalkIns,
      });
    }

    // Apply payment method
    if (wizard.paymentMethod) {
      await this.tenantModel.findByIdAndUpdate(tenantId, {
        'shopSettings.requirePaymentUpfront': wizard.paymentMethod.acceptOnlinePayment,
        'shopSettings.payAtShop': wizard.paymentMethod.acceptPayAtShop,
        'shopSettings.showPriceBeforeBooking': wizard.paymentMethod.showPriceBeforeBooking,
      });
    }

    // Create actual Service documents from wizard data
    if (wizard.services?.length) {
      // Remove any existing services for this tenant (fresh setup)
      await this.serviceModel.deleteMany({ tenantId: new Types.ObjectId(tenantId) });

      for (let i = 0; i < wizard.services.length; i++) {
        const ws = wizard.services[i];
        const pricing = wizard.pricing?.find((p) => p.serviceName === ws.name);

        await this.serviceModel.create({
          tenantId: new Types.ObjectId(tenantId),
          name: ws.name,
          description: ws.description || '',
          category: ws.category || wizard.businessType?.category || '',
          numberOfDevices: ws.numberOfDevices,
          maxPlayersPerDevice: ws.maxPlayersPerDevice,
          maxTotalPlayers: ws.numberOfDevices * ws.maxPlayersPerDevice,
          defaultDuration: pricing?.durationOptions?.[0]?.minutes || 60,
          price: pricing?.basePrice || 0,
          pricePerAdditionalPerson: pricing?.pricePerAdditionalPerson || 0,
          currency: pricing?.currency || 'INR',
          durationOptions: pricing?.durationOptions || [],
          minPersons: 1,
          maxPersons: ws.numberOfDevices * ws.maxPlayersPerDevice,
          sortOrder: i,
          isActive: true,
        });
      }
    }

    // Don't activate tenant yet — user must select a subscription plan first.
    // Tenant stays in pending_setup until plan selection + approval.

    // Mark wizard as complete
    wizard.status = WizardStatus.COMPLETED;
    this.markStepComplete(wizard, WizardStep.REVIEW_CREATE, 9);
    await wizard.save();

    this.logger.log(`Setup wizard completed for tenant ${tenantId} — awaiting plan selection`);
    return { success: true, message: 'Setup completed. Please select a plan.' };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private markStepComplete(
    wizard: SetupWizardDocument,
    step: WizardStep,
    stepNumber: number,
  ) {
    if (!wizard.completedSteps.includes(step)) {
      wizard.completedSteps.push(step);
    }
    // Advance current step to the next one
    const nextIndex = STEP_ORDER.indexOf(step) + 1;
    if (nextIndex < STEP_ORDER.length) {
      wizard.currentStep = STEP_ORDER[nextIndex];
      wizard.currentStepNumber = stepNumber + 1;
    } else {
      wizard.currentStepNumber = 8;
    }
  }
}
