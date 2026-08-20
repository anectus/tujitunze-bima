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
exports.InsuranceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
let InsuranceService = class InsuranceService {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async getDashboard(userId) {
        const providerId = await this.getAssignedProviderId(userId);
        const [provider] = await this.dataSource.query(`SELECT provider_name, status FROM insurance_providers WHERE provider_id = $1`, [providerId]);
        const [{ count: planCount }] = await this.dataSource.query(`SELECT COUNT(*)::int AS count
       FROM insurance_plans
       WHERE provider_id = $1`, [providerId]);
        const [{ count: activePolicyCount }] = await this.dataSource.query(`SELECT COUNT(*)::int AS count
       FROM member_insurance mi
       JOIN insurance_plans ip ON ip.plan_id = mi.plan_id
       WHERE ip.provider_id = $1 AND mi.policy_status = 'Active'`, [providerId]);
        const claimsByStatus = await this.dataSource.query(`SELECT hc.claim_status, COUNT(*)::int AS count
       FROM healthcare_claims hc
       JOIN member_insurance mi ON mi.member_insurance_id = hc.member_insurance_id
       JOIN insurance_plans ip ON ip.plan_id = mi.plan_id
       WHERE ip.provider_id = $1
       GROUP BY hc.claim_status`, [providerId]);
        const recentClaims = await this.dataSource.query(`SELECT hc.claim_id, hc.claim_number, hc.claim_amount, hc.claim_status, hc.claim_date
       FROM healthcare_claims hc
       JOIN member_insurance mi ON mi.member_insurance_id = hc.member_insurance_id
       JOIN insurance_plans ip ON ip.plan_id = mi.plan_id
       WHERE ip.provider_id = $1
       ORDER BY hc.claim_date DESC
       LIMIT 5`, [providerId]);
        return {
            provider: {
                name: provider?.provider_name ?? null,
                status: provider?.status ?? null,
            },
            planCount,
            activePolicyCount,
            totalClaims: claimsByStatus.reduce((sum, row) => sum + row.count, 0),
            claimsByStatus: Object.fromEntries(claimsByStatus.map((row) => [row.claim_status, row.count])),
            recentClaims: recentClaims.map((row) => ({
                claimId: row.claim_id,
                claimNumber: row.claim_number,
                claimAmount: row.claim_amount,
                claimStatus: row.claim_status,
                claimDate: row.claim_date,
            })),
        };
    }
    async getAssignedProviderId(userId) {
        const [row] = await this.dataSource.query(`SELECT insurance_provider_id FROM users WHERE user_id = $1`, [userId]);
        if (!row?.insurance_provider_id) {
            throw new common_1.ForbiddenException('This account is not assigned to an insurance provider yet');
        }
        return row.insurance_provider_id;
    }
};
exports.InsuranceService = InsuranceService;
exports.InsuranceService = InsuranceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], InsuranceService);
//# sourceMappingURL=insurance.service.js.map