"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperAdminRolesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
const CORE_ROLE_NAMES = [
    'Member',
    'Admin',
    'Hospital',
    'Bank',
    'Telecom',
    'Insurance',
    'Super-admin',
];
let SuperAdminRolesService = class SuperAdminRolesService {
    dataSource;
    auditLogsService;
    constructor(dataSource, auditLogsService) {
        this.dataSource = dataSource;
        this.auditLogsService = auditLogsService;
    }
    async listRoles() {
        const roles = await this.dataSource.query(`SELECT r.role_id, r.role_name, r.description,
              COUNT(mr.member_id)::int AS user_count
       FROM roles r
       LEFT JOIN member_roles mr ON mr.role_id = r.role_id
       GROUP BY r.role_id, r.role_name, r.description
       ORDER BY r.role_id`);
        const rolePermissions = await this.dataSource.query(`SELECT rp.role_id, p.permission_id, p.permission_name
       FROM role_permissions rp
       JOIN permissions p ON p.permission_id = rp.permission_id
       ORDER BY p.permission_name`);
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
        const rows = await this.dataSource.query(`SELECT permission_id, permission_name, description
       FROM permissions
       ORDER BY permission_name`);
        return rows.map((row) => ({
            id: row.permission_id,
            name: row.permission_name,
            description: row.description,
        }));
    }
    async createRole(dto, actorId, ipAddress = null) {
        return this.dataSource.transaction(async (manager) => {
            const roleName = dto.roleName.trim();
            const [existing] = await manager.query(`SELECT role_id FROM roles WHERE role_name = $1`, [roleName]);
            if (existing) {
                throw new common_1.ConflictException('A role with this name already exists');
            }
            const [created] = await manager.query(`INSERT INTO roles (role_name, description) VALUES ($1, $2)
         RETURNING role_id, role_name, description`, [roleName, dto.description?.trim() || null]);
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
    async updateRolePermissions(roleId, dto, actorId, ipAddress = null) {
        return this.dataSource.transaction(async (manager) => {
            const [role] = await manager.query(`SELECT role_id, role_name FROM roles WHERE role_id = $1`, [roleId]);
            if (!role) {
                throw new common_1.NotFoundException('Role not found');
            }
            const uniqueIds = [...new Set(dto.permissionIds)];
            let validPermissions = [];
            if (uniqueIds.length > 0) {
                validPermissions = await manager.query(`SELECT permission_id, permission_name FROM permissions
           WHERE permission_id = ANY($1)`, [uniqueIds]);
                if (validPermissions.length !== uniqueIds.length) {
                    const foundIds = new Set(validPermissions.map((row) => row.permission_id));
                    const unknownIds = uniqueIds.filter((id) => !foundIds.has(id));
                    throw new common_1.BadRequestException(`Unknown permission id(s): ${unknownIds.join(', ')}`);
                }
            }
            const previous = await manager.query(`SELECT p.permission_name
         FROM role_permissions rp
         JOIN permissions p ON p.permission_id = rp.permission_id
         WHERE rp.role_id = $1`, [roleId]);
            await manager.query(`DELETE FROM role_permissions WHERE role_id = $1`, [
                roleId,
            ]);
            for (const permission of validPermissions) {
                await manager.query(`INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)`, [roleId, permission.permission_id]);
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
    async updateRole(roleId, dto, actorId, ipAddress = null) {
        return this.dataSource.transaction(async (manager) => {
            const [role] = await manager.query(`SELECT role_id, role_name, description FROM roles WHERE role_id = $1`, [roleId]);
            if (!role) {
                throw new common_1.NotFoundException('Role not found');
            }
            const nextRoleName = dto.roleName?.trim() || role.role_name;
            const nextDescription = dto.description !== undefined
                ? dto.description.trim() || null
                : role.description;
            if (nextRoleName !== role.role_name) {
                if (CORE_ROLE_NAMES.includes(role.role_name)) {
                    throw new common_1.ForbiddenException(`${role.role_name} is a core platform role and cannot be renamed`);
                }
                const [existing] = await manager.query(`SELECT role_id FROM roles WHERE role_name = $1 AND role_id != $2`, [nextRoleName, roleId]);
                if (existing) {
                    throw new common_1.ConflictException('A role with this name already exists');
                }
            }
            await manager.query(`UPDATE roles SET role_name = $1, description = $2 WHERE role_id = $3`, [nextRoleName, nextDescription, roleId]);
            await this.auditLogsService.record(manager, {
                memberId: actorId,
                actionType: 'role.update',
                affectedTable: 'roles',
                affectedRecordId: roleId,
                oldValue: {
                    roleName: role.role_name,
                    description: role.description,
                },
                newValue: {
                    roleName: nextRoleName,
                    description: nextDescription,
                },
                ipAddress,
            });
            const [userCountRow] = await manager.query(`SELECT COUNT(*)::int AS user_count FROM member_roles WHERE role_id = $1`, [roleId]);
            const rolePermissions = await manager.query(`SELECT rp.role_id, p.permission_id, p.permission_name
         FROM role_permissions rp
         JOIN permissions p ON p.permission_id = rp.permission_id
         WHERE rp.role_id = $1
         ORDER BY p.permission_name`, [roleId]);
            return {
                roleId,
                roleName: nextRoleName,
                description: nextDescription,
                userCount: userCountRow.user_count,
                permissions: rolePermissions.map((row) => ({
                    id: row.permission_id,
                    name: row.permission_name,
                })),
            };
        });
    }
    async deleteRole(roleId, actorId, ipAddress = null) {
        return this.dataSource.transaction(async (manager) => {
            const [role] = await manager.query(`SELECT role_id, role_name, description FROM roles WHERE role_id = $1`, [roleId]);
            if (!role) {
                throw new common_1.NotFoundException('Role not found');
            }
            if (CORE_ROLE_NAMES.includes(role.role_name)) {
                throw new common_1.ForbiddenException(`${role.role_name} is a core platform role and cannot be deleted`);
            }
            const [userCountRow] = await manager.query(`SELECT COUNT(*)::int AS user_count FROM member_roles WHERE role_id = $1`, [roleId]);
            if (userCountRow.user_count > 0) {
                throw new common_1.ConflictException(`Cannot delete a role with ${userCountRow.user_count} assigned account(s) — reassign them first`);
            }
            await manager.query(`DELETE FROM roles WHERE role_id = $1`, [roleId]);
            await this.auditLogsService.record(manager, {
                memberId: actorId,
                actionType: 'role.delete',
                affectedTable: 'roles',
                affectedRecordId: roleId,
                oldValue: {
                    roleName: role.role_name,
                    description: role.description,
                },
                ipAddress,
            });
            return { roleId, roleName: role.role_name };
        });
    }
};
exports.SuperAdminRolesService = SuperAdminRolesService;
exports.SuperAdminRolesService = SuperAdminRolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        audit_logs_service_1.AuditLogsService])
], SuperAdminRolesService);
//# sourceMappingURL=super-admin-roles.service.js.map