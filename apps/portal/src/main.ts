import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AirGappedLicenseGuard } from '@ovds/shared-domains/infra';
import { PrismaClientToken } from './prisma/prisma.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix('api');

  const prisma = app.get(PrismaClientToken);
  const licenseGuard = new AirGappedLicenseGuard(prisma);
  app.useGlobalGuards(licenseGuard);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Portal API running on port ${port}`);
}

bootstrap();