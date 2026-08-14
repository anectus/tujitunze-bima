import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';

interface RoleRow {
  role_id: number;
  role_name: string;
  description: string | null;
  user_count: number;
}

interface RolePermissionRow {
  role_id: number;
  permission_id: number;
  permission_name: string;
}

interface PermissionRow {
  permission_id: number;
  permission_name: string;
  description: string | null;
}

@Injectable()
export class SuperAdminRolesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async listRoles() {
    const roles = await this.dataSource.query<RoleRow[]>(
      `SELECT r.role_id, r.role_name, r.description,
              COUNT(mr.member_id)::int AS user_count
       FROM roles r
       LEFT JOIN member_roles mr ON mr.role_id = r.role_id
       GROUP BY r.role_id, r.role_name, r.description
       ORDER BY r.role_id`,
    );

    const rolePermissions = await this.dataSource.query<RolePermissionRow[]>(
      `SELECT rp.role_id, p.permission_id, p.permission_name
       FROM role_permissions rp
       JOIN permissions p ON p.permission_id = rp.permission_id
       ORDER BY p.permission_name`,
    );

    return roles.map((role) => ({
      roleId: role.role_id,
      roleName: role.role_name,
      description: role.description,
      userCount: role.user_count,
      permissions: rolePermissions
        .filter((row) => row.role_id === role.role_id)
        .map((row) => ({ id: row.permission_id, name: row.permission_name })),
    }));
  }

  async listPermissions() {
    const rows = await this.dataSource.query<PermissionRow[]>(
      `SELECT permission_id, permission_name, description
       FROM permissions
       ORDER BY permission_name`,
    );

    return rows.map((row) => ({
      id: row.permission_id,
      name: row.permission_name,
      description: row.description,
    }));
  }

  async createRole(
    dto: CreateRoleDto,
    actorId: number,
    ipAddress: string | null = null,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const roleName = dto.roleName.trim();

      const [existing] = await manager.query<{ role_id: number }[]>(
        `SELECT role_id FROM roles WHERE role_name = $1`,
        [roleName],
      );

      if (existing) {
        throw new ConflictException('A role with this name already exists');
      }

      const [created] = await manager.query<
        { role_id: number; role_name: string; description: string | null }[]
      >(
        `INSERT INTO roles (role_name, description) VALUES ($1, $2)
         RETURNING role_id, role_name, description`,
        [roleName, dto.description?.trim() || null],
      );

      await this.auditLogsService.record(manager, {
        memberId: actorId,
        actionType: 'role.create',
        affectedTable: 'roles',
        affectedRecordId: created.role_id,
        newValue: {
          roleName: created.role_name,
          description: created.description,
        },
        ipAddress,
      });

      return {
        roleId: created.role_id,
        roleName: created.role_name,
        description: created.description,
        userCount: 0,
        permissions: [],
      };
    });
  }

  async updateRolePermissions(
    roleId: number,
    dto: UpdateRolePermissionsDto,
    actorId: number,
    ipAddress: string | null = null,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const [role] = await manager.query<
        { role_id: number; role_name: string }[]
      >(`SELECT role_id, role_name FROM roles WHERE role_id = $1`, [roleId]);

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      const uniqueIds = [...new Set(dto.permissionIds)];
      let validPermissions: {
        permission_id: number;
        permission_name: string;
      }[] = [];

      if (uniqueIds.length > 0) {
        validPermissions = await manager.query<
          { permission_id: number; permission_name: string }[]
        >(
          `SELECT permission_id, permission_name FROM permissions
           WHERE permission_id = ANY($1)`,
          [uniqueIds],
        );

        if (validPermissions.length !== uniqueIds.length) {
          const foundIds = new Set(
            validPermissions.map((row) => row.permission_id),
          );
          const unknownIds = uniqueIds.filter((id) => !foundIds.has(id));

          throw new BadRequestException(
            `Unknown permission id(s): ${unknownIds.join(', ')}`,
          );
        }
      }

      const previous = await manager.query<{ permission_name: string }[]>(
        `SELECT p.permission_name
         FROM role_permissions rp
         JOIN permissions p ON p.permission_id = rp.permission_id
         WHERE rp.role_id = $1`,
        [roleId],
      );

      await manager.query(`DELETE FROM role_permissions WHERE role_id = $1`, [
        roleId,
      ]);

      for (const permission of validPermissions) {
        await manager.query(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)`,
          [roleId, permission.permission_id],
        );
      }

      await this.auditLogsService.record(manager, {
        memberId: actorId,
        actionType: 'role.permissions_update',
        affectedTable: 'role_permissions',
        affectedRecordId: roleId,
        oldValue: { permissions: previous.map((row) => row.permission_name) },
        newValue: {
          permissions: validPermissions.map((row) => row.permission_name),
        },
        ipAddress,
      });

      return {
        roleId: role.role_id,
        roleName: role.role_name,
        permissions: validPermissions.map((row) => ({
          id: row.permission_id,
          name: row.permission_name,
        })),
      };
    });
  }
}
