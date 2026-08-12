import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from './user.entity';

@Entity({ name: 'member_bank_accounts' })
export class MemberBankAccount {
  @PrimaryGeneratedColumn({
    name: 'member_bank_account_id',
  })
  memberBankAccountId!: number;

  @Column({
    name: 'member_id',
    type: 'integer',
  })
  memberId!: number;

  @Column({
    name: 'bank_id',
    type: 'integer',
  })
  bankId!: number;

  @Column({
    name: 'account_number',
    type: 'varchar',
    length: 50,
    unique: true,
  })
  accountNumber!: string;

  @Column({
    name: 'account_holder_name',
    type: 'varchar',
    length: 150,
  })
  accountHolderName!: string;

  @Column({
    name: 'account_type',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  accountType!: string | null;

  @Column({
    name: 'account_status',
    type: 'varchar',
    length: 30,
    default: 'Pending',
  })
  accountStatus!: string;

  @Column({
    name: 'verification_status',
    type: 'varchar',
    length: 30,
    default: 'Pending',
  })
  verificationStatus!: string;

  @Column({
    name: 'is_primary',
    type: 'boolean',
    default: false,
  })
  isPrimary!: boolean;

  @CreateDateColumn({
    name: 'linked_date',
    type: 'timestamp',
  })
  linkedDate!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'member_id',
    referencedColumnName: 'userId',
  })
  user!: User;
}
