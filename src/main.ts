import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { FileLogger } from './logger/file.logger';

async function bootstrap() {
  try {
    const logger = new FileLogger();
    logger.debug('Starting application...');

    const app = await NestFactory.create(AppModule, {
      logger: logger,
    });

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: false,
        forbidNonWhitelisted: false,
      }),
    );

    // Swagger configuration
    const config = new DocumentBuilder()
      .setTitle('Doctor AI API')
      .setDescription('Medical symptom analysis and recommendation system API')
      .setVersion('1.0')
      .addTag('Medical')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    logger.debug(`Application started on port ${port}`);
  } catch (error) {
    console.error('Bootstrap error:', error);
    process.exit(1);
  }
}

bootstrap().catch((err) => {
  console.error('Unhandled bootstrap error:', err);
  process.exit(1);
});
