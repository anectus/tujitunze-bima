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
exports.HospitalService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
const notifications_service_1 = require("../notifications/notifications.service");
function formatMemberId(userId) {
    return `TB${String(userId).padStart(6, '0')}`;
}
function parseMemberIdToUserId(identifier) {
    const match = identifier.trim().match(/^TB0*(\d+)$/i);
    return match ? Number(match[1]) : null;
}
let HospitalService = class HospitalService {
    dataSource;
    auditLogsService;
    notificationsService;
    constructor(dataSource, auditLogsService, notificationsService) {
        this.dataSource = dataSource;
        this.auditLogsService = auditLogsService;
        this.notificationsService = notificationsService;
    }
    async getAssignedHospitalId(userId) {
        const [row] = await this.dataSource.query(`SELECT hospital_id FROM users WHERE user_id = $1`, [userId]);
        if (!row?.hospital_id) {
            throw new common_1.ForbiddenException('This account is not assigned to a hospital yet');
        }
        return row.hospital_id;
    }
    async getDashboard(userId) {
        const hospitalId = await this.getAssignedHospitalId(userId);
        const [hospital] = await this.dataSource.query(`SELECT hospital_name, status FROM hospitals WHERE hospital_id = $1`, [
            hospitalId,
        ]);
        const [{ count: verifiedMemberCount }] = await this.dataSource.query(`SELECT COUNT(DISTINCT member_id)::int AS count
       FROM healthcare_verifications
       WHERE hospital_id = $1`, [hospitalId]);
        const [{ count: eligibleMemberCount }] = await this.dataSource.query(`SELECT COUNT(DISTINCT member_id)::int AS count
       FROM healthcare_verifications
       WHERE hospital_id = $1 AND verification_result = 'Eligible'`, [hospitalId]);
        const [{ count: activeTreatmentCount }] = await this.dataSource.query(`SELECT COUNT(*)::int AS count
       FROM treatments
       WHERE hospital_id = $1 AND treatment_status = 'Active'`, [hospitalId]);
        const claimsByStatus = await this.dataSource.query(`SELECT claim_status, COUNT(*)::int AS count
       FROM healthcare_claims
       WHERE hospital_id = $1
       GROUP BY claim_status`, [hospitalId]);
        const [{ count: pendingPaymentCount }] = await this.dataSource.query(`SELECT COUNT(*)::int AS count
       FROM hospital_payments
       WHERE hospital_id = $1 AND payment_status = 'Pending'`, [hospitalId]);
        return {
            hospital: {
                name: hospital?.hospital_name ?? null,
                status: hospital?.status ?? null,
            },
            verifiedMemberCount,
            eligibleMemberCount,
            activeTreatmentCount,
            totalClaims: claimsByStatus.reduce((sum, row) => sum + row.count, 0),
            pendingClaims: claimsByStatus.find((r) => r.claim_status === 'Pending')?.count ?? 0,
            approvedClaims: claimsByStatus.find((r) => r.claim_status === 'Approved')?.count ?? 0,
            pendingPayments: pendingPaymentCount,
        };
    }
    async getHospitalProfile(userId) {
        const hospitalId = await this.getAssignedHospitalId(userId);
        const [hospital] = await this.dataSource.query(`SELECT hospital_id, hospital_name, hospital_code, location, region, district,
              contact_phone, contact_email, license_number, status,
              facility_type, bed_capacity, services_offered, created_at
       FROM hospitals
       WHERE hospital_id = $1`, [hospitalId]);
        if (!hospital) {
            throw new common_1.NotFoundException('Hospital not found');
        }
        return hospital;
    }
    async updateHospitalProfile(userId, data, ipAddress = null) {
        const hospitalId = await this.getAssignedHospitalId(userId);
        await this.dataSource.query(`UPDATE hospitals
       SET contact_phone = COALESCE($2, contact_phone),
           contact_email = COALESCE($3, contact_email),
           facility_type = COALESCE($4, facility_type),
           bed_capacity = COALESCE($5, bed_capacity),
           services_offered = COALESCE($6, services_offered)
       WHERE hospital_id = $1`, [
            hospitalId,
            data.contactPhone ?? null,
            data.contactEmail ?? null,
            data.facilityType ?? null,
            data.bedCapacity ?? null,
            data.servicesOffered ?? null,
        ]);
        await this.dataSource.transaction((manager) => this.auditLogsService.record(manager, {
            memberId: userId,
            actionType: 'hospital.profile_update',
            affectedTable: 'hospitals',
            affectedRecordId: hospitalId,
            newValue: { ...data },
            ipAddress,
        }));
        return this.getHospitalProfile(userId);
    }
    async listAuthorizedUsers(userId) {
        const hospitalId = await this.getAssignedHospitalId(userId);
        return this.dataSource.query(`SELECT user_id, first_name, surname, email, member_status, created_at
       FROM users
       WHERE hospital_id = $1
       ORDER BY created_at`, [hospitalId]);
    }
    async verifyMember(userId, data, ipAddress = null) {
        const hospitalId = await this.getAssignedHospitalId(userId);
        let targetUserId = null;
        if (data.verificationMethod === 'NIDA') {
            const [member] = await this.dataSource.query(`SELECT user_id FROM users WHERE nida_number = $1`, [data.identifier.trim()]);
            targetUserId = member?.user_id ?? null;
        }
        else {
            targetUserId = parseMemberIdToUserId(data.identifier);
        }
        if (!targetUserId) {
            throw new common_1.NotFoundException('No member found for that identifier');
        }
        const [member] = await this.dataSource.query(`SELECT user_id, first_name, surname, member_status, nida_number
       FROM users WHERE user_id = $1`, [targetUserId]);
        if (!member) {
            throw new common_1.NotFoundException('No member found for that identifier');
        }
        const verificationResult = member.member_status === 'Active' ? 'Eligible' : 'Not Eligible';
        return this.dataSource.transaction(async (manager) => {
            const [verification] = await manager.query(`INSERT INTO healthcare_verifications
           (hospital_id, member_id, verification_method, verification_result, member_status, remarks)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING verification_id, verification_method, verification_result, member_status, verified_date, remarks`, [
                hospitalId,
                member.user_id,
                data.verificationMethod,
                verificationResult,
                member.member_status,
                data.remarks ?? null,
            ]);
            await this.auditLogsService.record(manager, {
                memberId: userId,
                actionType: 'hospital.member_verify',
                affectedTable: 'healthcare_verifications',
                affectedRecordId: verification.verification_id,
                newValue: { memberId: member.user_id, result: verificationResult },
                ipAddress,
            });
            await this.notificationsService.create(manager, {
                memberId: member.user_id,
                notificationType: 'Verification',
                title: 'Membership verified at a hospital',
                message: `Your membership was checked at check-in and came back "${verificationResult}".`,
            });
            return {
                ...verification,
                member: {
                    memberId: formatMemberId(member.user_id),
                    firstName: member.first_name,
                    surname: member.surname,
                    memberStatus: member.member_status,
                },
            };
        });
    }
    async listVerifications(userId, page, pageSize) {
        const hospitalId = await this.getAssignedHospitalId(userId);
        const [{ count: total }] = await this.dataSource.query(`SELECT COUNT(*)::int AS count FROM healthcare_verifications WHERE hospital_id = $1`, [hospitalId]);
        const items = await this.dataSource.query(`SELECT v.verification_id, v.verification_method, v.verification_result, v.member_status,
              v.verified_date, v.remarks, u.user_id AS member_id, u.first_name, u.surname, u.nida_number
       FROM healthcare_verifications v
       JOIN users u ON u.user_id = v.member_id
       WHERE v.hospital_id = $1
       ORDER BY v.verified_date DESC
       LIMIT $2 OFFSET $3`, [hospitalId, pageSize, (page - 1) * pageSize]);
        return { items, total, page, pageSize };
    }
    async listEligibleMembers(userId) {
        const hospitalId = await this.getAssignedHospitalId(userId);
        return this.dataSource.query(`SELECT DISTINCT ON (u.user_id)
         u.user_id AS member_id, u.first_name, u.surname, u.member_status,
         mi.policy_number, mi.policy_status, ip.plan_name, ip.coverage_amount,
         v.verified_date AS last_verified_date
       FROM healthcare_verifications v
       JOIN users u ON u.user_id = v.member_id
       LEFT JOIN member_insurance mi ON mi.member_id = u.user_id AND mi.policy_status = 'Active'
       LEFT JOIN insurance_plans ip ON ip.plan_id = mi.plan_id
       WHERE v.hospital_id = $1 AND v.verification_result = 'Eligible'
       ORDER BY u.user_id, v.verified_date DESC`, [hospitalId]);
    }
    async createTreatment(userId, data, ipAddress = null) {
        const hospitalId = await this.getAssignedHospitalId(userId);
        const [member] = await this.dataSource.query(`SELECT user_id FROM users WHERE user_id = $1`, [data.memberId]);
        if (!member) {
            throw new common_1.NotFoundException('Member not found');
        }
        if (data.verificationId) {
            const [verification] = await this.dataSource.query(`SELECT hospital_id FROM healthcare_verifications WHERE verification_id = $1`, [data.verificationId]);
            if (!verification || verification.hospital_id !== hospitalId) {
                throw new common_1.BadRequestException('That verification does not belong to this hospital');
            }
        }
        return this.dataSource.transaction(async (manager) => {
            const [treatment] = await manager.query(`INSERT INTO treatments
           (hospital_id, member_id, verification_id, services_provided, procedures, prescription, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING treatment_id, member_id, services_provided, procedures, prescription, treatment_status, visit_date`, [
                hospitalId,
                data.memberId,
                data.verificationId ?? null,
                data.servicesProvided,
                data.procedures ?? null,
                data.prescription ?? null,
                userId,
            ]);
            await this.auditLogsService.record(manager, {
                memberId: userId,
                actionType: 'hospital.treatment_create',
                affectedTable: 'treatments',
                affectedRecordId: treatment.treatment_id,
                newValue: {
                    memberId: data.memberId,
                    servicesProvided: data.servicesProvided,
                },
                ipAddress,
            });
            await this.notificationsService.create(manager, {
                memberId: data.memberId,
                notificationType: 'Verification',
                title: 'Treatment recorded',
                message: 'A hospital visit and treatment were recorded on your account.',
            });
            return treatment;
        });
    }
    async listTreatments(userId, status, page, pageSize) {
        const hospitalId = await this.getAssignedHospitalId(userId);
        const [{ count: total }] = await this.dataSource.query(`SELECT COUNT(*)::int AS count
       FROM treatments
       WHERE hospital_id = $1 AND ($2::text IS NULL OR treatment_status = $2)`, [hospitalId, status ?? null]);
        const items = await this.dataSource.query(`SELECT t.treatment_id, t.member_id, u.first_name, u.surname, t.services_provided,
              t.procedures, t.prescription, t.treatment_status, t.visit_date
       FROM treatments t
       JOIN users u ON u.user_id = t.member_id
       WHERE t.hospital_id = $1 AND ($2::text IS NULL OR t.treatment_status = $2)
       ORDER BY t.visit_date DESC
       LIMIT $3 OFFSET $4`, [hospitalId, status ?? null, pageSize, (page - 1) * pageSize]);
        return { items, total, page, pageSize };
    }
    async updateTreatmentStatus(userId, treatmentId, data, ipAddress = null) {
        const hospitalId = await this.getAssignedHospitalId(userId);
        return this.dataSource.transaction(async (manager) => {
            const [treatment] = await manager.query(`SELECT hospital_id FROM treatments WHERE treatment_id = $1`, [treatmentId]);
            if (!treatment) {
                throw new common_1.NotFoundException('Treatment not found');
            }
            if (treatment.hospital_id !== hospitalId) {
                throw new common_1.ForbiddenException('That treatment does not belong to your hospital');
            }
            await manager.query(`UPDATE treatments SET treatment_status = $2 WHERE treatment_id = $1`, [treatmentId, data.status]);
            await this.auditLogsService.record(manager, {
                memberId: userId,
                actionType: 'hospital.treatment_status_change',
                affectedTable: 'treatments',
                affectedRecordId: treatmentId,
                newValue: { status: data.status },
                ipAddress,
            });
            return { treatmentId, status: data.status };
        });
    }
    async createClaim(userId, data, ipAddress = null) {
        const hospitalId = await this.getAssignedHospitalId(userId);
        const [member] = await this.dataSource.query(`SELECT user_id FROM users WHERE user_id = $1`, [data.memberId]);
        if (!member) {
            throw new common_1.NotFoundException('Member not found');
        }
        if (data.treatmentId) {
            const [treatment] = await this.dataSource.query(`SELECT hospital_id FROM treatments WHERE treatment_id = $1`, [
                data.treatmentId,
            ]);
            if (!treatment || treatment.hospital_id !== hospitalId) {
                throw new common_1.BadRequestException('That treatment does not belong to this hospital');
            }
        }
        const claimNumber = `CLM-${Date.now().toString(36).toUpperCase()}-${hospitalId}`;
        const status = data.isDraft ? 'Draft' : 'Pending';
        return this.dataSource.transaction(async (manager) => {
            const [claim] = await manager.query(`INSERT INTO healthcare_claims
           (member_id, hospital_id, member_insurance_id, treatment_id, claim_number, claim_amount, claim_status, remarks)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING claim_id, claim_number, claim_amount, approved_amount, claim_status, claim_date, processed_date, remarks, member_id`, [
                data.memberId,
                hospitalId,
                data.memberInsuranceId ?? null,
                data.treatmentId ?? null,
                claimNumber,
                data.claimAmount,
                status,
                data.remarks ?? null,
            ]);
            await this.auditLogsService.record(manager, {
                memberId: userId,
                actionType: 'hospital.claim_create',
                affectedTable: 'healthcare_claims',
                affectedRecordId: claim.claim_id,
                newValue: { claimNumber, amount: data.claimAmount, status },
                ipAddress,
            });
            if (status !== 'Draft') {
                await this.notificationsService.create(manager, {
                    memberId: data.memberId,
                    notificationType: 'Claim',
                    title: 'Claim submitted',
                    message: `A claim (${claimNumber}) for TSh ${data.claimAmount.toLocaleString('en-TZ')} was submitted on your behalf.`,
                });
            }
            return claim;
        });
    }
    async submitDraftClaim(userId, claimId, ipAddress = null) {
        const hospitalId = await this.getAssignedHospitalId(userId);
        return this.dataSource.transaction(async (manager) => {
            const [claim] = await manager.query(`SELECT hospital_id, claim_status, member_id, claim_number, claim_amount
         FROM healthcare_claims WHERE claim_id = $1`, [claimId]);
            if (!claim) {
                throw new common_1.NotFoundException('Claim not found');
            }
            if (claim.hospital_id !== hospitalId) {
                throw new common_1.ForbiddenException('That claim does not belong to your hospital');
            }
            if (claim.claim_status !== 'Draft') {
                throw new common_1.BadRequestException('Only a draft claim can be submitted');
            }
            await manager.query(`UPDATE healthcare_claims SET claim_status = 'Pending' WHERE claim_id = $1`, [claimId]);
            await this.auditLogsService.record(manager, {
                memberId: userId,
                actionType: 'hospital.claim_submit',
                affectedTable: 'healthcare_claims',
                affectedRecordId: claimId,
                newValue: { status: 'Pending' },
                ipAddress,
            });
            await this.notificationsService.create(manager, {
                memberId: claim.member_id,
                notificationType: 'Claim',
                title: 'Claim submitted',
                message: `A claim (${claim.claim_number}) for TSh ${Number(claim.claim_amount).toLocaleString('en-TZ')} was submitted on your behalf.`,
            });
            return { claimId, status: 'Pending' };
        });
    }
    async listClaims(userId, status, page, pageSize) {
        const hospitalId = await this.getAssignedHospitalId(userId);
        const [{ count: total }] = await this.dataSource.query(`SELECT COUNT(*)::int AS count
       FROM healthcare_claims
       WHERE hospital_id = $1 AND ($2::text IS NULL OR claim_status = $2)`, [hospitalId, status ?? null]);
        const items = await this.dataSource.query(`SELECT c.claim_id, c.claim_number, c.claim_amount, c.approved_amount, c.claim_status,
              c.claim_date, c.processed_date, c.remarks, c.member_id, u.first_name, u.surname
       FROM healthcare_claims c
       JOIN users u ON u.user_id = c.member_id
       WHERE c.hospital_id = $1 AND ($2::text IS NULL OR c.claim_status = $2)
       ORDER BY c.claim_date DESC
       LIMIT $3 OFFSET $4`, [hospitalId, status ?? null, pageSize, (page - 1) * pageSize]);
        return { items, total, page, pageSize };
    }
    async updateClaimStatus(userId, claimId, data, ipAddress = null) {
        const hospitalId = await this.getAssignedHospitalId(userId);
        return this.dataSource.transaction(async (manager) => {
            const [claim] = await manager.query(`SELECT hospital_id, member_id, claim_number, claim_amount, claim_status
         FROM healthcare_claims WHERE claim_id = $1`, [claimId]);
            if (!claim) {
                throw new common_1.NotFoundException('Claim not found');
            }
            if (claim.hospital_id !== hospitalId) {
                throw new common_1.ForbiddenException('That claim does not belong to your hospital');
            }
            const approvedAmount = data.approvedAmount ??
                (data.status === 'Approved' ? Number(claim.claim_amount) : null);
            await manager.query(`UPDATE healthcare_claims
         SET claim_status = $2::varchar, approved_amount = COALESCE($3, approved_amount),
             processed_date = CASE WHEN $2::varchar IN ('Approved', 'Rejected') THEN NOW() ELSE processed_date END,
             remarks = COALESCE($4, remarks)
         WHERE claim_id = $1`, [claimId, data.status, approvedAmount, data.remarks ?? null]);
            await this.auditLogsService.record(manager, {
                memberId: userId,
                actionType: 'hospital.claim_status_change',
                affectedTable: 'healthcare_claims',
                affectedRecordId: claimId,
                oldValue: { status: claim.claim_status },
                newValue: { status: data.status, approvedAmount },
                ipAddress,
            });
            await this.notificationsService.create(manager, {
                memberId: claim.member_id,
                notificationType: 'Claim',
                title: `Claim ${data.status.toLowerCase()}`,
                message: `Your claim (${claim.claim_number}) is now ${data.status}.`,
            });
            if (data.status === 'Approved') {
                await manager.query(`INSERT INTO hospital_payments (hospital_id, claim_id, amount, payment_status)
           VALUES ($1, $2, $3, 'Pending')`, [hospitalId, claimId, approvedAmount]);
            }
            return { claimId, status: data.status, approvedAmount };
        });
    }
    async listPayments(userId, status) {
        const hospitalId = await this.getAssignedHospitalId(userId);
        return this.dataSource.query(`SELECT p.payment_id, p.claim_id, c.claim_number, p.amount, p.payment_status, p.payment_date, p.created_at
       FROM hospital_payments p
       JOIN healthcare_claims c ON c.claim_id = p.claim_id
       WHERE p.hospital_id = $1 AND ($2::text IS NULL OR p.payment_status = $2)
       ORDER BY p.created_at DESC`, [hospitalId, status ?? null]);
    }
    async getReports(userId, period) {
        const hospitalId = await this.getAssignedHospitalId(userId);
        const truncUnit = period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month';
        const treatmentBuckets = await this.dataSource.query(`SELECT date_trunc($2, visit_date) AS bucket, COUNT(*)::int AS count
       FROM treatments
       WHERE hospital_id = $1
       GROUP BY bucket ORDER BY bucket DESC LIMIT 12`, [hospitalId, truncUnit]);
        const claimBuckets = await this.dataSource.query(`SELECT date_trunc($2, claim_date) AS bucket, COUNT(*)::int AS count, COALESCE(SUM(claim_amount), 0) AS total
       FROM healthcare_claims
       WHERE hospital_id = $1
       GROUP BY bucket ORDER BY bucket DESC LIMIT 12`, [hospitalId, truncUnit]);
        const paymentTotals = await this.dataSource.query(`SELECT payment_status, COUNT(*)::int AS count, COALESCE(SUM(amount), 0) AS total
       FROM hospital_payments
       WHERE hospital_id = $1
       GROUP BY payment_status`, [hospitalId]);
        const verificationBuckets = await this.dataSource.query(`SELECT date_trunc($2, verified_date) AS bucket, COUNT(*)::int AS count
       FROM healthcare_verifications
       WHERE hospital_id = $1
       GROUP BY bucket ORDER BY bucket DESC LIMIT 12`, [hospitalId, truncUnit]);
        return {
            period,
            treatmentBuckets,
            claimBuckets,
            paymentTotals,
            verificationBuckets,
        };
    }
    async listActivityLogs(userId) {
        const hospitalId = await this.getAssignedHospitalId(userId);
        return this.dataSource.query(`SELECT audit_id, member_id, action_type, affected_table, affected_record_id, ip_address, created_at
       FROM audit_logs
       WHERE (affected_table = 'hospitals' AND affected_record_id = $1)
          OR member_id = $2
       ORDER BY created_at DESC
       LIMIT 100`, [hospitalId, userId]);
    }
};
exports.HospitalService = HospitalService;
exports.HospitalService = HospitalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        audit_logs_service_1.AuditLogsService,
        notifications_service_1.NotificationsService])
], HospitalService);
//# sourceMappingURL=hospital.service.js.map