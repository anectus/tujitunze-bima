import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string) => parseFloat(value),
};

@Entity({ name: 'wallet_transactions' })
export class WalletTransaction {
  @PrimaryGeneratedColumn({
    name: 'wallet_transaction_id',
  })
  walletTransactionId!: number;

  @Column({
    name: 'wallet_id',
    type: 'integer',
  })
  walletId!: number;

  @Column({
    name: 'contribution_id',
    type: 'integer',
    nullable: true,
  })
  contributionId!: number | null;

  @Column({
    name: 'bank_transaction_id',
    type: 'integer',
    nullable: true,
  })
  bankTransactionId!: number | null;

  @Column({
    name: 'transaction_type',
    type: 'varchar',
    length: 50,
  })
  transactionType!: string;

  @Column({
    name: 'amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount!: number;

  @Column({
    name: 'transaction_reference',
    type: 'varchar',
    length: 100,
    unique: true,
    nullable: true,
  })
  transactionReference!: string | null;

  @Column({
    name: 'remarks',
    type: 'text',
    nullable: true,
  })
  remarks!: string | null;

  @CreateDateColumn({
    name: 'transaction_date',
    type: 'timestamp',
  })
  transactionDate!: Date;
}
