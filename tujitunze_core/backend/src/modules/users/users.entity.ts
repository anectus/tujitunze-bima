import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  userId: number;

  @Column({ name: 'first_name', nullable: false })
  firstName: string;

  @Column({ name: 'surname', nullable: true })
  surname?: string;

  @Column({ name: 'nida_number', nullable: true, unique: true })
  nidaNumber?: string;

  @Column({ name: 'email', nullable: true, unique: true })
  email?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
