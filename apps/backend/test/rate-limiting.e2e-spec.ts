import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Rate Limiting (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: Test.TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test('public health endpoint is not rate limited', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    expect(response.body.status).toBe('healthy');
  });

  test('login endpoint enforces rate limiting', async () => {
    const loginPromises = [];
    for (let i = 0; i < 15; i++) {
      loginPromises.push(
        request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ username: 'nonexistent', password: 'wrong' })
      );
    }

    const responses = await Promise.all(loginPromises);
    const throttledResponses = responses.filter(r => r.status === 429);

    expect(throttledResponses.length).toBeGreaterThan(0);
  });

  test('password reset endpoint enforces rate limiting', async () => {
    const resetPromises = [];
    for (let i = 0; i < 10; i++) {
      resetPromises.push(
        request(app.getHttpServer())
          .post('/api/auth/forgot-password')
          .send({ email: 'test@example.com' })
      );
    }

    const responses = await Promise.all(resetPromises);
    const throttledResponses = responses.filter(r => r.status === 429);

    expect(throttledResponses.length).toBeGreaterThan(0);
  });
});
