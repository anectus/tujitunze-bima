import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'telecom_transactions' })
export class TelecomTransaction {
  @PrimaryGeneratedColumn({ name: 'telecom_transaction_id' })
  telecomTransactionId: number;

  @Column({ name: 'member_id', nullable: true })
  memberId?: number;

  @Column({ name: 'phone_id', nullable: true })
  phoneId?: number;

  @Column({ name: 'operator_id', nullable: true })
  operatorId?: number;

  @Column({ name: 'external_transaction_id' })
  externalTransactionId: string;

  @Column({ name: 'transaction_amount', type: 'numeric', precision: 15, scale: 2 })
  transactionAmount: string;

  @Column({ name: 'transaction_date' })
  transactionDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
