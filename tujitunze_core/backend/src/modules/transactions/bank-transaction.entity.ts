import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'bank_transactions' })
export class BankTransaction {
  @PrimaryGeneratedColumn({ name: 'bank_transaction_id' })
  bankTransactionId: number;

  @Column({ name: 'member_bank_account_id', nullable: true })
  memberBankAccountId?: number;

  @Column({ name: 'transaction_reference' })
  transactionReference: string;

  @Column({ name: 'transaction_amount', type: 'numeric', precision: 15, scale: 2 })
  transactionAmount: string;

  @Column({ name: 'transaction_date' })
  transactionDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
