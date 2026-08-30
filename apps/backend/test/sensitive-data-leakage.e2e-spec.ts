import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Sensitive Data Leakage (E2E)', () => {
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

  test('error responses should not expose stack traces in production', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/ovds/nonexistent-endpoint')
      .expect(404);

    expect(response.body.stack).toBeUndefined();
    expect(response.body.error).toBeDefined();
    expect(response.body.message).toBeDefined();
  });

  test('error responses should not expose internal file paths', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/ovds/nonexistent-endpoint')
      .expect(404);

    expect(response.body.message).not.toContain('/apps/');
    expect(response.body.message).not.toContain('\\apps\\');
    expect(response.body.message).not.toContain('src/');
  });

  test('error responses should not expose database details', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/ovds/nonexistent-endpoint')
      .expect(404);

    expect(response.body.message).not.toContain('Prisma');
    expect(response.body.message).not.toContain('database');
    expect(response.body.message).not.toContain('connection');
  });

  test('error responses should not expose API keys or tokens', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/ovds/nonexistent-endpoint')
      .expect(404);

    const responseStr = JSON.stringify(response.body);
    expect(responseStr).not.toContain('sk-');
    expect(responseStr).not.toContain('token');
    expect(responseStr).not.toContain('secret');
  });

  test('health endpoint should not expose sensitive configuration', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    const responseStr = JSON.stringify(response.body);
    expect(responseStr).not.toContain('password');
    expect(responseStr).not.toContain('secret');
    expect(responseStr).not.toContain('key');
  });
});
