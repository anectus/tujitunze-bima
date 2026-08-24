import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'audit_logs' })
export class AuditLog {
  @PrimaryGeneratedColumn({ name: 'audit_id' })
  auditId: number;

  @Column({ name: 'action' })
  action: string;

  @Column({ name: 'actor_type', nullable: true })
  actorType?: string;

  @Column({ name: 'actor_id', nullable: true })
  actorId?: number;

  @Column({ name: 'details', type: 'jsonb', nullable: true })
  details?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
