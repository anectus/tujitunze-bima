import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface RoleResponse {
  roleId: number;
  roleName: string;
  description: string | null;
  userCount: number;
  permissions: { id: number; name: string }[];
}

interface PermissionResponse {
  id: number;
  name: string;
  description: string | null;
}

// Proves the boundary the roles/permissions catalog relies on:
// (1) RolesGuard rejects a non-Super-admin token on every route, (2)
// creating a role rejects a duplicate name, (3) assigning permissions
// rejects an unknown permission id, and (4) a successful assignment is
// actually persisted and readable back via GET /super-admin/roles.
describe('Super-admin roles & permissions (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let dataSource: DataSource;

  const ts = Date.now().toString();
  const createdUserIds: number[] = [];
  const createdRoleIds: number[] = [];

  let superAdminUserId: number;
  let bankUserId: number;

  const nida = (i: number) =>
    `${ts.slice(0, 8)}-${ts.slice(8, 13)}-${String(i).padStart(5, '0')}-02`;

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

    superAdminUserId = await createUser('SuperAdmin', 1);
    await assignRole(superAdminUserId, 'Super-admin');

    bankUserId = await createUser('BankStaff', 2);
    await assignRole(bankUserId, 'Bank');
  });

  afterAll(async () => {
    await dataSource.query(
      `DELETE FROM role_permissions WHERE role_id = ANY($1)`,
      [createdRoleIds],
    );
    await dataSource.query(`DELETE FROM roles WHERE role_id = ANY($1)`, [
      createdRoleIds,
    ]);
    await dataSource.query(
      `DELETE FROM member_roles WHERE member_id = ANY($1)`,
      [createdUserIds],
    );
    await dataSource.query(`DELETE FROM users WHERE user_id = ANY($1)`, [
      createdUserIds,
    ]);
    await app.close();
  });

  it('rejects a non-Super-admin token on every roles/permissions route', async () => {
    const token = signToken(bankUserId, ['Bank'], 'BankStaff');

    await request(app.getHttpServer())
      .get('/super-admin/roles')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/super-admin/permissions')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    await request(app.getHttpServer())
      .post('/super-admin/roles')
      .set('Authorization', `Bearer ${token}`)
      .send({ roleName: `Should Fail ${ts}` })
      .expect(403);

    await request(app.getHttpServer())
      .put('/super-admin/roles/1/permissions')
      .set('Authorization', `Bearer ${token}`)
      .send({ permissionIds: [] })
      .expect(403);
  });

  it('lists the seeded roles with their permissions', async () => {
    const token = signToken(superAdminUserId, ['Super-admin'], 'SuperAdmin');

    const response = await request(app.getHttpServer())
      .get('/super-admin/roles')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const roles = response.body as RoleResponse[];
    const superAdminRole = roles.find(
      (role) => role.roleName === 'Super-admin',
    );

    expect(superAdminRole).toBeDefined();
    expect(
      superAdminRole!.permissions.some((p) => p.name === 'roles:manage'),
    ).toBe(true);
  });

  it('lists the seeded permissions catalog', async () => {
    const token = signToken(superAdminUserId, ['Super-admin'], 'SuperAdmin');

    const response = await request(app.getHttpServer())
      .get('/super-admin/permissions')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const permissions = response.body as PermissionResponse[];
    expect(permissions.some((p) => p.name === 'permissions:manage')).toBe(true);
  });

  it('rejects creating a role with a name that already exists', async () => {
    const token = signToken(superAdminUserId, ['Super-admin'], 'SuperAdmin');

    await request(app.getHttpServer())
      .post('/super-admin/roles')
      .set('Authorization', `Bearer ${token}`)
      .send({ roleName: 'Bank' })
      .expect(409);
  });

  it('creates a role, then rejects assigning it an unknown permission id', async () => {
    const token = signToken(superAdminUserId, ['Super-admin'], 'SuperAdmin');
    const roleName = `E2E Test Role ${ts}`;

    const createResponse = await request(app.getHttpServer())
      .post('/super-admin/roles')
      .set('Authorization', `Bearer ${token}`)
      .send({ roleName, description: 'Created by e2e test' })
      .expect(201);

    const created = createResponse.body as RoleResponse;
    createdRoleIds.push(created.roleId);
    expect(created.roleName).toBe(roleName);
    expect(created.permissions).toEqual([]);

    await request(app.getHttpServer())
      .put(`/super-admin/roles/${created.roleId}/permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ permissionIds: [999999999] })
      .expect(400);
  });

  it('assigns permissions to a role and persists them', async () => {
    const token = signToken(superAdminUserId, ['Super-admin'], 'SuperAdmin');
    const roleName = `E2E Assignable Role ${ts}`;

    const createResponse = await request(app.getHttpServer())
      .post('/super-admin/roles')
      .set('Authorization', `Bearer ${token}`)
      .send({ roleName })
      .expect(201);

    const created = createResponse.body as RoleResponse;
    createdRoleIds.push(created.roleId);

    const [permission] = await dataSource.query<{ permission_id: number }[]>(
      `SELECT permission_id FROM permissions WHERE permission_name = 'reports:view'`,
    );

    const updateResponse = await request(app.getHttpServer())
      .put(`/super-admin/roles/${created.roleId}/permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ permissionIds: [permission.permission_id] })
      .expect(200);

    const updated = updateResponse.body as RoleResponse;
    expect(updated.permissions.map((p) => p.name)).toEqual(['reports:view']);

    const listResponse = await request(app.getHttpServer())
      .get('/super-admin/roles')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const roles = listResponse.body as RoleResponse[];
    const persisted = roles.find((role) => role.roleId === created.roleId);
    expect(persisted?.permissions.map((p) => p.name)).toEqual(['reports:view']);
  });

  it('returns 404 when assigning permissions to a nonexistent role', async () => {
    const token = signToken(superAdminUserId, ['Super-admin'], 'SuperAdmin');

    await request(app.getHttpServer())
      .put('/super-admin/roles/999999999/permissions')
      .set('Authorization', `Bearer ${token}`)
      .send({ permissionIds: [] })
      .expect(404);
  });

  it('rejects renaming or deleting a core platform role', async () => {
    const token = signToken(superAdminUserId, ['Super-admin'], 'SuperAdmin');

    const [bank] = await dataSource.query<{ role_id: number }[]>(
      `SELECT role_id FROM roles WHERE role_name = 'Bank'`,
    );

    await request(app.getHttpServer())
      .patch(`/super-admin/roles/${bank.role_id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ roleName: 'Renamed Bank' })
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/super-admin/roles/${bank.role_id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('renames a custom role and rejects a rename to an existing name', async () => {
    const token = signToken(superAdminUserId, ['Super-admin'], 'SuperAdmin');
    const roleName = `E2E Renamable Role ${ts}`;
    const renamedTo = `E2E Renamed Role ${ts}`;

    const createResponse = await request(app.getHttpServer())
      .post('/super-admin/roles')
      .set('Authorization', `Bearer ${token}`)
      .send({ roleName })
      .expect(201);

    const created = createResponse.body as RoleResponse;
    createdRoleIds.push(created.roleId);

    await request(app.getHttpServer())
      .patch(`/super-admin/roles/${created.roleId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ roleName: 'Bank' })
      .expect(409);

    const renameResponse = await request(app.getHttpServer())
      .patch(`/super-admin/roles/${created.roleId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ roleName: renamedTo, description: 'Renamed by e2e test' })
      .expect(200);

    const renamed = renameResponse.body as RoleResponse;
    expect(renamed.roleName).toBe(renamedTo);
    expect(renamed.description).toBe('Renamed by e2e test');
  });

  it('rejects deleting a role with assigned users, then deletes it once empty', async () => {
    const token = signToken(superAdminUserId, ['Super-admin'], 'SuperAdmin');
    const roleName = `E2E Deletable Role ${ts}`;

    const createResponse = await request(app.getHttpServer())
      .post('/super-admin/roles')
      .set('Authorization', `Bearer ${token}`)
      .send({ roleName })
      .expect(201);

    const created = createResponse.body as RoleResponse;
    createdRoleIds.push(created.roleId);

    await assignRole(bankUserId, roleName);

    await request(app.getHttpServer())
      .delete(`/super-admin/roles/${created.roleId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(409);

    await dataSource.query(
      `DELETE FROM member_roles WHERE member_id = $1 AND role_id = $2`,
      [bankUserId, created.roleId],
    );

    await request(app.getHttpServer())
      .delete(`/super-admin/roles/${created.roleId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const listResponse = await request(app.getHttpServer())
      .get('/super-admin/roles')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const roles = listResponse.body as RoleResponse[];
    expect(roles.some((role) => role.roleId === created.roleId)).toBe(false);

    createdRoleIds.splice(createdRoleIds.indexOf(created.roleId), 1);
  });

  it('returns 404 when updating or deleting a nonexistent role', async () => {
    const token = signToken(superAdminUserId, ['Super-admin'], 'SuperAdmin');

    await request(app.getHttpServer())
      .patch('/super-admin/roles/999999999')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'no such role' })
      .expect(404);

    await request(app.getHttpServer())
      .delete('/super-admin/roles/999999999')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});
