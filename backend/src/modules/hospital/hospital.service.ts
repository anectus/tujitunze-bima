import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { UpdateHospitalProfileDto } from './dto/update-hospital-profile.dto';
import { VerifyMemberDto } from './dto/verify-member.dto';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { UpdateTreatmentStatusDto } from './dto/update-treatment-status.dto';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimStatusDto } from './dto/update-claim-status.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';

interface ClaimStatusCountRow {
  claim_status: string;
  count: number;
}

interface ClaimRow {
  claim_id: number;
  claim_number: string;
  claim_amount: string;
  approved_amount: string | null;
  claim_status: string;
  claim_date: Date;
  processed_date: Date | null;
  remarks: string | null;
  member_id: number;
  first_name: string;
  surname: string;
}

interface VerificationRow {
  verification_id: number;
  verification_method: string;
  verification_result: string;
  member_status: string | null;
  verified_date: Date;
  remarks: string | null;
  member_id: number;
  first_name: string;
  surname: string;
  nida_number: string;
}

interface TreatmentRow {
  treatment_id: number;
  member_id: number;
  first_name: string;
  surname: string;
  services_provided: string;
  procedures: string | null;
  prescription: string | null;
  treatment_status: string;
  visit_date: Date;
}

interface PaymentRow {
  payment_id: number;
  claim_id: number;
  claim_number: string;
  amount: string;
  payment_status: string;
  payment_date: Date | null;
  created_at: Date;
}

interface EligibleMemberRow {
  member_id: number;
  first_name: string;
  surname: string;
  member_status: string;
  policy_number: string | null;
  policy_status: string | null;
  plan_name: string | null;
  coverage_amount: string | null;
  last_verified_date: Date;
}

interface StaffRow {
  user_id: number;
  first_name: string;
  surname: string;
  email: string | null;
  member_status: string;
  created_at: Date;
}

interface ActivityLogRow {
  audit_id: number;
  member_id: number | null;
  action_type: string;
  affected_table: string | null;
  affected_record_id: number | null;
  ip_address: string | null;
  created_at: Date;
}

function formatMemberId(userId: number): string {
  return `TB${String(userId).padStart(6, '0')}`;
}

function parseMemberIdToUserId(identifier: string): number | null {
  const match = identifier.trim().match(/^TB0*(\d+)$/i);
  return match ? Number(match[1]) : null;
}

@Injectable()
export class HospitalService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditLogsService: AuditLogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async getAssignedHospitalId(userId: number): Promise<number> {
    const [row] = await this.dataSource.query<{ hospital_id: number | null }[]>(
      `SELECT hospital_id FROM users WHERE user_id = $1`,
      [userId],
    );

    if (!row?.hospital_id) {
      throw new ForbiddenException(
        'This account is not assigned to a hospital yet',
      );
    }

    return row.hospital_id;
  }

  // =====================================================
  // Dashboard Overview
  // =====================================================

  async getDashboard(userId: number) {
    const hospitalId = await this.getAssignedHospitalId(userId);

    const [hospital] = await this.dataSource.query<
      { hospital_name: string; status: string }[]
    >(`SELECT hospital_name, status FROM hospitals WHERE hospital_id = $1`, [
      hospitalId,
    ]);

    const [{ count: verifiedMemberCount }] = await this.dataSource.query<
      { count: number }[]
    >(
      `SELECT COUNT(DISTINCT member_id)::int AS count
       FROM healthcare_verifications
       WHERE hospital_id = $1`,
      [hospitalId],
    );

    const [{ count: eligibleMemberCount }] = await this.dataSource.query<
      { count: number }[]
    >(
      `SELECT COUNT(DISTINCT member_id)::int AS count
       FROM healthcare_verifications
       WHERE hospital_id = $1 AND verification_result = 'Eligible'`,
      [hospitalId],
    );

    const [{ count: activeTreatmentCount }] = await this.dataSource.query<
      { count: number }[]
    >(
      `SELECT COUNT(*)::int AS count
       FROM treatments
       WHERE hospital_id = $1 AND treatment_status = 'Active'`,
      [hospitalId],
    );

    const claimsByStatus = await this.dataSource.query<ClaimStatusCountRow[]>(
      `SELECT claim_status, COUNT(*)::int AS count
       FROM healthcare_claims
       WHERE hospital_id = $1
       GROUP BY claim_status`,
      [hospitalId],
    );

    const [{ count: pendingPaymentCount }] = await this.dataSource.query<
      { count: number }[]
    >(
      `SELECT COUNT(*)::int AS count
       FROM hospital_payments
       WHERE hospital_id = $1 AND payment_status = 'Pending'`,
      [hospitalId],
    );

    return {
      hospital: {
        name: hospital?.hospital_name ?? null,
        status: hospital?.status ?? null,
      },
      verifiedMemberCount,
      eligibleMemberCount,
      activeTreatmentCount,
      totalClaims: claimsByStatus.reduce((sum, row) => sum + row.count, 0),
      pendingClaims:
        claimsByStatus.find((r) => r.claim_status === 'Pending')?.count ?? 0,
      approvedClaims:
        claimsByStatus.find((r) => r.claim_status === 'Approved')?.count ?? 0,
      pendingPayments: pendingPaymentCount,
    };
  }

  // =====================================================
  // Hospital Profile
  // =====================================================

  async getHospitalProfile(userId: number) {
    const hospitalId = await this.getAssignedHospitalId(userId);

    const [hospital] = await this.dataSource.query<
      {
        hospital_id: number;
        hospital_name: string;
        hospital_code: string | null;
        location: string | null;
        region: string | null;
        district: string | null;
        contact_phone: string | null;
        contact_email: string | null;
        license_number: string | null;
        status: string;
        facility_type: string | null;
        bed_capacity: number | null;
        services_offered: string | null;
        created_at: Date;
      }[]
    >(
      `SELECT hospital_id, hospital_name, hospital_code, location, region, district,
              contact_phone, contact_email, license_number, status,
              facility_type, bed_capacity, services_offered, created_at
       FROM hospitals
       WHERE hospital_id = $1`,
      [hospitalId],
    );

    if (!hospital) {
      throw new NotFoundException('Hospital not found');
    }

    return hospital;
  }

  async updateHospitalProfile(
    userId: number,
    data: UpdateHospitalProfileDto,
    ipAddress: string | null = null,
  ) {
    const hospitalId = await this.getAssignedHospitalId(userId);

    await this.dataSource.query(
      `UPDATE hospitals
       SET contact_phone = COALESCE($2, contact_phone),
           contact_email = COALESCE($3, contact_email),
           facility_type = COALESCE($4, facility_type),
           bed_capacity = COALESCE($5, bed_capacity),
           services_offered = COALESCE($6, services_offered)
       WHERE hospital_id = $1`,
      [
        hospitalId,
        data.contactPhone ?? null,
        data.contactEmail ?? null,
        data.facilityType ?? null,
        data.bedCapacity ?? null,
        data.servicesOffered ?? null,
      ],
    );

    await this.dataSource.transaction((manager) =>
      this.auditLogsService.record(manager, {
        memberId: userId,
        actionType: 'hospital.profile_update',
        affectedTable: 'hospitals',
        affectedRecordId: hospitalId,
        newValue: { ...data },
        ipAddress,
      }),
    );

    return this.getHospitalProfile(userId);
  }

  async listAuthorizedUsers(userId: number) {
    const hospitalId = await this.getAssignedHospitalId(userId);

    return this.dataSource.query<StaffRow[]>(
      `SELECT user_id, first_name, surname, email, member_status, created_at
       FROM users
       WHERE hospital_id = $1
       ORDER BY created_at`,
      [hospitalId],
    );
  }

  // =====================================================
  // Member Verification
  // =====================================================

  async verifyMember(
    userId: number,
    data: VerifyMemberDto,
    ipAddress: string | null = null,
  ) {
    const hospitalId = await this.getAssignedHospitalId(userId);

    let targetUserId: number | null = null;

    if (data.verificationMethod === 'NIDA') {
      const [member] = await this.dataSource.query<{ user_id: number }[]>(
        `SELECT user_id FROM users WHERE nida_number = $1`,
        [data.identifier.trim()],
      );
      targetUserId = member?.user_id ?? null;
    } else {
      targetUserId = parseMemberIdToUserId(data.identifier);
    }

    if (!targetUserId) {
      throw new NotFoundException('No member found for that identifier');
    }

    const [member] = await this.dataSource.query<
      {
        user_id: number;
        first_name: string;
        surname: string;
        member_status: string;
        nida_number: string;
      }[]
    >(
      `SELECT user_id, first_name, surname, member_status, nida_number
       FROM users WHERE user_id = $1`,
      [targetUserId],
    );

    if (!member) {
      throw new NotFoundException('No member found for that identifier');
    }

    const verificationResult =
      member.member_status === 'Active' ? 'Eligible' : 'Not Eligible';

    return this.dataSource.transaction(async (manager) => {
      const [verification] = await manager.query<VerificationRow[]>(
        `INSERT INTO healthcare_verifications
           (hospital_id, member_id, verification_method, verification_result, member_status, remarks)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING verification_id, verification_method, verification_result, member_status, verified_date, remarks`,
        [
          hospitalId,
          member.user_id,
          data.verificationMethod,
          verificationResult,
          member.member_status,
          data.remarks ?? null,
        ],
      );

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

  async listVerifications(userId: number, page: number, pageSize: number) {
    const hospitalId = await this.getAssignedHospitalId(userId);

    const [{ count: total }] = await this.dataSource.query<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count FROM healthcare_verifications WHERE hospital_id = $1`,
      [hospitalId],
    );

    const items = await this.dataSource.query<VerificationRow[]>(
      `SELECT v.verification_id, v.verification_method, v.verification_result, v.member_status,
              v.verified_date, v.remarks, u.user_id AS member_id, u.first_name, u.surname, u.nida_number
       FROM healthcare_verifications v
       JOIN users u ON u.user_id = v.member_id
       WHERE v.hospital_id = $1
       ORDER BY v.verified_date DESC
       LIMIT $2 OFFSET $3`,
      [hospitalId, pageSize, (page - 1) * pageSize],
    );

    return { items, total, page, pageSize };
  }

  // =====================================================
  // Eligible Members
  // =====================================================

  async listEligibleMembers(userId: number) {
    const hospitalId = await this.getAssignedHospitalId(userId);

    return this.dataSource.query<EligibleMemberRow[]>(
      `SELECT DISTINCT ON (u.user_id)
         u.user_id AS member_id, u.first_name, u.surname, u.member_status,
         mi.policy_number, mi.policy_status, ip.plan_name, ip.coverage_amount,
         v.verified_date AS last_verified_date
       FROM healthcare_verifications v
       JOIN users u ON u.user_id = v.member_id
       LEFT JOIN member_insurance mi ON mi.member_id = u.user_id AND mi.policy_status = 'Active'
       LEFT JOIN insurance_plans ip ON ip.plan_id = mi.plan_id
       WHERE v.hospital_id = $1 AND v.verification_result = 'Eligible'
       ORDER BY u.user_id, v.verified_date DESC`,
      [hospitalId],
    );
  }

  // =====================================================
  // Treatment
  // =====================================================

  async createTreatment(
    userId: number,
    data: CreateTreatmentDto,
    ipAddress: string | null = null,
  ) {
    const hospitalId = await this.getAssignedHospitalId(userId);

    const [member] = await this.dataSource.query<{ user_id: number }[]>(
      `SELECT user_id FROM users WHERE user_id = $1`,
      [data.memberId],
    );

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (data.verificationId) {
      const [verification] = await this.dataSource.query<
        { hospital_id: number }[]
      >(
        `SELECT hospital_id FROM healthcare_verifications WHERE verification_id = $1`,
        [data.verificationId],
      );

      if (!verification || verification.hospital_id !== hospitalId) {
        throw new BadRequestException(
          'That verification does not belong to this hospital',
        );
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const [treatment] = await manager.query<TreatmentRow[]>(
        `INSERT INTO treatments
           (hospital_id, member_id, verification_id, services_provided, procedures, prescription, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING treatment_id, member_id, services_provided, procedures, prescription, treatment_status, visit_date`,
        [
          hospitalId,
          data.memberId,
          data.verificationId ?? null,
          data.servicesProvided,
          data.procedures ?? null,
          data.prescription ?? null,
          userId,
        ],
      );

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
        message:
          'A hospital visit and treatment were recorded on your account.',
      });

      return treatment;
    });
  }

  async listTreatments(
    userId: number,
    status: string | undefined,
    page: number,
    pageSize: number,
  ) {
    const hospitalId = await this.getAssignedHospitalId(userId);

    const [{ count: total }] = await this.dataSource.query<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count
       FROM treatments
       WHERE hospital_id = $1 AND ($2::text IS NULL OR treatment_status = $2)`,
      [hospitalId, status ?? null],
    );

    const items = await this.dataSource.query<TreatmentRow[]>(
      `SELECT t.treatment_id, t.member_id, u.first_name, u.surname, t.services_provided,
              t.procedures, t.prescription, t.treatment_status, t.visit_date
       FROM treatments t
       JOIN users u ON u.user_id = t.member_id
       WHERE t.hospital_id = $1 AND ($2::text IS NULL OR t.treatment_status = $2)
       ORDER BY t.visit_date DESC
       LIMIT $3 OFFSET $4`,
      [hospitalId, status ?? null, pageSize, (page - 1) * pageSize],
    );

    return { items, total, page, pageSize };
  }

  async updateTreatmentStatus(
    userId: number,
    treatmentId: number,
    data: UpdateTreatmentStatusDto,
    ipAddress: string | null = null,
  ) {
    const hospitalId = await this.getAssignedHospitalId(userId);

    return this.dataSource.transaction(async (manager) => {
      const [treatment] = await manager.query<{ hospital_id: number }[]>(
        `SELECT hospital_id FROM treatments WHERE treatment_id = $1`,
        [treatmentId],
      );

      if (!treatment) {
        throw new NotFoundException('Treatment not found');
      }

      if (treatment.hospital_id !== hospitalId) {
        throw new ForbiddenException(
          'That treatment does not belong to your hospital',
        );
      }

      await manager.query(
        `UPDATE treatments SET treatment_status = $2 WHERE treatment_id = $1`,
        [treatmentId, data.status],
      );

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

  // =====================================================
  // Claims
  // =====================================================

  async createClaim(
    userId: number,
    data: CreateClaimDto,
    ipAddress: string | null = null,
  ) {
    const hospitalId = await this.getAssignedHospitalId(userId);

    const [member] = await this.dataSource.query<{ user_id: number }[]>(
      `SELECT user_id FROM users WHERE user_id = $1`,
      [data.memberId],
    );

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (data.treatmentId) {
      const [treatment] = await this.dataSource.query<
        { hospital_id: number }[]
      >(`SELECT hospital_id FROM treatments WHERE treatment_id = $1`, [
        data.treatmentId,
      ]);

      if (!treatment || treatment.hospital_id !== hospitalId) {
        throw new BadRequestException(
          'That treatment does not belong to this hospital',
        );
      }
    }

    const claimNumber = `CLM-${Date.now().toString(36).toUpperCase()}-${hospitalId}`;
    const status = data.isDraft ? 'Draft' : 'Pending';

    return this.dataSource.transaction(async (manager) => {
      const [claim] = await manager.query<ClaimRow[]>(
        `INSERT INTO healthcare_claims
           (member_id, hospital_id, member_insurance_id, treatment_id, claim_number, claim_amount, claim_status, remarks)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING claim_id, claim_number, claim_amount, approved_amount, claim_status, claim_date, processed_date, remarks, member_id`,
        [
          data.memberId,
          hospitalId,
          data.memberInsuranceId ?? null,
          data.treatmentId ?? null,
          claimNumber,
          data.claimAmount,
          status,
          data.remarks ?? null,
        ],
      );

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

  async submitDraftClaim(
    userId: number,
    claimId: number,
    ipAddress: string | null = null,
  ) {
    const hospitalId = await this.getAssignedHospitalId(userId);

    return this.dataSource.transaction(async (manager) => {
      const [claim] = await manager.query<
        {
          hospital_id: number;
          claim_status: string;
          member_id: number;
          claim_number: string;
          claim_amount: string;
        }[]
      >(
        `SELECT hospital_id, claim_status, member_id, claim_number, claim_amount
         FROM healthcare_claims WHERE claim_id = $1`,
        [claimId],
      );

      if (!claim) {
        throw new NotFoundException('Claim not found');
      }

      if (claim.hospital_id !== hospitalId) {
        throw new ForbiddenException(
          'That claim does not belong to your hospital',
        );
      }

      if (claim.claim_status !== 'Draft') {
        throw new BadRequestException('Only a draft claim can be submitted');
      }

      await manager.query(
        `UPDATE healthcare_claims SET claim_status = 'Pending' WHERE claim_id = $1`,
        [claimId],
      );

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

  async listClaims(
    userId: number,
    status: string | undefined,
    page: number,
    pageSize: number,
  ) {
    const hospitalId = await this.getAssignedHospitalId(userId);

    const [{ count: total }] = await this.dataSource.query<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count
       FROM healthcare_claims
       WHERE hospital_id = $1 AND ($2::text IS NULL OR claim_status = $2)`,
      [hospitalId, status ?? null],
    );

    const items = await this.dataSource.query<ClaimRow[]>(
      `SELECT c.claim_id, c.claim_number, c.claim_amount, c.approved_amount, c.claim_status,
              c.claim_date, c.processed_date, c.remarks, c.member_id, u.first_name, u.surname
       FROM healthcare_claims c
       JOIN users u ON u.user_id = c.member_id
       WHERE c.hospital_id = $1 AND ($2::text IS NULL OR c.claim_status = $2)
       ORDER BY c.claim_date DESC
       LIMIT $3 OFFSET $4`,
      [hospitalId, status ?? null, pageSize, (page - 1) * pageSize],
    );

    return { items, total, page, pageSize };
  }

  // Hospital-initiated status transitions. In a fuller build this would
  // be split between Hospital (submit/dispute) and Insurance
  // (approve/reject) — Insurance has no claims-processing endpoint yet
  // (still a single dashboard stub), so all transitions live here for
  // now rather than blocking this pass on that module.
  async updateClaimStatus(
    userId: number,
    claimId: number,
    data: UpdateClaimStatusDto,
    ipAddress: string | null = null,
  ) {
    const hospitalId = await this.getAssignedHospitalId(userId);

    return this.dataSource.transaction(async (manager) => {
      const [claim] = await manager.query<
        {
          hospital_id: number;
          member_id: number;
          claim_number: string;
          claim_amount: string;
          claim_status: string;
        }[]
      >(
        `SELECT hospital_id, member_id, claim_number, claim_amount, claim_status
         FROM healthcare_claims WHERE claim_id = $1`,
        [claimId],
      );

      if (!claim) {
        throw new NotFoundException('Claim not found');
      }

      if (claim.hospital_id !== hospitalId) {
        throw new ForbiddenException(
          'That claim does not belong to your hospital',
        );
      }

      const approvedAmount =
        data.approvedAmount ??
        (data.status === 'Approved' ? Number(claim.claim_amount) : null);

      await manager.query(
        `UPDATE healthcare_claims
         SET claim_status = $2::varchar, approved_amount = COALESCE($3, approved_amount),
             processed_date = CASE WHEN $2::varchar IN ('Approved', 'Rejected') THEN NOW() ELSE processed_date END,
             remarks = COALESCE($4, remarks)
         WHERE claim_id = $1`,
        [claimId, data.status, approvedAmount, data.remarks ?? null],
      );

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

      // Approving a claim is what creates the hospital's payment
      // entitlement — see hospital_payments' comment in the migration.
      if (data.status === 'Approved') {
        await manager.query(
          `INSERT INTO hospital_payments (hospital_id, claim_id, amount, payment_status)
           VALUES ($1, $2, $3, 'Pending')`,
          [hospitalId, claimId, approvedAmount],
        );
      }

      return { claimId, status: data.status, approvedAmount };
    });
  }

  // =====================================================
  // Payments — read-only for Hospital (see migration's note: a
  // hospital approving its own payment would be a conflict of
  // interest).
  // =====================================================

  async listPayments(userId: number, status: string | undefined) {
    const hospitalId = await this.getAssignedHospitalId(userId);

    return this.dataSource.query<PaymentRow[]>(
      `SELECT p.payment_id, p.claim_id, c.claim_number, p.amount, p.payment_status, p.payment_date, p.created_at
       FROM hospital_payments p
       JOIN healthcare_claims c ON c.claim_id = p.claim_id
       WHERE p.hospital_id = $1 AND ($2::text IS NULL OR p.payment_status = $2)
       ORDER BY p.created_at DESC`,
      [hospitalId, status ?? null],
    );
  }

  // =====================================================
  // Reports
  // =====================================================

  async getReports(userId: number, period: 'daily' | 'weekly' | 'monthly') {
    const hospitalId = await this.getAssignedHospitalId(userId);

    const truncUnit =
      period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month';

    const treatmentBuckets = await this.dataSource.query<
      { bucket: Date; count: number }[]
    >(
      `SELECT date_trunc($2, visit_date) AS bucket, COUNT(*)::int AS count
       FROM treatments
       WHERE hospital_id = $1
       GROUP BY bucket ORDER BY bucket DESC LIMIT 12`,
      [hospitalId, truncUnit],
    );

    const claimBuckets = await this.dataSource.query<
      { bucket: Date; count: number; total: string }[]
    >(
      `SELECT date_trunc($2, claim_date) AS bucket, COUNT(*)::int AS count, COALESCE(SUM(claim_amount), 0) AS total
       FROM healthcare_claims
       WHERE hospital_id = $1
       GROUP BY bucket ORDER BY bucket DESC LIMIT 12`,
      [hospitalId, truncUnit],
    );

    const paymentTotals = await this.dataSource.query<
      { payment_status: string; count: number; total: string }[]
    >(
      `SELECT payment_status, COUNT(*)::int AS count, COALESCE(SUM(amount), 0) AS total
       FROM hospital_payments
       WHERE hospital_id = $1
       GROUP BY payment_status`,
      [hospitalId],
    );

    const verificationBuckets = await this.dataSource.query<
      { bucket: Date; count: number }[]
    >(
      `SELECT date_trunc($2, verified_date) AS bucket, COUNT(*)::int AS count
       FROM healthcare_verifications
       WHERE hospital_id = $1
       GROUP BY bucket ORDER BY bucket DESC LIMIT 12`,
      [hospitalId, truncUnit],
    );

    return {
      period,
      treatmentBuckets,
      claimBuckets,
      paymentTotals,
      verificationBuckets,
    };
  }

  // =====================================================
  // Audit & Security
  // =====================================================

  async listActivityLogs(userId: number) {
    const hospitalId = await this.getAssignedHospitalId(userId);

    return this.dataSource.query<ActivityLogRow[]>(
      `SELECT audit_id, member_id, action_type, affected_table, affected_record_id, ip_address, created_at
       FROM audit_logs
       WHERE (affected_table = 'hospitals' AND affected_record_id = $1)
          OR member_id = $2
       ORDER BY created_at DESC
       LIMIT 100`,
      [hospitalId, userId],
    );
  }
}
