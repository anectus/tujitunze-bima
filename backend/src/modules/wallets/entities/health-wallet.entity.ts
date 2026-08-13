import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string) => parseFloat(value),
};

@Entity({ name: 'health_wallets' })
export class HealthWallet {
  @PrimaryGeneratedColumn({
    name: 'wallet_id',
  })
  walletId!: number;

  @Column({
    name: 'member_id',
    type: 'integer',
    unique: true,
  })
  memberId!: number;

  @Column({
    name: 'wallet_number',
    type: 'varchar',
    length: 50,
    unique: true,
  })
  walletNumber!: string;

  @Column({
    name: 'balance',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  balance!: number;

  @Column({
    name: 'wallet_status',
    type: 'varchar',
    length: 30,
    default: 'Active',
  })
  walletStatus!: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
  })
  updatedAt!: Date;
}
