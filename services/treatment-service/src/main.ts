import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { getRabbitMQConfig } from '@rabbitmq/rabbitmq.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Configure validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // Configure CORS
  app.enableCors({
    origin: configService.get<string>('cors.origin'),
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Configure RabbitMQ microservice
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: getRabbitMQConfig(configService),
  });

  await app.startAllMicroservices();
  
  const port = configService.get<number>('port');
  await app.listen(port);
  
  console.log(`Treatment service is running on port ${port}`);
}

bootstrap(); 