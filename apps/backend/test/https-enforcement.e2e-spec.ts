import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('HTTPS Enforcement (E2E)', () => {
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

  test('HSTS header is present in production mode', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    if (process.env.NODE_ENV !== 'development') {
      expect(response.headers['strict-transport-security']).toBeDefined();
    }
  });

  test('CSP header prevents unsafe inline scripts', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    expect(response.headers['content-security-policy']).toBeDefined();
  });

  test('X-Content-Type-Options prevents MIME sniffing', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  test('Referrer-Policy is set', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    expect(response.headers['referrer-policy']).toBeDefined();
  });

  test('Permissions-Policy is set', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    expect(response.headers['permissions-policy']).toBeDefined();
  });
});
