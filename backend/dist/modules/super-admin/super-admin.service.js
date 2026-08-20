"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperAdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("../members/entities/user.entity");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
const TENANT_LOOKUP = {
    Hospital: { table: 'hospitals', pkColumn: 'hospital_id' },
    Bank: { table: 'banks', pkColumn: 'bank_id' },
    Telecom: { table: 'telecom_operators', pkColumn: 'operator_id' },
    Insurance: { table: 'insurance_providers', pkColumn: 'provider_id' },
};
let SuperAdminService = class SuperAdminService {
    dataSource;
    auditLogsService;
    constructor(dataSource, auditLogsService) {
        this.dataSource = dataSource;
        this.auditLogsService = auditLogsService;
    }
    async getDashboard() {
        const [usersByRole, hospitalsByStatus, banksByStatus, operatorsByStatus, providersByStatus, [{ count: roleCount }], [{ count: permissionCount }], recentAuditLogCount,] = await Promise.all([
            this.dataSource.query(`SELECT r.role_name, COUNT(*)::int AS count
         FROM member_roles mr
         JOIN roles r ON r.role_id = mr.role_id
         GROUP BY r.role_name`),
            this.countByStatus('hospitals'),
            this.countByStatus('banks'),
            this.countByStatus('telecom_operators'),
            this.countByStatus('insurance_providers'),
            this.dataSource.query(`SELECT COUNT(*)::int AS count FROM roles`),
            this.dataSource.query(`SELECT COUNT(*)::int AS count FROM permissions`),
            this.auditLogsService.countRecent(24),
        ]);
        return {
            usersByRole: Object.fromEntries(usersByRole.map((row) => [row.role_name, row.count])),
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
        const rows = await this.dataSource.query(`SELECT u.user_id, u.first_name, u.second_name, u.surname, u.email,
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
       ORDER BY u.created_at DESC`);
        return rows.map((row) => ({
            userId: row.user_id,
            firstName: row.first_name,
            secondName: row.second_name,
            surname: row.surname,
            email: row.email,
            status: row.member_status,
            createdAt: row.created_at,
            role: row.role_name,
            tenantName: row.hospital_name ??
                row.bank_name ??
                row.operator_name ??
                row.provider_name ??
                null,
        }));
    }
    async listTenants() {
        const [hospitals, banks, telecomOperators, insuranceProviders] = await Promise.all([
            this.dataSource.query(`SELECT hospital_id AS id, hospital_name AS name FROM hospitals ORDER BY hospital_name`),
            this.dataSource.query(`SELECT bank_id AS id, bank_name AS name FROM banks ORDER BY bank_name`),
            this.dataSource.query(`SELECT operator_id AS id, operator_name AS name FROM telecom_operators ORDER BY operator_name`),
            this.dataSource.query(`SELECT provider_id AS id, provider_name AS name FROM insurance_providers ORDER BY provider_name`),
        ]);
        return { hospitals, banks, telecomOperators, insuranceProviders };
    }
    async createAdministrator(dto, actorId, ipAddress = null) {
        const tenantConfig = TENANT_LOOKUP[dto.role];
        if (tenantConfig && !dto.tenantId) {
            throw new common_1.BadRequestException(`A ${dto.role} account requires a tenantId`);
        }
        if (!tenantConfig && dto.tenantId) {
            throw new common_1.BadRequestException(`A ${dto.role} account must not have a tenantId`);
        }
        return this.dataSource.transaction(async (manager) => {
            if (tenantConfig && dto.tenantId) {
                const [tenant] = await manager.query(`SELECT ${tenantConfig.pkColumn} AS id FROM ${tenantConfig.table} WHERE ${tenantConfig.pkColumn} = $1`, [dto.tenantId]);
                if (!tenant) {
                    throw new common_1.NotFoundException(`No ${dto.role} tenant found with id ${dto.tenantId}`);
                }
            }
            const email = dto.email.trim().toLowerCase();
            const nidaNumber = dto.nidaNumber.trim();
            const existingNida = await manager.findOne(user_entity_1.User, {
                where: { nidaNumber },
            });
            if (existingNida) {
                throw new common_1.ConflictException('NIDA number is already registered');
            }
            const existingEmail = await manager.findOne(user_entity_1.User, { where: { email } });
            if (existingEmail) {
                throw new common_1.ConflictException('Email is already registered');
            }
            const passwordHash = await bcrypt.hash(dto.password, 12);
            const user = manager.create(user_entity_1.User, {
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
                telecomOperatorId: dto.role === 'Telecom' ? (dto.tenantId ?? null) : null,
                insuranceProviderId: dto.role === 'Insurance' ? (dto.tenantId ?? null) : null,
            });
            const savedUser = await manager.save(user_entity_1.User, user);
            const [roleRow] = await manager.query(`SELECT role_id FROM roles WHERE role_name = $1 LIMIT 1`, [dto.role]);
            if (!roleRow) {
                throw new common_1.InternalServerErrorException(`${dto.role} role is not configured`);
            }
            await manager.query(`INSERT INTO member_roles (member_id, role_id) VALUES ($1, $2)`, [savedUser.userId, roleRow.role_id]);
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
    async countByStatus(table) {
        const rows = await this.dataSource.query(`SELECT status, COUNT(*)::int AS count FROM ${table} GROUP BY status`);
        return Object.fromEntries(rows.map((row) => [row.status, row.count]));
    }
};
exports.SuperAdminService = SuperAdminService;
exports.SuperAdminService = SuperAdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        audit_logs_service_1.AuditLogsService])
], SuperAdminService);
//# sourceMappingURL=super-admin.service.js.map