import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Proves the boundary the new Hospital verify -> treatment -> claim ->
// payment surface relies on: a hospital can drive its own workflow end to
// end, but can never read or mutate another hospital's treatments/claims
// (the same cross-tenant concern CLAUDE.md calls out for Hospital/Bank/
// Telecom), and an unassigned Hospital account is rejected rather than
// getting empty/global data.
describe('Hospital verify -> treatment -> claim -> payment workflow (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let dataSource: DataSource;

  const ts = Date.now().toString();
  const createdUserIds: number[] = [];
  const createdHospitalIds: number[] = [];

  let patientUserId: number;
  let patientNida: string;
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
      [`E2E Workflow Hospital A ${ts}`, `E2E Workflow Hospital B ${ts}`],
    );
    hospitalAId = hospitals[0].hospital_id;
    hospitalBId = hospitals[1].hospital_id;
    createdHospitalIds.push(hospitalAId, hospitalBId);

    patientUserId = await createUser('Patient', 1);
    patientNida = nida(1);
    await assignRole(patientUserId, 'Member');

    hospitalAStaffId = await createUser('HospitalAWorkflowStaff', 2);
    await assignRole(hospitalAStaffId, 'Hospital');
    await dataSource.query(
      `UPDATE users SET hospital_id = $1 WHERE user_id = $2`,
      [hospitalAId, hospitalAStaffId],
    );

    hospitalBStaffId = await createUser('HospitalBWorkflowStaff', 3);
    await assignRole(hospitalBStaffId, 'Hospital');
    await dataSource.query(
      `UPDATE users SET hospital_id = $1 WHERE user_id = $2`,
      [hospitalBId, hospitalBStaffId],
    );

    unassignedHospitalStaffId = await createUser('UnassignedWorkflowStaff', 4);
    await assignRole(unassignedHospitalStaffId, 'Hospital');
  });

  afterAll(async () => {
    await dataSource.query(
      `DELETE FROM hospital_payments WHERE hospital_id = ANY($1)`,
      [createdHospitalIds],
    );
    await dataSource.query(
      `DELETE FROM healthcare_claims WHERE hospital_id = ANY($1)`,
      [createdHospitalIds],
    );
    await dataSource.query(
      `DELETE FROM treatments WHERE hospital_id = ANY($1)`,
      [createdHospitalIds],
    );
    await dataSource.query(
      `DELETE FROM healthcare_verifications WHERE hospital_id = ANY($1)`,
      [createdHospitalIds],
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

  let verificationId: number;
  let treatmentId: number;
  let claimId: number;

  const hospitalAToken = () =>
    signToken(hospitalAStaffId, ['Hospital'], 'HospitalAWorkflowStaff');
  const hospitalBToken = () =>
    signToken(hospitalBStaffId, ['Hospital'], 'HospitalBWorkflowStaff');

  it('verifies the member by NIDA and records the result as Eligible', async () => {
    const response = await request(app.getHttpServer())
      .post('/hospital/verifications')
      .set('Authorization', `Bearer ${hospitalAToken()}`)
      .send({ verificationMethod: 'NIDA', identifier: patientNida })
      .expect(201);

    const verificationBody = response.body as {
      verification_result: string;
      member: { firstName: string };
      verification_id: number;
    };

    expect(verificationBody.verification_result).toBe('Eligible');
    expect(verificationBody.member.firstName).toBe('Patient');
    verificationId = verificationBody.verification_id;
  });

  it('lists the verification back for hospital A and shows the member as eligible', async () => {
    const listResponse = await request(app.getHttpServer())
      .get('/hospital/verifications')
      .set('Authorization', `Bearer ${hospitalAToken()}`)
      .expect(200);

    const items = listResponse.body.items as Array<{ verification_id: number }>;
    expect(items.some((v) => v.verification_id === verificationId)).toBe(true);

    const eligibleResponse = await request(app.getHttpServer())
      .get('/hospital/eligible-members')
      .set('Authorization', `Bearer ${hospitalAToken()}`)
      .expect(200);

    const eligibleList = eligibleResponse.body as Array<{ member_id: number }>;
    expect(eligibleList.some((m) => m.member_id === patientUserId)).toBe(true);
  });

  it('records a treatment linked to the verification', async () => {
    const response = await request(app.getHttpServer())
      .post('/hospital/treatments')
      .set('Authorization', `Bearer ${hospitalAToken()}`)
      .send({
        memberId: patientUserId,
        verificationId,
        servicesProvided: 'General consultation',
      })
      .expect(201);

    const treatmentBody = response.body as { treatment_status: string; treatment_id: number };
    expect(treatmentBody.treatment_status).toBe('Active');
    treatmentId = treatmentBody.treatment_id;
  });

  it("rejects hospital B linking a claim/treatment to hospital A's verification/treatment", async () => {
    await request(app.getHttpServer())
      .post('/hospital/treatments')
      .set('Authorization', `Bearer ${hospitalBToken()}`)
      .send({
        memberId: patientUserId,
        verificationId,
        servicesProvided: 'Should be rejected',
      })
      .expect(400);
  });

  it("rejects hospital B updating hospital A's treatment status", async () => {
    await request(app.getHttpServer())
      .patch(`/hospital/treatments/${treatmentId}/status`)
      .set('Authorization', `Bearer ${hospitalBToken()}`)
      .send({ status: 'Completed' })
      .expect(403);
  });

  it("lets hospital A update its own treatment's status", async () => {
    await request(app.getHttpServer())
      .patch(`/hospital/treatments/${treatmentId}/status`)
      .set('Authorization', `Bearer ${hospitalAToken()}`)
      .send({ status: 'Completed' })
      .expect(200);
  });

  it('creates a draft claim linked to the treatment', async () => {
    const response = await request(app.getHttpServer())
      .post('/hospital/claims')
      .set('Authorization', `Bearer ${hospitalAToken()}`)
      .send({
        memberId: patientUserId,
        treatmentId,
        claimAmount: 15000,
        isDraft: true,
      })
      .expect(201);

    const claimBody = response.body as { claim_status: string; claim_id: number };
    expect(claimBody.claim_status).toBe('Draft');
    claimId = claimBody.claim_id;
  });

  it("rejects hospital B submitting hospital A's draft claim", async () => {
    await request(app.getHttpServer())
      .patch(`/hospital/claims/${claimId}/submit`)
      .set('Authorization', `Bearer ${hospitalBToken()}`)
      .expect(403);
  });

  it('lets hospital A submit its own draft claim', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/hospital/claims/${claimId}/submit`)
      .set('Authorization', `Bearer ${hospitalAToken()}`)
      .expect(200);

    const submitBody = response.body as { status: string };
    expect(submitBody.status).toBe('Pending');
  });

  it("rejects hospital B approving hospital A's claim", async () => {
    await request(app.getHttpServer())
      .patch(`/hospital/claims/${claimId}/status`)
      .set('Authorization', `Bearer ${hospitalBToken()}`)
      .send({ status: 'Approved' })
      .expect(403);
  });

  it('approves the claim and creates a pending payment entitlement for hospital A only', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/hospital/claims/${claimId}/status`)
      .set('Authorization', `Bearer ${hospitalAToken()}`)
      .send({ status: 'Approved' })
      .expect(200);

    const approvalBody = response.body as { status: string; approvedAmount: string | number };
    expect(approvalBody.status).toBe('Approved');
    expect(Number(approvalBody.approvedAmount)).toBe(15000);

    const paymentsA = await request(app.getHttpServer())
      .get('/hospital/payments?status=Pending')
      .set('Authorization', `Bearer ${hospitalAToken()}`)
      .expect(200);

    expect(
      paymentsA.body.some((p: { claim_id: number }) => p.claim_id === claimId),
    ).toBe(true);

    const paymentsB = await request(app.getHttpServer())
      .get('/hospital/payments?status=Pending')
      .set('Authorization', `Bearer ${hospitalBToken()}`)
      .expect(200);

    expect(
      paymentsB.body.some((p: { claim_id: number }) => p.claim_id === claimId),
    ).toBe(false);
  });

  it('rejects Hospital staff with no hospital assigned from the verification endpoint', async () => {
    const token = signToken(
      unassignedHospitalStaffId,
      ['Hospital'],
      'UnassignedWorkflowStaff',
    );

    await request(app.getHttpServer())
      .post('/hospital/verifications')
      .set('Authorization', `Bearer ${token}`)
      .send({ verificationMethod: 'NIDA', identifier: patientNida })
      .expect(403);
  });
});
