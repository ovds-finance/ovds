import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';

describe('MFA/2FA Enforcement (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testUserId: string;

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
      where: { username: 'mfauser' },
      create: {
        username: 'mfauser',
        password: 'hashed-password',
        role: 'USER',
        email: 'mfa@example.com',
        mfaEnrolled: true,
        mfaEnforced: false,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      update: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        mfaEnrolled: true,
        mfaEnforced: false,
      },
    });
    testUserId = user.id;
  });

  afterEach(async () => {
    await prisma.user.deleteMany({ where: { username: 'mfauser' } });
  });

  test('should require MFA when enrolled', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'mfauser', password: 'correct-password' });

    expect(response.status).toBe(200);
    expect(response.body.mfa_required).toBe(true);
    expect(response.body.userId).toBe(testUserId);
  });

  test('should not return access token when MFA is required', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'mfauser', password: 'correct-password' });

    expect(response.body.access_token).toBeUndefined();
    expect(response.body.mfa_required).toBe(true);
  });

  test('should enforce MFA when mfaEnforced is true', async () => {
    await prisma.user.update({
      where: { id: testUserId },
      data: { mfaEnforced: true },
    });

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'mfauser', password: 'correct-password' });

    expect(response.status).toBe(200);
    expect(response.body.mfa_required).toBe(true);
  });

  test('should not require MFA when not enrolled', async () => {
    await prisma.user.update({
      where: { id: testUserId },
      data: { mfaEnrolled: false },
    });

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'mfauser', password: 'correct-password' });

    expect(response.status).toBe(200);
    expect(response.body.mfa_required).toBeUndefined();
    expect(response.body.access_token).toBeDefined();
  });
});
