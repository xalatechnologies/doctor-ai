import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TerminusModule } from '@nestjs/terminus';
import { ClientsModule, Transport } from '@nestjs/microservices';
import configuration, { configValidationSchema } from './config/configuration';
import { HealthController } from './health/health.controller';
import { SymptomAnalysis, SymptomAnalysisSchema } from './schemas/symptom-analysis.schema';
import { User, UserSchema } from './schemas/user.schema';
import { SymptomAnalysisService } from './services/symptom-analysis.service';
import { SymptomAnalysisController } from './controllers/symptom-analysis.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: configValidationSchema,
      envFilePath: ['../../.env']
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('config.mongodb.uri'),
        dbName: configService.get<string>('config.mongodb.dbName'),
        ...configService.get('config.mongodb.options')
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: SymptomAnalysis.name, schema: SymptomAnalysisSchema },
      { name: User.name, schema: UserSchema }
    ]),
    TerminusModule,
    ClientsModule.registerAsync([
      {
        name: 'RABBITMQ_SERVICE',
        useFactory: (configService: ConfigService) => {
          const url = configService.get<string>('config.rabbitmq.url');
          if (!url) {
            throw new Error('RABBITMQ_URL is not defined');
          }
          return {
            transport: Transport.RMQ,
            options: {
              urls: [url],
              queue: 'symptom_analysis_queue',
              queueOptions: {
                durable: true
              },
              noAck: false,
              prefetchCount: 1,
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [HealthController, SymptomAnalysisController],
  providers: [SymptomAnalysisService],
})
export class AppModule {} 