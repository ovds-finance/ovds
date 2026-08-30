import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Token Blacklist (E2E)', () => {
  let app: INestApplication;
  let accessToken: string;

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

  beforeEach(async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'correct-password' });

    if (response.status === 200) {
      accessToken = response.body.access_token;
    }
  });

  afterEach(async () => {
    if (accessToken) {
      await request(app.getHttpServer())
        .delete('/api/auth/sessions/current')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    }
  });

  test('should reject blacklisted token after logout', async () => {
    if (!accessToken) return;

    await request(app.getHttpServer())
      .delete('/api/auth/sessions/current')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const response = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);

    expect(response.body.message).toContain('revoked');
  });
});
