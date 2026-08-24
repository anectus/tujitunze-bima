import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'contribution_transactions' })
export class ContributionTransaction {
  @PrimaryGeneratedColumn({ name: 'contribution_id' })
  contributionId: number;

  @Column({ name: 'member_id' })
  memberId: number;

  @Column({ name: 'source_type' })
  sourceType: string;

  @Column({ name: 'telecom_transaction_id', nullable: true })
  telecomTransactionId?: number;

  @Column({ name: 'bank_transaction_id', nullable: true })
  bankTransactionId?: number;

  @Column({ name: 'source_transaction_amount', type: 'numeric', precision: 15, scale: 2 })
  sourceTransactionAmount: string;

  @Column({ name: 'contribution_amount', type: 'numeric', precision: 15, scale: 2 })
  contributionAmount: string;

  @Column({ name: 'contribution_rule' })
  contributionRule: string;

  @Column({ name: 'contribution_rate', type: 'numeric', precision: 8, scale: 5, nullable: true })
  contributionRate?: string;

  @Column({ name: 'external_reference', nullable: true })
  externalReference?: string;

  @Column({ name: 'contribution_status', default: 'COMPLETED' })
  contributionStatus: string;

  @Column({ name: 'currency', length: 3, default: 'TZS' })
  currency: string;

  @Column({ name: 'contribution_date' })
  contributionDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
