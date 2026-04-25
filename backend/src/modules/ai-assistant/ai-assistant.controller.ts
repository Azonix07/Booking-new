import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';
import {
  AiChatDto,
  FloorPlannerDto,
  ConfusionDetectDto,
} from './dto/ai-assistant.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('ai-assistant')
export class AiAssistantController {
  constructor(private readonly aiService: AiAssistantService) {}

  @Post('chat')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async chat(
    @CurrentTenant() tenantId: string,
    @Body() dto: AiChatDto,
  ) {
    return this.aiService.chat(tenantId, dto);
  }

  @Post('floor-plan')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async generateFloorPlan(
    @CurrentTenant() tenantId: string,
    @Body() dto: FloorPlannerDto,
  ) {
    return this.aiService.generateFloorPlan(tenantId, dto);
  }

  @Post('detect-confusion')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async detectConfusion(
    @CurrentTenant() tenantId: string,
    @Body() dto: ConfusionDetectDto,
  ) {
    return this.aiService.detectConfusion(tenantId, dto);
  }

  @Get('suggest-services')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async suggestServices(@Query('category') category: string) {
    return this.aiService.suggestServices(category);
  }
}
