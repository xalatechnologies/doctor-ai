import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CulturalContextService } from './cultural-context.service';
import { TranslationModule } from '../translation/translation.module';

@Module({
  imports: [ConfigModule, TranslationModule],
  providers: [CulturalContextService],
  exports: [CulturalContextService],
})
export class CulturalContextModule {}
