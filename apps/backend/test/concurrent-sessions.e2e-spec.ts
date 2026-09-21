import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';

describe('Concurrent Session Limits (E2E)', () => {
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
      where: { username: 'sessionlimittest' },
      create: {
        username: 'sessionlimittest',
        password: 'hashed-password',
        role: 'USER',
        failedLoginAttempts: 0,
        lockedUntil: null,
        sessionsCount: 0,
      },
      update: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        sessionsCount: 0,
      },
    });
    testUserId = user.id;
  });

  afterEach(async () => {
    await prisma.user.deleteMany({ where: { username: 'sessionlimittest' } });
  });

  test('should track multiple concurrent sessions', async () => {
    const loginPromises = [];
    for (let i = 0; i < 3; i++) {
      loginPromises.push(
        request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ username: 'sessionlimittest', password: 'correct-password' })
      );
    }

    const responses = await Promise.all(loginPromises);
    const successfulLogins = responses.filter(r => r.status === 200 && r.body.access_token);

    expect(successfulLogins.length).toBeGreaterThan(0);

    const user = await prisma.user.findUnique({
      where: { id: testUserId },
      select: { sessionsCount: true },
    });

    expect(user?.sessionsCount).toBeGreaterThanOrEqual(successfulLogins.length);
  });

  test('should invalidate old sessions when new session is created', async () => {
    const firstLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'sessionlimittest', password: 'correct-password' });

    expect(firstLogin.status).toBe(200);
    const firstToken = firstLogin.body.access_token;

    const secondLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'sessionlimittest', password: 'correct-password' });

    expect(secondLogin.status).toBe(200);
    const secondToken = secondLogin.body.access_token;

    const firstValidation = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${firstToken}`);

    const secondValidation = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${secondToken}`);

    expect(firstValidation.status).toBe(401);
    expect(secondValidation.status).toBe(200);
  });
});
