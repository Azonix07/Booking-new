import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  WebsiteConfig,
  WebsiteConfigSchema,
} from './schemas/website-config.schema';
import { WebsiteConfigController } from './website-config.controller';
import { WebsiteConfigService } from './website-config.service';
import { AiWebsiteService } from './ai-website.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WebsiteConfig.name, schema: WebsiteConfigSchema },
    ]),
  ],
  controllers: [WebsiteConfigController],
  providers: [WebsiteConfigService, AiWebsiteService],
  exports: [WebsiteConfigService, AiWebsiteService],
})
export class WebsiteConfigModule {}
