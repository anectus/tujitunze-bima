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
export class HospitalService {
  constructor(private readonly dataSource: DataSource) {}

  async getDashboard(userId: number) {
    const hospitalId = await this.getAssignedHospitalId(userId);

    const [hospital] = await this.dataSource.query<
      { hospital_name: string; status: string }[]
    >(`SELECT hospital_name, status FROM hospitals WHERE hospital_id = $1`, [
      hospitalId,
    ]);

    const claimsByStatus = await this.dataSource.query<ClaimStatusCountRow[]>(
      `SELECT claim_status, COUNT(*)::int AS count
       FROM healthcare_claims
       WHERE hospital_id = $1
       GROUP BY claim_status`,
      [hospitalId],
    );

    const [{ count: verificationCount }] = await this.dataSource.query<
      { count: number }[]
    >(
      `SELECT COUNT(*)::int AS count
       FROM healthcare_verifications
       WHERE hospital_id = $1`,
      [hospitalId],
    );

    const recentClaims = await this.dataSource.query<ClaimRow[]>(
      `SELECT claim_id, claim_number, claim_amount, claim_status, claim_date
       FROM healthcare_claims
       WHERE hospital_id = $1
       ORDER BY claim_date DESC
       LIMIT 5`,
      [hospitalId],
    );

    return {
      hospital: {
        name: hospital?.hospital_name ?? null,
        status: hospital?.status ?? null,
      },
      totalClaims: claimsByStatus.reduce((sum, row) => sum + row.count, 0),
      claimsByStatus: Object.fromEntries(
        claimsByStatus.map((row) => [row.claim_status, row.count]),
      ),
      verificationCount,
      recentClaims: recentClaims.map((row) => ({
        claimId: row.claim_id,
        claimNumber: row.claim_number,
        claimAmount: row.claim_amount,
        claimStatus: row.claim_status,
        claimDate: row.claim_date,
      })),
    };
  }

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
}
