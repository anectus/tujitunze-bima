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
exports.AuditLogsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const audit_log_entity_1 = require("./entities/audit-log.entity");
let AuditLogsService = class AuditLogsService {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async record(manager, entry) {
        const log = manager.create(audit_log_entity_1.AuditLog, {
            memberId: entry.memberId,
            actionType: entry.actionType,
            affectedTable: entry.affectedTable ?? null,
            affectedRecordId: entry.affectedRecordId ?? null,
            oldValue: entry.oldValue ?? null,
            newValue: entry.newValue ?? null,
            ipAddress: entry.ipAddress ?? null,
        });
        await manager.save(audit_log_entity_1.AuditLog, log);
    }
    async list(limit = 200) {
        return this.dataSource.manager.find(audit_log_entity_1.AuditLog, {
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
    async countRecent(hours = 24) {
        const rows = await this.dataSource.query(`SELECT COUNT(*)::int AS count FROM audit_logs
       WHERE created_at >= NOW() - ($1 || ' hours')::interval`, [hours]);
        return rows[0].count;
    }
};
exports.AuditLogsService = AuditLogsService;
exports.AuditLogsService = AuditLogsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], AuditLogsService);
//# sourceMappingURL=audit-logs.service.js.map