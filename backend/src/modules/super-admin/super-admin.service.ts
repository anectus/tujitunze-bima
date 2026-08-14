import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../members/entities/user.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import {
  CreateAdministratorDto,
  StaffRole,
} from './dto/create-administrator.dto';

interface RoleCountRow {
  role_name: string;
  count: number;
}

interface StatusCountRow {
  status: string;
  count: number;
}

interface AdministratorRow {
  user_id: number;
  first_name: string;
  second_name: string | null;
  surname: string;
  email: string | null;
  member_status: string;
  created_at: Date;
  role_name: string;
  hospital_name: string | null;
  bank_name: string | null;
  operator_name: string | null;
  provider_name: string | null;
}

interface TenantOption {
  id: number;
  name: string;
}

// Which table/primary-key column a tenant-scoped role's tenantId must
// exist in — the column name inside that table doesn't always match the
// FK column name on `users` (e.g. Telecom's users.telecom_operator_id
// points at telecom_operators.operator_id).
const TENANT_LOOKUP: Partial<
  Record<StaffRole, { table: string; pkColumn: string }>
> = {
  Hospital: { table: 'hospitals', pkColumn: 'hospital_id' },
  Bank: { table: 'banks', pkColumn: 'bank_id' },
  Telecom: { table: 'telecom_operators', pkColumn: 'operator_id' },
  Insurance: { table: 'insurance_providers', pkColumn: 'provider_id' },
};

@Injectable()
export class SuperAdminService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async getDashboard() {
    const [
      usersByRole,
      hospitalsByStatus,
      banksByStatus,
      operatorsByStatus,
      providersByStatus,
      [{ count: roleCount }],
      [{ count: permissionCount }],
      recentAuditLogCount,
    ] = await Promise.all([
      this.dataSource.query<RoleCountRow[]>(
        `SELECT r.role_name, COUNT(*)::int AS count
         FROM member_roles mr
         JOIN roles r ON r.role_id = mr.role_id
         GROUP BY r.role_name`,
      ),
      this.countByStatus('hospitals'),
      this.countByStatus('banks'),
      this.countByStatus('telecom_operators'),
      this.countByStatus('insurance_providers'),
      this.dataSource.query<{ count: number }[]>(
        `SELECT COUNT(*)::int AS count FROM roles`,
      ),
      this.dataSource.query<{ count: number }[]>(
        `SELECT COUNT(*)::int AS count FROM permissions`,
      ),
      this.auditLogsService.countRecent(24),
    ]);

    return {
      usersByRole: Object.fromEntries(
        usersByRole.map((row) => [row.role_name, row.count]),
      ),
      hospitalsByStatus,
      banksByStatus,
      operatorsByStatus,
      providersByStatus,
      roleCount,
      permissionCount,
      recentAuditLogCount,
    };
  }

  async listAdministrators() {
    const rows = await this.dataSource.query<AdministratorRow[]>(
      `SELECT u.user_id, u.first_name, u.second_name, u.surname, u.email,
              u.member_status, u.created_at, r.role_name,
              h.hospital_name, b.bank_name, t.operator_name, ip.provider_name
       FROM users u
       JOIN member_roles mr ON mr.member_id = u.user_id
       JOIN roles r ON r.role_id = mr.role_id
       LEFT JOIN hospitals h ON h.hospital_id = u.hospital_id
       LEFT JOIN banks b ON b.bank_id = u.bank_id
       LEFT JOIN telecom_operators t ON t.operator_id = u.telecom_operator_id
       LEFT JOIN insurance_providers ip ON ip.provider_id = u.insurance_provider_id
       WHERE r.role_name != 'Member'
       ORDER BY u.created_at DESC`,
    );

    return rows.map((row) => ({
      userId: row.user_id,
      firstName: row.first_name,
      secondName: row.second_name,
      surname: row.surname,
      email: row.email,
      status: row.member_status,
      createdAt: row.created_at,
      role: row.role_name,
      tenantName:
        row.hospital_name ??
        row.bank_name ??
        row.operator_name ??
        row.provider_name ??
        null,
    }));
  }

  async listTenants(): Promise<{
    hospitals: TenantOption[];
    banks: TenantOption[];
    telecomOperators: TenantOption[];
    insuranceProviders: TenantOption[];
  }> {
    const [hospitals, banks, telecomOperators, insuranceProviders] =
      await Promise.all([
        this.dataSource.query<TenantOption[]>(
          `SELECT hospital_id AS id, hospital_name AS name FROM hospitals ORDER BY hospital_name`,
        ),
        this.dataSource.query<TenantOption[]>(
          `SELECT bank_id AS id, bank_name AS name FROM banks ORDER BY bank_name`,
        ),
        this.dataSource.query<TenantOption[]>(
          `SELECT operator_id AS id, operator_name AS name FROM telecom_operators ORDER BY operator_name`,
        ),
        this.dataSource.query<TenantOption[]>(
          `SELECT provider_id AS id, provider_name AS name FROM insurance_providers ORDER BY provider_name`,
        ),
      ]);

    return { hospitals, banks, telecomOperators, insuranceProviders };
  }

  async createAdministrator(
    dto: CreateAdministratorDto,
    actorId: number,
    ipAddress: string | null = null,
  ) {
    const tenantConfig = TENANT_LOOKUP[dto.role];

    if (tenantConfig && !dto.tenantId) {
      throw new BadRequestException(
        `A ${dto.role} account requires a tenantId`,
      );
    }

    if (!tenantConfig && dto.tenantId) {
      throw new BadRequestException(
        `A ${dto.role} account must not have a tenantId`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      if (tenantConfig && dto.tenantId) {
        const [tenant] = await manager.query<{ id: number }[]>(
          `SELECT ${tenantConfig.pkColumn} AS id FROM ${tenantConfig.table} WHERE ${tenantConfig.pkColumn} = $1`,
          [dto.tenantId],
        );

        if (!tenant) {
          throw new NotFoundException(
            `No ${dto.role} tenant found with id ${dto.tenantId}`,
          );
        }
      }

      const email = dto.email.trim().toLowerCase();
      const nidaNumber = dto.nidaNumber.trim();

      const existingNida = await manager.findOne(User, {
        where: { nidaNumber },
      });

      if (existingNida) {
        throw new ConflictException('NIDA number is already registered');
      }

      const existingEmail = await manager.findOne(User, { where: { email } });

      if (existingEmail) {
        throw new ConflictException('Email is already registered');
      }

      const passwordHash = await bcrypt.hash(dto.password, 12);

      const user = manager.create(User, {
        firstName: dto.firstName.trim(),
        secondName: dto.secondName?.trim() || null,
        surname: dto.surname.trim(),
        email,
        nidaNumber,
        passwordHash,
        memberStatus: 'Active',
        emailVerified: false,
        phoneVerified: false,
        hospitalId: dto.role === 'Hospital' ? (dto.tenantId ?? null) : null,
        bankId: dto.role === 'Bank' ? (dto.tenantId ?? null) : null,
        telecomOperatorId:
          dto.role === 'Telecom' ? (dto.tenantId ?? null) : null,
        insuranceProviderId:
          dto.role === 'Insurance' ? (dto.tenantId ?? null) : null,
      });

      const savedUser = await manager.save(User, user);

      const [roleRow] = await manager.query<{ role_id: number }[]>(
        `SELECT role_id FROM roles WHERE role_name = $1 LIMIT 1`,
        [dto.role],
      );

      if (!roleRow) {
        throw new InternalServerErrorException(
          `${dto.role} role is not configured`,
        );
      }

      await manager.query(
        `INSERT INTO member_roles (member_id, role_id) VALUES ($1, $2)`,
        [savedUser.userId, roleRow.role_id],
      );

      await this.auditLogsService.record(manager, {
        memberId: actorId,
        actionType: 'staff_account.create',
        affectedTable: 'users',
        affectedRecordId: savedUser.userId,
        newValue: { email, role: dto.role, tenantId: dto.tenantId ?? null },
        ipAddress,
      });

      const { passwordHash: _passwordHash, ...safeUser } = savedUser;

      return { ...safeUser, role: dto.role };
    });
  }

  private async countByStatus(
    table: 'hospitals' | 'banks' | 'telecom_operators' | 'insurance_providers',
  ): Promise<Record<string, number>> {
    const rows = await this.dataSource.query<StatusCountRow[]>(
      `SELECT status, COUNT(*)::int AS count FROM ${table} GROUP BY status`,
    );

    return Object.fromEntries(rows.map((row) => [row.status, row.count]));
  }
}
