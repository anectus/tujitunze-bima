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
exports.TelecomService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
let TelecomService = class TelecomService {
    dataSource;
    auditLogsService;
    constructor(dataSource, auditLogsService) {
        this.dataSource = dataSource;
        this.auditLogsService = auditLogsService;
    }
    async getAssignedOperatorId(userId) {
        const [row] = await this.dataSource.query(`SELECT telecom_operator_id FROM users WHERE user_id = $1`, [userId]);
        if (!row?.telecom_operator_id) {
            throw new common_1.ForbiddenException('This account is not assigned to a telecom operator yet');
        }
        return row.telecom_operator_id;
    }
    async getDashboard(userId) {
        const operatorId = await this.getAssignedOperatorId(userId);
        const [operator] = await this.dataSource.query(`SELECT operator_name, status FROM telecom_operators WHERE operator_id = $1`, [operatorId]);
        const [{ count: linkedPhoneCount }] = await this.dataSource.query(`SELECT COUNT(*)::int AS count
       FROM phone_numbers
       WHERE operator_id = $1`, [operatorId]);
        const [{ count: registeredMemberCount }] = await this.dataSource.query(`SELECT COUNT(DISTINCT user_id)::int AS count
       FROM phone_numbers
       WHERE operator_id = $1`, [operatorId]);
        const [{ count: contributionCount, total: contributionTotal }] = await this.dataSource.query(`SELECT COUNT(*)::int AS count, COALESCE(SUM(contribution_amount), 0) AS total
         FROM telecom_contributions
         WHERE operator_id = $1`, [operatorId]);
        const [{ total: todayTotal, count: todayCount }] = await this.dataSource.query(`SELECT COALESCE(SUM(contribution_amount), 0) AS total, COUNT(*)::int AS count
         FROM telecom_contributions
         WHERE operator_id = $1
           AND contribution_date::date = CURRENT_DATE`, [operatorId]);
        const statusBreakdown = await this.dataSource.query(`SELECT processing_status, COUNT(*)::int AS count
       FROM telecom_contributions
       WHERE operator_id = $1
       GROUP BY processing_status`, [operatorId]);
        const recentContributions = await this.dataSource.query(`SELECT contribution_id, reference_number, contribution_amount,
              contribution_source, processing_status, contribution_date
       FROM telecom_contributions
       WHERE operator_id = $1
       ORDER BY contribution_date DESC
       LIMIT 5`, [operatorId]);
        return {
            operator: {
                name: operator?.operator_name ?? null,
                status: operator?.status ?? null,
            },
            linkedPhoneCount,
            registeredMemberCount,
            contributionCount,
            contributionTotal,
            today: {
                count: todayCount,
                total: todayTotal,
            },
            statusBreakdown: Object.fromEntries(statusBreakdown.map((row) => [row.processing_status, row.count])),
            recentContributions: recentContributions.map((row) => ({
                contributionId: row.contribution_id,
                reference: row.reference_number,
                amount: row.contribution_amount,
                source: row.contribution_source,
                status: row.processing_status,
                date: row.contribution_date,
            })),
        };
    }
    async getOperatorProfile(userId) {
        const operatorId = await this.getAssignedOperatorId(userId);
        const [operator] = await this.dataSource.query(`SELECT operator_id, operator_name, country_code, api_endpoint, status,
              contact_phone, contact_email,
              api_key_preview, api_key_generated_at,
              webhook_url, webhook_secret_generated_at
       FROM telecom_operators
       WHERE operator_id = $1`, [operatorId]);
        if (!operator) {
            throw new common_1.NotFoundException('Operator not found');
        }
        const prefixes = await this.dataSource.query(`SELECT prefix FROM telecom_operator_prefixes
       WHERE operator_id = $1 AND status = 'Active'
       ORDER BY prefix`, [operatorId]);
        return {
            operatorId: operator.operator_id,
            operatorName: operator.operator_name,
            countryCode: operator.country_code,
            apiEndpoint: operator.api_endpoint,
            status: operator.status,
            contactPhone: operator.contact_phone,
            contactEmail: operator.contact_email,
            prefixes: prefixes.map((p) => p.prefix),
            apiKey: {
                hasKey: !!operator.api_key_preview,
                preview: operator.api_key_preview,
                generatedAt: operator.api_key_generated_at,
            },
            webhook: {
                hasWebhook: !!operator.webhook_url,
                url: operator.webhook_url,
                secretGeneratedAt: operator.webhook_secret_generated_at,
            },
        };
    }
    async updateOperatorContact(userId, data, ipAddress = null) {
        const operatorId = await this.getAssignedOperatorId(userId);
        await this.dataSource.query(`UPDATE telecom_operators
       SET contact_phone = COALESCE($2, contact_phone),
           contact_email = COALESCE($3, contact_email),
           updated_at = NOW()
       WHERE operator_id = $1`, [operatorId, data.contactPhone ?? null, data.contactEmail ?? null]);
        await this.dataSource.transaction((manager) => this.auditLogsService.record(manager, {
            memberId: userId,
            actionType: 'telecom_operator.contact_update',
            affectedTable: 'telecom_operators',
            affectedRecordId: operatorId,
            newValue: {
                contactPhone: data.contactPhone,
                contactEmail: data.contactEmail,
            },
            ipAddress,
        }));
        return this.getOperatorProfile(userId);
    }
    async regenerateApiKey(userId, ipAddress = null) {
        const operatorId = await this.getAssignedOperatorId(userId);
        const apiKey = `tk_${crypto.randomBytes(24).toString('hex')}`;
        const apiKeyHash = await bcrypt.hash(apiKey, 12);
        const preview = apiKey.slice(-6);
        await this.dataSource.query(`UPDATE telecom_operators
       SET api_key_hash = $2, api_key_preview = $3, api_key_generated_at = NOW(), updated_at = NOW()
       WHERE operator_id = $1`, [operatorId, apiKeyHash, preview]);
        await this.dataSource.transaction((manager) => this.auditLogsService.record(manager, {
            memberId: userId,
            actionType: 'telecom_operator.api_key_regenerate',
            affectedTable: 'telecom_operators',
            affectedRecordId: operatorId,
            newValue: { preview },
            ipAddress,
        }));
        return {
            apiKey,
            preview,
            message: 'This key is shown only once — store it now. Regenerating it invalidates the previous key.',
        };
    }
    async configureWebhook(userId, data, ipAddress = null) {
        const operatorId = await this.getAssignedOperatorId(userId);
        const webhookSecret = crypto.randomBytes(24).toString('hex');
        await this.dataSource.query(`UPDATE telecom_operators
       SET webhook_url = $2, webhook_secret = $3, webhook_secret_generated_at = NOW(), updated_at = NOW()
       WHERE operator_id = $1`, [operatorId, data.webhookUrl, webhookSecret]);
        await this.dataSource.transaction((manager) => this.auditLogsService.record(manager, {
            memberId: userId,
            actionType: 'telecom_operator.webhook_configure',
            affectedTable: 'telecom_operators',
            affectedRecordId: operatorId,
            newValue: { webhookUrl: data.webhookUrl },
            ipAddress,
        }));
        return {
            webhookUrl: data.webhookUrl,
            webhookSecret,
            message: 'This signing secret is shown only once — store it now. Reconfiguring the webhook issues a new one.',
        };
    }
    async testConnection(userId) {
        const operatorId = await this.getAssignedOperatorId(userId);
        const [operator] = await this.dataSource.query(`SELECT api_endpoint FROM telecom_operators WHERE operator_id = $1`, [
            operatorId,
        ]);
        if (!operator?.api_endpoint) {
            throw new common_1.BadRequestException('No API endpoint is configured for this operator yet');
        }
        const startedAt = Date.now();
        let success = false;
        let responseStatus = null;
        let message;
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(operator.api_endpoint, {
                method: 'GET',
                signal: controller.signal,
            });
            clearTimeout(timeout);
            responseStatus = response.status;
            success = response.ok;
            message = success
                ? `Reached ${operator.api_endpoint} in ${Date.now() - startedAt}ms`
                : `Endpoint responded with HTTP ${response.status}`;
        }
        catch (err) {
            message = err instanceof Error ? err.message : 'Connection failed';
        }
        await this.dataSource.query(`INSERT INTO api_access_logs
         (operator_id, actor_id, event_type, endpoint, response_status, success, message)
       VALUES ($1, $2, 'connection_test', $3, $4, $5, $6)`, [
            operatorId,
            userId,
            operator.api_endpoint,
            responseStatus,
            success,
            message,
        ]);
        return { success, responseStatus, message };
    }
    async listMembers(userId, page, pageSize) {
        const operatorId = await this.getAssignedOperatorId(userId);
        const [{ count: total }] = await this.dataSource.query(`SELECT COUNT(DISTINCT u.user_id)::int AS count
       FROM users u
       INNER JOIN phone_numbers p ON p.user_id = u.user_id
       WHERE p.operator_id = $1`, [operatorId]);
        const members = await this.dataSource.query(`SELECT
         u.user_id, u.first_name, u.surname, u.member_status, u.phone_verified,
         COALESCE(
           json_agg(
             json_build_object(
               'phoneId', p.phone_id,
               'phoneNumber', p.phone_number,
               'isPrimary', p.is_primary,
               'phoneStatus', p.phone_status
             )
           ) FILTER (WHERE p.phone_id IS NOT NULL AND p.operator_id = $1),
           '[]'
         ) AS phone_numbers
       FROM users u
       INNER JOIN phone_numbers p ON p.user_id = u.user_id
       WHERE u.user_id IN (
         SELECT DISTINCT user_id FROM phone_numbers WHERE operator_id = $1
       )
       GROUP BY u.user_id
       ORDER BY u.user_id DESC
       LIMIT $2 OFFSET $3`, [operatorId, pageSize, (page - 1) * pageSize]);
        return { items: members, total, page, pageSize };
    }
    async listContributions(userId, status, page, pageSize) {
        const operatorId = await this.getAssignedOperatorId(userId);
        const [{ count: total }] = await this.dataSource.query(`SELECT COUNT(*)::int AS count
       FROM telecom_contributions
       WHERE operator_id = $1 AND ($2::text IS NULL OR processing_status = $2)`, [operatorId, status ?? null]);
        const items = await this.dataSource.query(`SELECT contribution_id, reference_number, contribution_amount,
              contribution_source, processing_status, contribution_date
       FROM telecom_contributions
       WHERE operator_id = $1 AND ($2::text IS NULL OR processing_status = $2)
       ORDER BY contribution_date DESC
       LIMIT $3 OFFSET $4`, [operatorId, status ?? null, pageSize, (page - 1) * pageSize]);
        return { items, total, page, pageSize };
    }
    async exportContributionsCsv(userId, status) {
        const operatorId = await this.getAssignedOperatorId(userId);
        const rows = await this.dataSource.query(`SELECT contribution_id, reference_number, contribution_amount,
              contribution_source, processing_status, contribution_date
       FROM telecom_contributions
       WHERE operator_id = $1 AND ($2::text IS NULL OR processing_status = $2)
       ORDER BY contribution_date DESC`, [operatorId, status ?? null]);
        const header = 'Contribution ID,Reference,Amount,Source,Status,Date';
        const lines = rows.map((row) => [
            row.contribution_id,
            row.reference_number ?? '',
            row.contribution_amount,
            row.contribution_source,
            row.processing_status,
            new Date(row.contribution_date).toISOString(),
        ]
            .map((value) => `"${String(value).replace(/"/g, '""')}"`)
            .join(','));
        return [header, ...lines].join('\n');
    }
    async listContributionRules() {
        return this.dataSource.query(`SELECT rule_id, rule_type, rate_percent, minimum_amount, effective_date, is_active, created_at
       FROM contribution_rules
       ORDER BY rule_type, effective_date DESC`);
    }
    async createReconciliationRun(userId, data) {
        const operatorId = await this.getAssignedOperatorId(userId);
        return this.dataSource.transaction(async (manager) => {
            let matchedCount = 0;
            const [run] = await manager.query(`INSERT INTO telecom_reconciliation_runs
           (operator_id, initiated_by, total_uploaded, matched_count, unmatched_count)
         VALUES ($1, $2, $3, 0, 0)
         RETURNING run_id`, [operatorId, userId, data.records.length]);
            for (const record of data.records) {
                const [contribution] = await manager.query(`SELECT contribution_id FROM telecom_contributions
           WHERE operator_id = $1 AND reference_number = $2 AND contribution_amount = $3
           LIMIT 1`, [operatorId, record.externalReference, record.amount]);
                const matched = !!contribution;
                if (matched)
                    matchedCount += 1;
                await manager.query(`INSERT INTO telecom_reconciliation_records
             (run_id, external_reference, amount, record_date, matched_contribution_id, match_status)
           VALUES ($1, $2, $3, $4, $5, $6)`, [
                    run.run_id,
                    record.externalReference,
                    record.amount,
                    record.recordDate ?? null,
                    contribution?.contribution_id ?? null,
                    matched ? 'Matched' : 'Unmatched',
                ]);
            }
            const unmatchedCount = data.records.length - matchedCount;
            await manager.query(`UPDATE telecom_reconciliation_runs
         SET matched_count = $2, unmatched_count = $3
         WHERE run_id = $1`, [run.run_id, matchedCount, unmatchedCount]);
            await this.auditLogsService.record(manager, {
                memberId: userId,
                actionType: 'telecom_reconciliation.run',
                affectedTable: 'telecom_reconciliation_runs',
                affectedRecordId: run.run_id,
                newValue: {
                    totalUploaded: data.records.length,
                    matchedCount,
                    unmatchedCount,
                },
            });
            return {
                runId: run.run_id,
                totalUploaded: data.records.length,
                matchedCount,
                unmatchedCount,
            };
        });
    }
    async listReconciliationRuns(userId) {
        const operatorId = await this.getAssignedOperatorId(userId);
        return this.dataSource.query(`SELECT run_id, total_uploaded, matched_count, unmatched_count, run_date
       FROM telecom_reconciliation_runs
       WHERE operator_id = $1
       ORDER BY run_date DESC`, [operatorId]);
    }
    async getReconciliationRun(userId, runId) {
        const operatorId = await this.getAssignedOperatorId(userId);
        const [run] = await this.dataSource.query(`SELECT run_id, total_uploaded, matched_count, unmatched_count, run_date
       FROM telecom_reconciliation_runs
       WHERE run_id = $1 AND operator_id = $2`, [runId, operatorId]);
        if (!run) {
            throw new common_1.NotFoundException('Reconciliation run not found');
        }
        const records = await this.dataSource.query(`SELECT record_id, external_reference, amount, record_date, matched_contribution_id, match_status
       FROM telecom_reconciliation_records
       WHERE run_id = $1
       ORDER BY record_id`, [runId]);
        return { ...run, records };
    }
    async getReports(userId, period) {
        const operatorId = await this.getAssignedOperatorId(userId);
        const truncUnit = period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month';
        const buckets = await this.dataSource.query(`SELECT date_trunc($2, contribution_date) AS bucket,
              COUNT(*)::int AS count,
              COALESCE(SUM(contribution_amount), 0) AS total
       FROM telecom_contributions
       WHERE operator_id = $1
       GROUP BY bucket
       ORDER BY bucket DESC
       LIMIT 12`, [operatorId, truncUnit]);
        const failedByReason = await this.dataSource.query(`SELECT processing_status, COUNT(*)::int AS count
       FROM telecom_contributions
       WHERE operator_id = $1 AND processing_status != 'Completed'
       GROUP BY processing_status`, [operatorId]);
        return {
            period,
            buckets: buckets.map((row) => ({
                bucket: row.bucket,
                count: row.count,
                total: row.total,
            })),
            failedByReason,
        };
    }
    async listActivityLogs(userId) {
        const operatorId = await this.getAssignedOperatorId(userId);
        return this.dataSource.query(`SELECT audit_id, member_id, action_type, affected_table, affected_record_id,
              old_value, new_value, ip_address, created_at
       FROM audit_logs
       WHERE (affected_table = 'telecom_operators' AND affected_record_id = $1)
          OR member_id = $2
       ORDER BY created_at DESC
       LIMIT 100`, [operatorId, userId]);
    }
    async listApiAccessLogs(userId) {
        const operatorId = await this.getAssignedOperatorId(userId);
        return this.dataSource.query(`SELECT log_id, event_type, endpoint, response_status, success, message, created_at
       FROM api_access_logs
       WHERE operator_id = $1
       ORDER BY created_at DESC
       LIMIT 100`, [operatorId]);
    }
};
exports.TelecomService = TelecomService;
exports.TelecomService = TelecomService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        audit_logs_service_1.AuditLogsService])
], TelecomService);
//# sourceMappingURL=telecom.service.js.map