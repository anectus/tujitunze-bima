import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { AuditLog } from './entities/audit-log.entity';

export interface AuditLogEntry {
  memberId: number | null;
  actionType: string;
  affectedTable?: string;
  affectedRecordId?: number;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

@Injectable()
export class AuditLogsService {
  constructor(private readonly dataSource: DataSource) {}

  // Takes the caller's EntityManager (rather than always using
  // this.dataSource.manager) so a write made inside a DB transaction can
  // log atomically with it — if that transaction rolls back, the log
  // entry rolls back too, instead of describing something that never
  // actually happened.
  async record(manager: EntityManager, entry: AuditLogEntry): Promise<void> {
    const log = manager.create(AuditLog, {
      memberId: entry.memberId,
      actionType: entry.actionType,
      affectedTable: entry.affectedTable ?? null,
      affectedRecordId: entry.affectedRecordId ?? null,
      oldValue: entry.oldValue ?? null,
      newValue: entry.newValue ?? null,
      ipAddress: entry.ipAddress ?? null,
    });

    await manager.save(AuditLog, log);
  }

  async list(limit = 200) {
    return this.dataSource.manager.find(AuditLog, {
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async countRecent(hours = 24): Promise<number> {
    const rows = await this.dataSource.query<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count FROM audit_logs
       WHERE created_at >= NOW() - ($1 || ' hours')::interval`,
      [hours],
    );

    return rows[0].count;
  }
}
