import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'contact_messages' })
export class ContactMessage {
  @PrimaryGeneratedColumn({
    name: 'contact_message_id',
  })
  contactMessageId!: number;

  @Column({
    name: 'member_id',
    type: 'integer',
    nullable: true,
  })
  memberId!: number | null;

  @Column({
    name: 'sender_name',
    type: 'varchar',
    length: 150,
  })
  senderName!: string;

  @Column({
    name: 'sender_email',
    type: 'varchar',
    length: 100,
  })
  senderEmail!: string;

  @Column({
    name: 'sender_phone',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  senderPhone!: string | null;

  @Column({
    name: 'nida_number',
    type: 'varchar',
    length: 23,
    nullable: true,
  })
  nidaNumber!: string | null;

  @Column({
    name: 'category',
    type: 'varchar',
    length: 50,
  })
  category!: string;

  @Column({
    name: 'subject',
    type: 'varchar',
    length: 150,
  })
  subject!: string;

  @Column({
    name: 'message',
    type: 'text',
  })
  message!: string;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 30,
    default: 'New',
  })
  status!: string;

  @Column({
    name: 'ip_address',
    type: 'inet',
    nullable: true,
  })
  ipAddress!: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  createdAt!: Date;
}
