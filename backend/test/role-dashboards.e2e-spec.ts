import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface HospitalDashboardResponse {
  totalClaims: number;
  hospital: { name: string | null; status: string | null };
}

// Proves the boundary the five new role-scoped dashboards rely on:
// (1) RolesGuard rejects a token whose role doesn't match, and
// (2) a Hospital's dashboard never leaks another hospital's data —
// the exact cross-tenant boundary CLAUDE.md calls out for Hospital/
// Bank/Telecom/Insurance.
describe('Role-scoped dashboards (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let dataSource: DataSource;

  const ts = Date.now().toString();
  const createdUserIds: number[] = [];
  const createdHospitalIds: number[] = [];
  const createdClaimIds: number[] = [];

  let memberUserId: number;
  let hospitalAId: number;
  let hospitalBId: number;
  let hospitalAStaffId: number;
  let hospitalBStaffId: number;
  let unassignedHospitalStaffId: number;

  const nida = (i: number) =>
    `${ts.slice(0, 8)}-${ts.slice(8, 13)}-${String(i).padStart(5, '0')}-00`;

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

    const hospitals = await dataSource.query<{ hospital_id: number }[]>(
      `INSERT INTO hospitals (hospital_name, status)
       VALUES ($1, 'Active'), ($2, 'Active')
       RETURNING hospital_id`,
      [`E2E Hospital A ${ts}`, `E2E Hospital B ${ts}`],
    );
    hospitalAId = hospitals[0].hospital_id;
    hospitalBId = hospitals[1].hospital_id;
    createdHospitalIds.push(hospitalAId, hospitalBId);

    memberUserId = await createUser('Member', 1);
    await assignRole(memberUserId, 'Member');

    hospitalAStaffId = await createUser('HospitalAStaff', 2);
    await assignRole(hospitalAStaffId, 'Hospital');
    await dataSource.query(
      `UPDATE users SET hospital_id = $1 WHERE user_id = $2`,
      [hospitalAId, hospitalAStaffId],
    );

    hospitalBStaffId = await createUser('HospitalBStaff', 3);
    await assignRole(hospitalBStaffId, 'Hospital');
    await dataSource.query(
      `UPDATE users SET hospital_id = $1 WHERE user_id = $2`,
      [hospitalBId, hospitalBStaffId],
    );

    unassignedHospitalStaffId = await createUser('UnassignedHospitalStaff', 4);
    await assignRole(unassignedHospitalStaffId, 'Hospital');

    // One claim in each hospital, attributed to the plain member user,
    // so a claim count differing between A and B proves scoping.
    const claimA = await dataSource.query<{ claim_id: number }[]>(
      `INSERT INTO healthcare_claims (member_id, hospital_id, claim_number, claim_amount, claim_status)
       VALUES ($1, $2, $3, 100, 'Pending') RETURNING claim_id`,
      [memberUserId, hospitalAId, `E2E-CLAIM-A-${ts}`],
    );
    createdClaimIds.push(claimA[0].claim_id);

    const claimsB = await dataSource.query<{ claim_id: number }[]>(
      `INSERT INTO healthcare_claims (member_id, hospital_id, claim_number, claim_amount, claim_status)
       VALUES ($1, $2, $3, 100, 'Pending'), ($1, $2, $4, 200, 'Approved')
       RETURNING claim_id`,
      [memberUserId, hospitalBId, `E2E-CLAIM-B1-${ts}`, `E2E-CLAIM-B2-${ts}`],
    );
    createdClaimIds.push(...claimsB.map((row) => row.claim_id));
  });

  afterAll(async () => {
    await dataSource.query(
      `DELETE FROM healthcare_claims WHERE claim_id = ANY($1)`,
      [createdClaimIds],
    );
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

  const dashboardRoutes: { path: string; role: string }[] = [
    { path: '/hospital/dashboard', role: 'Hospital' },
    { path: '/bank/dashboard', role: 'Bank' },
    { path: '/telecom/dashboard', role: 'Telecom' },
    { path: '/insurance/dashboard', role: 'Insurance' },
    { path: '/super-admin/dashboard', role: 'Super-admin' },
  ];

  describe.each(dashboardRoutes)('$path', ({ path }) => {
    it('rejects a request with no token', () => {
      return request(app.getHttpServer()).get(path).expect(401);
    });

    it("rejects a Member-role token that doesn't hold the required role", () => {
      const token = signToken(memberUserId, ['Member'], 'Member');

      return request(app.getHttpServer())
        .get(path)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('Hospital dashboard tenant scoping', () => {
    it("returns only hospital A's claim counts for hospital A's staff", async () => {
      const token = signToken(hospitalAStaffId, ['Hospital'], 'HospitalAStaff');

      const response = await request(app.getHttpServer())
        .get('/hospital/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = response.body as HospitalDashboardResponse;

      expect(body.totalClaims).toBe(1);
      expect(body.hospital.name).toBe(`E2E Hospital A ${ts}`);
    });

    it("returns only hospital B's claim counts for hospital B's staff", async () => {
      const token = signToken(hospitalBStaffId, ['Hospital'], 'HospitalBStaff');

      const response = await request(app.getHttpServer())
        .get('/hospital/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const body = response.body as HospitalDashboardResponse;

      expect(body.totalClaims).toBe(2);
      expect(body.hospital.name).toBe(`E2E Hospital B ${ts}`);
    });

    it('rejects Hospital staff with no hospital assigned', async () => {
      const token = signToken(
        unassignedHospitalStaffId,
        ['Hospital'],
        'UnassignedHospitalStaff',
      );

      await request(app.getHttpServer())
        .get('/hospital/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });
});
