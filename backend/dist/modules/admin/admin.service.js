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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../members/entities/user.entity");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
let AdminService = class AdminService {
    dataSource;
    auditLogsService;
    constructor(dataSource, auditLogsService) {
        this.dataSource = dataSource;
        this.auditLogsService = auditLogsService;
    }
    async listMembers() {
        const users = await this.dataSource.manager.find(user_entity_1.User, {
            order: { createdAt: 'DESC' },
        });
        return users.map(({ passwordHash: _passwordHash, ...safeUser }) => safeUser);
    }
    async getMember(userId) {
        const user = await this.dataSource.manager.findOne(user_entity_1.User, {
            where: { userId },
            relations: { phoneNumbers: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('Member not found');
        }
        const { passwordHash: _passwordHash, ...safeUser } = user;
        return safeUser;
    }
    async updateMemberStatus(userId, data, actorId, ipAddress = null) {
        return this.dataSource.transaction(async (manager) => {
            const user = await manager.findOne(user_entity_1.User, { where: { userId } });
            if (!user) {
                throw new common_1.NotFoundException('Member not found');
            }
            const previousStatus = user.memberStatus;
            user.memberStatus = data.status;
            const saved = await manager.save(user_entity_1.User, user);
            await this.auditLogsService.record(manager, {
                memberId: actorId,
                actionType: 'member.status_change',
                affectedTable: 'users',
                affectedRecordId: userId,
                oldValue: { memberStatus: previousStatus },
                newValue: { memberStatus: saved.memberStatus },
                ipAddress,
            });
            const { passwordHash: _passwordHash, ...safeUser } = saved;
            return safeUser;
        });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        audit_logs_service_1.AuditLogsService])
], AdminService);
//# sourceMappingURL=admin.service.js.map