import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './services/redis.service';
import { LoggerService } from './services/logger.service';
import { MetricsService } from './services/metrics.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env']
    })
  ],
  providers: [
    RedisService,
    LoggerService,
    MetricsService
  ],
  exports: [
    RedisService,
    LoggerService,
    MetricsService
  ]
})
export class CommonModule {} 