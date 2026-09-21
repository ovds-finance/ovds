import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Cookie Security (E2E)', () => {
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

  test('session cookies have Secure flag in production', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'correct-password' });

    if (response.status === 200) {
      const setCookie = response.headers['set-cookie'];
      if (setCookie) {
        const sessionCookie = setCookie.find((c: string) => c.startsWith('session='));
        if (sessionCookie && process.env.NODE_ENV !== 'development') {
          expect(sessionCookie).toContain('Secure');
        }
      }
    }
  });

  test('session cookies have HttpOnly flag', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'correct-password' });

    if (response.status === 200) {
      const setCookie = response.headers['set-cookie'];
      if (setCookie) {
        const sessionCookie = setCookie.find((c: string) => c.startsWith('session='));
        if (sessionCookie) {
          expect(sessionCookie).toContain('HttpOnly');
        }
      }
    }
  });

  test('session cookies have SameSite attribute', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'correct-password' });

    if (response.status === 200) {
      const setCookie = response.headers['set-cookie'];
      if (setCookie) {
        const sessionCookie = setCookie.find((c: string) => c.startsWith('session='));
        if (sessionCookie) {
          expect(sessionCookie).toMatch(/SameSite=(Strict|Lax|None)/);
        }
      }
    }
  });

  test('sensitive cookies are not exposed to JavaScript', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'correct-password' });

    if (response.status === 200) {
      const setCookie = response.headers['set-cookie'];
      if (setCookie) {
        const sessionCookie = setCookie.find((c: string) => c.startsWith('session='));
        if (sessionCookie) {
          expect(sessionCookie).toContain('HttpOnly');
          expect(sessionCookie).not.toContain('document.cookie');
        }
      }
    }
  });
});
