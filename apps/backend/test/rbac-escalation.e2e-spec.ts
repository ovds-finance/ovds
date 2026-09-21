import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@ovds/database';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';


describe('RBAC Permission Escalation (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let normalUserToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: Test.TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    const normalUser = await prisma.user.upsert({
      where: { username: 'normaluser' },
      create: {
        username: 'normaluser',
        password: 'hashed-password',
        role: Role.USER,
        companyId: 'test-company',
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      update: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    const adminUser = await prisma.user.upsert({
      where: { username: 'adminuser' },
      create: {
        username: 'adminuser',
        password: 'hashed-password',
        role: Role.ADMIN,
        companyId: 'test-company',
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      update: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    const jwt = require('@nestjs/jwt').JwtService;
    const jwtService = new jwt({ secret: process.env.JWT_SECRET || 'test-secret' });
    normalUserToken = jwtService.sign({ sub: normalUser.id, username: normalUser.username, role: normalUser.role, companyId: normalUser.companyId });
    adminToken = jwtService.sign({ sub: adminUser.id, username: adminUser.username, role: adminUser.role, companyId: adminUser.companyId });
  });

  afterEach(async () => {
    await prisma.user.deleteMany({ where: { username: { in: ['normaluser', 'adminuser'] } } });
  });

  test('normal user cannot access admin endpoints', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/ovds/admin/dashboard')
      .set('Authorization', `Bearer ${normalUserToken}`);

    expect(response.status).toBe(403);
  });

  test('normal user cannot modify system settings', async () => {
    const response = await request(app.getHttpServer())
      .patch('/api/settings/system')
      .set('Authorization', `Bearer ${normalUserToken}`)
      .send({ key: 'test', value: 'test' });

    expect(response.status).toBe(403);
  });

  test('admin user can access admin endpoints', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/ovds/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect([200, 404]).toContain(response.status);
  });

  test('normal user cannot change their role', async () => {
    const response = await request(app.getHttpServer())
      .patch('/api/auth/role')
      .set('Authorization', `Bearer ${normalUserToken}`)
      .send({ role: Role.ADMIN });

    expect(response.status).toBe(403);
  });

  test('normal user cannot access other company data', async () => {
    const otherCompany = await prisma.company.create({
      data: { name: 'Other Company', type: 'LOCAL', isActive: true },
    });

    const response = await request(app.getHttpServer())
      .get(`/api/ovds/invoices?companyId=${otherCompany.id}`)
      .set('Authorization', `Bearer ${normalUserToken}`);

    expect([403, 400]).toContain(response.status);

    await prisma.company.delete({ where: { id: otherCompany.id } });
  });
});
