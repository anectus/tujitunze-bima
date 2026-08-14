import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AuditLogsService } from '../audit-logs/audit-logs.service';

interface MemberStatusCountRow {
  member_status: string;
  count: number;
}

interface StatusCountRow {
  status: string;
  count: number;
}

@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async getDashboard() {
    const [membersByStatus, hospitalsByStatus, recentAuditLogCount] =
      await Promise.all([
        this.dataSource.query<MemberStatusCountRow[]>(
          `SELECT member_status, COUNT(*)::int AS count
           FROM users
           GROUP BY member_status`,
        ),
        this.dataSource.query<StatusCountRow[]>(
          `SELECT status, COUNT(*)::int AS count
           FROM hospitals
           GROUP BY status`,
        ),
        this.auditLogsService.countRecent(24),
      ]);

    return {
      membersByStatus: Object.fromEntries(
        membersByStatus.map((row) => [row.member_status, row.count]),
      ),
      hospitalsByStatus: Object.fromEntries(
        hospitalsByStatus.map((row) => [row.status, row.count]),
      ),
      recentAuditLogCount,
    };
  }
}
