import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Input Sanitization (E2E)', () => {
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

  test('should reject requests with SQL injection patterns', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/ovds/invoices?search=test\' OR 1=1 --')
      .expect(400);

    expect(response.body.message).toBeDefined();
  });

  test('should reject requests with XSS patterns', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/ovds/invoices?search=<script>alert(1)</script>')
      .expect(400);

    expect(response.body.message).toBeDefined();
  });

  test('should reject requests with path traversal patterns', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/ovds/invoices?search=../../../etc/passwd')
      .expect(400);

    expect(response.body.message).toBeDefined();
  });

  test('should reject requests with command injection patterns', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/ovds/invoices?search=test; ls -la')
      .expect(400);

    expect(response.body.message).toBeDefined();
  });

  test('should reject requests with null bytes', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/ovds/invoices?search=test%00malicious')
      .expect(400);

    expect(response.body.message).toBeDefined();
  });
});
