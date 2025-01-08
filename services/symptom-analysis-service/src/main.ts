import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { getRootPath } from './config/configuration';
import * as dotenv from 'dotenv';

async function bootstrap() {
  // Load root .env file
  dotenv.config({ path: `${getRootPath()}/.env` });

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
  app.enableCors();

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('Symptom Analysis Service')
    .setDescription('API documentation for the Symptom Analysis Service')
    .setVersion('1.0')
    .addTag('symptom-analysis')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Start HTTP server
  const port = configService.get('config.port');
  await app.listen(port);
  
  console.log(`Symptom Analysis Service is running on port ${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start the application:', error);
  process.exit(1);
}); 