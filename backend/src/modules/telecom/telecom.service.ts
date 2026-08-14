import { ForbiddenException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

interface ContributionRow {
  contribution_id: number;
  reference_number: string | null;
  contribution_amount: string;
  contribution_source: string;
  processing_status: string;
  contribution_date: Date;
}

@Injectable()
export class TelecomService {
  constructor(private readonly dataSource: DataSource) {}

  async getDashboard(userId: number) {
    const operatorId = await this.getAssignedOperatorId(userId);

    const [operator] = await this.dataSource.query<
      { operator_name: string; status: string }[]
    >(
      `SELECT operator_name, status FROM telecom_operators WHERE operator_id = $1`,
      [operatorId],
    );

    const [{ count: linkedPhoneCount }] = await this.dataSource.query<
      { count: number }[]
    >(
      `SELECT COUNT(*)::int AS count
       FROM phone_numbers
       WHERE operator_id = $1`,
      [operatorId],
    );

    const [{ count: contributionCount, total: contributionTotal }] =
      await this.dataSource.query<{ count: number; total: string }[]>(
        `SELECT COUNT(*)::int AS count, COALESCE(SUM(contribution_amount), 0) AS total
         FROM telecom_contributions
         WHERE operator_id = $1`,
        [operatorId],
      );

    const recentContributions = await this.dataSource.query<ContributionRow[]>(
      `SELECT contribution_id, reference_number, contribution_amount,
              contribution_source, processing_status, contribution_date
       FROM telecom_contributions
       WHERE operator_id = $1
       ORDER BY contribution_date DESC
       LIMIT 5`,
      [operatorId],
    );

    return {
      operator: {
        name: operator?.operator_name ?? null,
        status: operator?.status ?? null,
      },
      linkedPhoneCount,
      contributionCount,
      contributionTotal,
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

  private async getAssignedOperatorId(userId: number): Promise<number> {
    const [row] = await this.dataSource.query<
      { telecom_operator_id: number | null }[]
    >(`SELECT telecom_operator_id FROM users WHERE user_id = $1`, [userId]);

    if (!row?.telecom_operator_id) {
      throw new ForbiddenException(
        'This account is not assigned to a telecom operator yet',
      );
    }

    return row.telecom_operator_id;
  }
}
