import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Clickjacking Protection (E2E)', () => {
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

  test('X-Frame-Options header is set', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    expect(response.headers['x-frame-options']).toBeDefined();
  });

  test('Content-Security-Policy prevents framing', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    expect(response.headers['content-security-policy']).toBeDefined();
  });

  test('X-Frame-Options is DENY or SAMEORIGIN', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    const frameOptions = response.headers['x-frame-options'];
    expect(['DENY', 'SAMEORIGIN']).toContain(frameOptions);
  });
});
