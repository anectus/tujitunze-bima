import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'audit_logs' })
export class AuditLog {
  @PrimaryGeneratedColumn({
    name: 'audit_id',
  })
  auditId!: number;

  @Column({
    name: 'member_id',
    type: 'integer',
    nullable: true,
  })
  memberId!: number | null;

  @Column({
    name: 'action_type',
    type: 'varchar',
    length: 100,
  })
  actionType!: string;

  @Column({
    name: 'affected_table',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  affectedTable!: string | null;

  @Column({
    name: 'affected_record_id',
    type: 'integer',
    nullable: true,
  })
  affectedRecordId!: number | null;

  @Column({
    name: 'old_value',
    type: 'jsonb',
    nullable: true,
  })
  oldValue!: Record<string, unknown> | null;

  @Column({
    name: 'new_value',
    type: 'jsonb',
    nullable: true,
  })
  newValue!: Record<string, unknown> | null;

  @Column({
    name: 'ip_address',
    type: 'inet',
    nullable: true,
  })
  ipAddress!: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  createdAt!: Date;
}
