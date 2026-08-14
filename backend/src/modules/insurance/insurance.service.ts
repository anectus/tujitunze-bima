import { ForbiddenException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

interface ClaimStatusCountRow {
  claim_status: string;
  count: number;
}

interface ClaimRow {
  claim_id: number;
  claim_number: string;
  claim_amount: string;
  claim_status: string;
  claim_date: Date;
}

@Injectable()
export class InsuranceService {
  constructor(private readonly dataSource: DataSource) {}

  async getDashboard(userId: number) {
    const providerId = await this.getAssignedProviderId(userId);

    const [provider] = await this.dataSource.query<
      { provider_name: string; status: string }[]
    >(
      `SELECT provider_name, status FROM insurance_providers WHERE provider_id = $1`,
      [providerId],
    );

    const [{ count: planCount }] = await this.dataSource.query<
      { count: number }[]
    >(
      `SELECT COUNT(*)::int AS count
       FROM insurance_plans
       WHERE provider_id = $1`,
      [providerId],
    );

    const [{ count: activePolicyCount }] = await this.dataSource.query<
      { count: number }[]
    >(
      `SELECT COUNT(*)::int AS count
       FROM member_insurance mi
       JOIN insurance_plans ip ON ip.plan_id = mi.plan_id
       WHERE ip.provider_id = $1 AND mi.policy_status = 'Active'`,
      [providerId],
    );

    const claimsByStatus = await this.dataSource.query<ClaimStatusCountRow[]>(
      `SELECT hc.claim_status, COUNT(*)::int AS count
       FROM healthcare_claims hc
       JOIN member_insurance mi ON mi.member_insurance_id = hc.member_insurance_id
       JOIN insurance_plans ip ON ip.plan_id = mi.plan_id
       WHERE ip.provider_id = $1
       GROUP BY hc.claim_status`,
      [providerId],
    );

    const recentClaims = await this.dataSource.query<ClaimRow[]>(
      `SELECT hc.claim_id, hc.claim_number, hc.claim_amount, hc.claim_status, hc.claim_date
       FROM healthcare_claims hc
       JOIN member_insurance mi ON mi.member_insurance_id = hc.member_insurance_id
       JOIN insurance_plans ip ON ip.plan_id = mi.plan_id
       WHERE ip.provider_id = $1
       ORDER BY hc.claim_date DESC
       LIMIT 5`,
      [providerId],
    );

    return {
      provider: {
        name: provider?.provider_name ?? null,
        status: provider?.status ?? null,
      },
      planCount,
      activePolicyCount,
      totalClaims: claimsByStatus.reduce((sum, row) => sum + row.count, 0),
      claimsByStatus: Object.fromEntries(
        claimsByStatus.map((row) => [row.claim_status, row.count]),
      ),
      recentClaims: recentClaims.map((row) => ({
        claimId: row.claim_id,
        claimNumber: row.claim_number,
        claimAmount: row.claim_amount,
        claimStatus: row.claim_status,
        claimDate: row.claim_date,
      })),
    };
  }

  private async getAssignedProviderId(userId: number): Promise<number> {
    const [row] = await this.dataSource.query<
      { insurance_provider_id: number | null }[]
    >(`SELECT insurance_provider_id FROM users WHERE user_id = $1`, [userId]);

    if (!row?.insurance_provider_id) {
      throw new ForbiddenException(
        'This account is not assigned to an insurance provider yet',
      );
    }

    return row.insurance_provider_id;
  }
}
