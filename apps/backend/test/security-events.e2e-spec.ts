import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Security Event Monitoring (E2E)', () => {
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

  test('failed login attempts are logged', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'nonexistent', password: 'wrong' })
      .expect(401);
  });

  test('rate limit violations are logged', async () => {
    const loginPromises = [];
    for (let i = 0; i < 15; i++) {
      loginPromises.push(
        request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ username: 'test', password: 'wrong' })
      );
    }

    await Promise.all(loginPromises);
  });

  test('unauthorized access attempts are logged', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/users')
      .expect(401);
  });

  test('forbidden access attempts are logged', async () => {
    await request(app.getHttpServer())
      .get('/api/ovds/admin/dashboard')
      .expect(401);
  });

  test('invalid token attempts are logged', async () => {
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  test('password reset requests are logged', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: 'test@example.com' })
      .expect(200);
  });
});
