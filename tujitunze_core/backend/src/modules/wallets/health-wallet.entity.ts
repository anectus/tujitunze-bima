import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'health_wallets' })
export class HealthWallet {
  @PrimaryGeneratedColumn({ name: 'wallet_id' })
  walletId: number;

  @Column({ name: 'member_id', unique: true })
  memberId: number;

  @Column({ name: 'wallet_number', unique: true })
  walletNumber: string;

  @Column({ name: 'current_balance', type: 'numeric', precision: 15, scale: 2, default: 0 })
  currentBalance: string;

  @Column({ name: 'currency', length: 3, default: 'TZS' })
  currency: string;

  @Column({ name: 'wallet_status', default: 'ACTIVE' })
  walletStatus: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
