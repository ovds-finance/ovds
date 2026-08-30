import { Test, TestingModule } from '@nestjs/testing';
import { LoginDto, RegisterDto, ChangePasswordDto } from '../../../packages/shared/dto/src/auth/auth.dto';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Password Complexity (E2E)', () => {
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

  test('should reject weak passwords on registration', async () => {
    const weakPasswords = [
      'short', // too short
      'alllowercase123!', // no uppercase
      'ALLUPPERCASE123!', // no lowercase
      'NoNumbers!', // no numbers
      'NoSpecial123', // no special chars
    ];

    for (const password of weakPasswords) {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: `testuser_${Date.now()}`,
          password: password,
          email: 'test@example.com',
        });

      expect(response.status).toBe(400);
    }
  });

  test('should accept strong passwords on registration', async () => {
    const strongPasswords = [
      'StrongPass123!',
      'MyP@ssw0rd',
      'C0mpl3x#Pass',
    ];

    for (const password of strongPasswords) {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: `testuser_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          password: password,
          email: `test_${Date.now()}@example.com`,
        });

      expect(response.status).toBe(201);
    }
  });

  test('should reject weak passwords on login', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'short',
      });

    expect(response.status).toBe(400);
  });
});
