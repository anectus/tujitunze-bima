import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'notifications' })
export class Notification {
  @PrimaryGeneratedColumn({
    name: 'notification_id',
  })
  notificationId!: number;

  @Column({
    name: 'member_id',
    type: 'integer',
  })
  memberId!: number;

  @Column({
    name: 'notification_type',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  notificationType!: string | null;

  @Column({
    name: 'title',
    type: 'varchar',
    length: 150,
  })
  title!: string;

  @Column({
    name: 'message',
    type: 'text',
  })
  message!: string;

  @Column({
    name: 'delivery_method',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  deliveryMethod!: string | null;

  @Column({
    name: 'delivery_status',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  deliveryStatus!: string | null;

  @CreateDateColumn({
    name: 'sent_date',
    type: 'timestamp',
  })
  sentDate!: Date;

  @Column({
    name: 'read_status',
    type: 'boolean',
    default: false,
  })
  readStatus!: boolean;
}
