import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';

describe('Password Reset Token Validation (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testUserId: string;
  let resetToken: string;

  beforeAll(async () => {
    const moduleFixture: Test.TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    const user = await prisma.user.upsert({
      where: { username: 'passwordresettest' },
      create: {
        username: 'passwordresettest',
        password: 'hashed-password',
        role: 'USER',
        email: 'test@example.com',
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      update: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    testUserId = user.id;
  });

  afterEach(async () => {
    await prisma.user.deleteMany({ where: { username: 'passwordresettest' } });
  });

  test('should reject expired password reset tokens', async () => {
    const user = await prisma.user.findUnique({
      where: { id: testUserId },
    });

    if (user) {
      const expiredToken = 'expired-token-12345';
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: expiredToken,
          expiresAt: new Date(Date.now() - 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({ token: expiredToken, password: 'NewPassword123!' })
        .expect(400);

      expect(response.body.message).toContain('expired');
    }
  });

  test('should reject reused password reset tokens', async () => {
    const user = await prisma.user.findUnique({
      where: { id: testUserId },
    });

    if (user) {
      const validToken = 'valid-token-67890';
      const futureDate = new Date(Date.now() + 3600000);

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: validToken,
          expiresAt: futureDate,
        },
      });

      const firstReset = await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({ token: validToken, password: 'NewPassword123!' })
        .expect(200);

      expect(firstReset.body.message).toContain('success');

      const secondReset = await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({ token: validToken, password: 'AnotherPassword123!' })
        .expect(400);

      expect(secondReset.body.message).toContain('invalid');
    }
  });

  test('should invalidate sessions after password change', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'passwordresettest', password: 'correct-password' });

    if (loginResponse.status === 200) {
      const token = loginResponse.body.access_token;

      await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ oldPassword: 'correct-password', newPassword: 'NewPassword123!' })
        .expect(200);

      const validationResponse = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(validationResponse.status).toBe(401);
    }
  });
});
