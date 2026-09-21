import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('CORS Configuration (E2E)', () => {
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

  test('allows requests from configured origin', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .set('Origin', 'http://localhost:5173')
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBeDefined();
  });

  test('rejects requests from unauthorized origins', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .set('Origin', 'http://malicious-site.com')
      .expect(403);

    expect(response.body.message).toBeDefined();
  });

  test('includes CORS headers in preflight response', async () => {
    const response = await request(app.getHttpServer())
      .options('/api/health')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET')
      .expect(204);

    expect(response.headers['access-control-allow-origin']).toBeDefined();
    expect(response.headers['access-control-allow-methods']).toBeDefined();
  });
});
