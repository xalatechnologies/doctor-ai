import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { getRabbitMQConfig } from '@rabbitmq/rabbitmq.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Configure global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Configure CORS
  app.enableCors({
    origin: configService.get('cors.origin') || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  });

  // Configure RabbitMQ microservice
  app.connectMicroservice(getRabbitMQConfig(configService));

  // Start microservices
  await app.startAllMicroservices();

  // Start HTTP server
  const port = configService.get('port') || 3003;
  await app.listen(port);
  
  console.log(`Emergency Service is running on port ${port}`);
  console.log('RabbitMQ transport is ready');
}

bootstrap().catch((error) => {
  console.error('Failed to start the application:', error);
  process.exit(1);
}); 