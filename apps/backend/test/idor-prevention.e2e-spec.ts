import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';

describe('IDOR Prevention (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let companyA: string;
  let companyB: string;
  let leaseA: string;
  let leaseB: string;
  let userAToken: string;
  let userBToken: string;

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
    // Create two companies
    const companyARecord = await prisma.company.create({
      data: { name: 'Company A', type: 'LOCAL', isActive: true },
    });
    companyA = companyARecord.id;

    const companyBRecord = await prisma.company.create({
      data: { name: 'Company B', type: 'LOCAL', isActive: true },
    });
    companyB = companyBRecord.id;

    // Create users for each company
    const userA = await prisma.user.create({
      data: {
        username: 'usera',
        password: 'hashed-password',
        role: 'USER',
        companyId: companyA,
      },
    });

    const userB = await prisma.user.create({
      data: {
        username: 'userb',
        password: 'hashed-password',
        role: 'USER',
        companyId: companyB,
      },
    });

    // Generate JWT tokens for each user
    const jwt = require('@nestjs/jwt').JwtService;
    const jwtService = new jwt({ secret: process.env.JWT_SECRET || 'test-secret' });
    userAToken = jwtService.sign({ sub: userA.id, username: userA.username, role: userA.role, companyId: companyA });
    userBToken = jwtService.sign({ sub: userB.id, username: userB.username, role: userB.role, companyId: companyB });

    // Create leases in each company
    const leaseARecord = await prisma.lease.create({
      data: {
        companyId: companyA,
        assetDescription: 'Company A Lease',
        leaseType: 'OPERATING',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2028-01-01'),
        monthlyPayment: 10000,
        createdBy: userA.id,
      },
    });
    leaseA = leaseARecord.id;

    const leaseBRecord = await prisma.lease.create({
      data: {
        companyId: companyB,
        assetDescription: 'Company B Lease',
        leaseType: 'OPERATING',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2028-01-01'),
        monthlyPayment: 15000,
        createdBy: userB.id,
      },
    });
    leaseB = leaseBRecord.id;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.lease.deleteMany({ where: { companyId: { in: [companyA, companyB] } } });
    await prisma.user.deleteMany({ where: { companyId: { in: [companyA, companyB] } } });
    await prisma.company.deleteMany({ where: { id: { in: [companyA, companyB] } } });
  });

  test('user A should not access lease B via IDOR', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/ovds/leases/${leaseB}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .set('x-company-id', companyA)
      .expect(404);

    expect(response.body.message).toBe('Lease not found');
  });

  test('user B should not access lease A via IDOR', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/ovds/leases/${leaseA}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .set('x-company-id', companyB)
      .expect(404);

    expect(response.body.message).toBe('Lease not found');
  });

  test('user A should access their own lease', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/ovds/leases/${leaseA}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .set('x-company-id', companyA)
      .expect(200);

    expect(response.body.id).toBe(leaseA);
  });

  test('user A should not update lease B via IDOR', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/ovds/leases/${leaseB}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .set('x-company-id', companyA)
      .send({ monthlyPayment: 5000 })
      .expect(404);

    expect(response.body.message).toBe('Lease not found');
  });

  test('user A should not delete lease B via IDOR', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/api/ovds/leases/${leaseB}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .set('x-company-id', companyA)
      .expect(404);

    expect(response.body.message).toBe('Lease not found');
  });
});
