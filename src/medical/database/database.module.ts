import { Global, Module, Logger } from '@nestjs/common';
import { DatabaseService } from '../services/database.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from '../services/cache.service';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../constants';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    DatabaseService,
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('DatabaseModule');
        logger.debug('Creating Redis client...');
        logger.debug(`Redis URL: ${configService.get('REDIS_URL')}`);
        return new Redis(configService.get('REDIS_URL'));
      },
      inject: [ConfigService],
    },
    {
      provide: 'APP_LOGGER',
      useFactory: () => {
        return new Logger('DatabaseModule');
      },
    },
    CacheService,
  ],
  exports: [DatabaseService, CacheService, REDIS_CLIENT, 'APP_LOGGER']
})
export class DatabaseModule {} 