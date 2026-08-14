import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface AdministratorResponse {
  userId: number;
  email: string;
  role: string;
}

interface LoginResponse {
  accessToken: string;
}

interface HospitalDashboardResponse {
  hospital: { name: string | null };
}

// Proves the boundary POST /super-admin/administrators relies on:
// (1) RolesGuard rejects a non-Super-admin token, (2) tenant-scoped roles
// require a valid tenantId, and (3) an account created here can actually
// log in and reach its own role-scoped dashboard — closing the loop with
// backend/test/role-dashboards.e2e-spec.ts.
describe('Super-admin administrator provisioning (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let dataSource: DataSource;

  const ts = Date.now().toString();
  const createdUserIds: number[] = [];
  const createdHospitalIds: number[] = [];

  let superAdminUserId: number;
  let bankUserId: number;
  let hospitalId: number;

  const nida = (i: number) =>
    `${ts.slice(0, 8)}-${ts.slice(8, 13)}-${String(i).padStart(5, '0')}-01`;

  const signToken = (userId: number, roles: string[], firstName: string) =>
    jwtService.sign({ sub: userId, roles, firstName });

  const createUser = async (
    firstName: string,
    nidaIndex: number,
  ): Promise<number> => {
    const [row] = await dataSource.query<{ user_id: number }[]>(
      `INSERT INTO users (first_name, surname, nida_number, password_hash, member_status)
       VALUES ($1, 'E2E', $2, 'x', 'Active')
       RETURNING user_id`,
      [firstName, nida(nidaIndex)],
    );
    createdUserIds.push(row.user_id);
    return row.user_id;
  };

  const assignRole = async (userId: number, roleName: string) => {
    await dataSource.query(
      `INSERT INTO member_roles (member_id, role_id)
       SELECT $1, role_id FROM roles WHERE role_name = $2`,
      [userId, roleName],
    );
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = app.get(JwtService);
    dataSource = app.get(DataSource);

    const [hospital] = await dataSource.query<{ hospital_id: number }[]>(
      `INSERT INTO hospitals (hospital_name, status) VALUES ($1, 'Active') RETURNING hospital_id`,
      [`E2E Provisioning Hospital ${ts}`],
    );
    hospitalId = hospital.hospital_id;
    createdHospitalIds.push(hospitalId);

    superAdminUserId = await createUser('SuperAdmin', 1);
    await assignRole(superAdminUserId, 'Super-admin');

    bankUserId = await createUser('BankStaff', 2);
    await assignRole(bankUserId, 'Bank');
  });

  afterAll(async () => {
    await dataSource.query(
      `DELETE FROM member_roles WHERE member_id = ANY($1)`,
      [createdUserIds],
    );
    await dataSource.query(`DELETE FROM users WHERE user_id = ANY($1)`, [
      createdUserIds,
    ]);
    await dataSource.query(
      `DELETE FROM hospitals WHERE hospital_id = ANY($1)`,
      [createdHospitalIds],
    );
    await app.close();
  });

  it('rejects a non-Super-admin token', async () => {
    const token = signToken(bankUserId, ['Bank'], 'BankStaff');

    await request(app.getHttpServer())
      .post('/super-admin/administrators')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Should',
        surname: 'Fail',
        email: `should-fail-${ts}@test.local`,
        nidaNumber: nida(3),
        password: 'TestPass123!',
        role: 'Hospital',
        tenantId: hospitalId,
      })
      .expect(403);
  });

  it('rejects a Hospital account with no tenantId', async () => {
    const token = signToken(superAdminUserId, ['Super-admin'], 'SuperAdmin');

    const response = await request(app.getHttpServer())
      .post('/super-admin/administrators')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'No',
        surname: 'Tenant',
        email: `no-tenant-${ts}@test.local`,
        nidaNumber: nida(4),
        password: 'TestPass123!',
        role: 'Hospital',
      })
      .expect(400);

    expect((response.body as { message: string }).message).toContain(
      'requires a tenantId',
    );
  });

  it('rejects a Hospital account with a nonexistent tenantId', async () => {
    const token = signToken(superAdminUserId, ['Super-admin'], 'SuperAdmin');

    await request(app.getHttpServer())
      .post('/super-admin/administrators')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Bad',
        surname: 'Tenant',
        email: `bad-tenant-${ts}@test.local`,
        nidaNumber: nida(5),
        password: 'TestPass123!',
        role: 'Hospital',
        tenantId: 999999999,
      })
      .expect(404);
  });

  it('creates a Hospital administrator who can then log in and reach their scoped dashboard', async () => {
    const superAdminToken = signToken(
      superAdminUserId,
      ['Super-admin'],
      'SuperAdmin',
    );
    const email = `new-hospital-staff-${ts}@test.local`;

    const createResponse = await request(app.getHttpServer())
      .post('/super-admin/administrators')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        firstName: 'New',
        surname: 'HospitalStaff',
        email,
        nidaNumber: nida(6),
        password: 'TestPass123!',
        role: 'Hospital',
        tenantId: hospitalId,
      })
      .expect(201);

    const created = createResponse.body as AdministratorResponse;
    createdUserIds.push(created.userId);
    expect(created.role).toBe('Hospital');

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ identifier: email, password: 'TestPass123!' })
      .expect(201);

    const { accessToken } = loginResponse.body as LoginResponse;

    const dashboardResponse = await request(app.getHttpServer())
      .get('/hospital/dashboard')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const dashboard = dashboardResponse.body as HospitalDashboardResponse;
    expect(dashboard.hospital.name).toBe(`E2E Provisioning Hospital ${ts}`);
  });
});
