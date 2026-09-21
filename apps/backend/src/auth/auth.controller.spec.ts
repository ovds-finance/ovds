import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '../app.module';
import { PrismaService } from '../common/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let createdUserId: string;
  let createdRoleId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany({ where: { username: { contains: 'role-test-' } } });
    await prisma.roleDefinition.deleteMany({ where: { name: 'Test Role' } });
  });

  it('POST /auth/register -> creates a user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: 'role-test-user', email: 'roletest@example.com', password: 'Test123456!', role: 'EMPLOYEE' })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    createdUserId = res.body.data.user.id;
  });

  it('POST /settings/rbac/roles -> creates a custom role', async () => {
    const res = await request(app.getHttpServer())
      .post('/settings/rbac/roles')
      .send({ name: 'Test Role', description: 'Integration test role', companyId: null })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Test Role');
    createdRoleId = res.body.data.id;
  });

  it('GET /auth/users -> lists users', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/users')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /auth/users/:id/roles -> assigns custom role to user', async () => {
    if (!createdUserId || !createdRoleId) {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'role-test-user2', email: 'roletest2@example.com', password: 'Test123456!', role: 'EMPLOYEE' });

      const roleRes = await request(app.getHttpServer())
        .post('/settings/rbac/roles')
        .send({ name: 'Test Role 2', description: 'Integration test role 2', companyId: null });

      createdUserId = (await request(app.getHttpServer()).get('/auth/users')).body.data.find((u: any) => u.username === 'role-test-user2').id;
      createdRoleId = roleRes.body.data.id;
    }

    const res = await request(app.getHttpServer())
      .post(`/auth/users/${createdUserId}/roles`)
      .send({ roleIds: [createdRoleId] })
      .expect(200);

    expect(res.body.success).toBe(true);

    const getRes = await request(app.getHttpServer())
      .get(`/auth/users/${createdUserId}/roles`)
      .expect(200);

    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data.map((r: any) => r.id)).toContain(createdRoleId);
  });

  it('PATCH /auth/users/:id -> updates user', async () => {
    const listRes = await request(app.getHttpServer()).get('/auth/users');
    const user = listRes.body.data[0];
    if (!user) return;

    const res = await request(app.getHttpServer())
      .patch(`/auth/users/${user.id}`)
      .send({ username: 'updated-user' })
      .expect(200);

    expect(res.body.username).toBe('updated-user');
  });

  it('DELETE /auth/users/:id -> deletes user', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: 'role-test-delete', email: 'roletestdelete@example.com', password: 'Test123456!', role: 'EMPLOYEE' });

    const userId = createRes.body.data.user.id;

    await request(app.getHttpServer())
      .delete(`/auth/users/${userId}`)
      .expect(200);

    const listRes = await request(app.getHttpServer()).get('/auth/users');
    expect(listRes.body.data.find((u: any) => u.id === userId)).toBeUndefined();
  });
});
