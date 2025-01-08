import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TranslationService } from './translation.service';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [ConfigModule, CacheModule],
  providers: [TranslationService],
  exports: [TranslationService],
})
export class TranslationModule {}
