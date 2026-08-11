import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('members')
export class Member {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'first_name',
    type: 'varchar',
    length: 100,
  })
  firstName: string;

  @Column({
    name: 'middle_name',
    type: 'varchar',
    length: 100,
  })
  middleName: string;

  @Column({
    type: 'varchar',
    length: 100,
  })
  surname: string;

  @Column({
    name: 'phone_number',
    type: 'varchar',
    length: 20,
    unique: true,
  })
  phoneNumber: string;

  @Column({
    name: 'nida_number',
    type: 'varchar',
    length: 50,
    unique: true,
  })
  nidaNumber: string;

  @Column({
    type: 'varchar',
    length: 150,
    nullable: true,
    unique: true,
  })
  email: string | null;

  @Column({
    name: 'password_hash',
    type: 'varchar',
  })
  passwordHash: string;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;
}
