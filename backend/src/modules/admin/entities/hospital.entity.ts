import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'hospitals' })
export class Hospital {
  @PrimaryGeneratedColumn({
    name: 'hospital_id',
  })
  hospitalId!: number;

  @Column({
    name: 'hospital_name',
    type: 'varchar',
    length: 150,
  })
  hospitalName!: string;

  @Column({
    name: 'hospital_code',
    type: 'varchar',
    length: 50,
    nullable: true,
    unique: true,
  })
  hospitalCode!: string | null;

  @Column({
    name: 'location',
    type: 'text',
    nullable: true,
  })
  location!: string | null;

  @Column({
    name: 'region',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  region!: string | null;

  @Column({
    name: 'district',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  district!: string | null;

  @Column({
    name: 'contact_phone',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  contactPhone!: string | null;

  @Column({
    name: 'license_number',
    type: 'varchar',
    length: 100,
    nullable: true,
    unique: true,
  })
  licenseNumber!: string | null;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 30,
    default: 'Active',
  })
  status!: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  createdAt!: Date;
}
