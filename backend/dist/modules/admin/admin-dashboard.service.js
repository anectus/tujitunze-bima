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
exports.AdminDashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
let AdminDashboardService = class AdminDashboardService {
    dataSource;
    auditLogsService;
    constructor(dataSource, auditLogsService) {
        this.dataSource = dataSource;
        this.auditLogsService = auditLogsService;
    }
    async getDashboard() {
        const [membersByStatus, hospitalsByStatus, recentAuditLogCount] = await Promise.all([
            this.dataSource.query(`SELECT member_status, COUNT(*)::int AS count
           FROM users
           GROUP BY member_status`),
            this.dataSource.query(`SELECT status, COUNT(*)::int AS count
           FROM hospitals
           GROUP BY status`),
            this.auditLogsService.countRecent(24),
        ]);
        return {
            membersByStatus: Object.fromEntries(membersByStatus.map((row) => [row.member_status, row.count])),
            hospitalsByStatus: Object.fromEntries(hospitalsByStatus.map((row) => [row.status, row.count])),
            recentAuditLogCount,
        };
    }
};
exports.AdminDashboardService = AdminDashboardService;
exports.AdminDashboardService = AdminDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        audit_logs_service_1.AuditLogsService])
], AdminDashboardService);
//# sourceMappingURL=admin-dashboard.service.js.map