import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from './user.entity';

@Entity({ name: 'phone_numbers' })
export class PhoneNumber {
  @PrimaryGeneratedColumn({
    name: 'phone_id',
  })
  phoneId!: number;

  @Column({
    name: 'user_id',
    type: 'integer',
  })
  userId!: number;

  @Column({
    name: 'operator_id',
    type: 'integer',
  })
  operatorId!: number;

  @Column({
    name: 'phone_number',
    type: 'varchar',
    length: 20,
    unique: true,
  })
  phoneNumber!: string;

  @Column({
    name: 'is_primary',
    type: 'boolean',
    default: false,
  })
  isPrimary!: boolean;

  @Column({
    name: 'phone_status',
    type: 'varchar',
    length: 20,
    default: 'Active',
  })
  phoneStatus!: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.phoneNumbers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'userId',
  })
  user!: User;
}
