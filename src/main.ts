import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina campos que no están en el DTO
      forbidNonWhitelisted: true, // y responde 400 si los envían
      transform: true, // convierte tipos (ej: "5" -> 5 en query params)
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Sistema de Seguimiento de Egresados ICCI')
    .setDescription(
      'API del Sprint 1: inicio de sesión por rol (HU-13), registro (HU-01), consulta y ' +
        'actualización (HU-02), carga masiva (HU-03) y comunicaciones (HU-04).\n\n' +
        'Para probar los endpoints protegidos: usa POST /api/auth/login, copia el ' +
        '`access_token` y pégalo en el botón **Authorize**.',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`API escuchando en http://localhost:${port}/api`);
  console.log(`Swagger disponible en http://localhost:${port}/docs`);
}
bootstrap();
