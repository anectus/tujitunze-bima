import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { HealthWallet } from './health-wallet.entity';

@Entity({ name: 'wallet_transactions' })
export class WalletTransaction {
  @PrimaryGeneratedColumn({ name: 'wallet_transaction_id' })
  walletTransactionId: number;

  @ManyToOne(() => HealthWallet)
  @JoinColumn({ name: 'wallet_id' })
  wallet: HealthWallet;

  @Column({ name: 'member_id' })
  memberId: number;

  @Column({ name: 'contribution_id', nullable: true })
  contributionId?: number;

  @Column({ name: 'transaction_type' })
  transactionType: string;

  @Column({ name: 'amount', type: 'numeric', precision: 15, scale: 2 })
  amount: string;

  @Column({ name: 'balance_before', type: 'numeric', precision: 15, scale: 2 })
  balanceBefore: string;

  @Column({ name: 'balance_after', type: 'numeric', precision: 15, scale: 2 })
  balanceAfter: string;

  @Column({ name: 'transaction_reference' })
  transactionReference: string;

  @Column({ name: 'transaction_status', default: 'COMPLETED' })
  transactionStatus: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
