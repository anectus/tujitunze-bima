import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { User } from '../members/entities/user.entity';
import { ContactMessage } from './entities/contact-message.entity';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class ContactService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    data: CreateContactMessageDto,
    memberId: number | null,
    ipAddress: string | null = null,
  ) {
    return this.dataSource.transaction(async (manager) => {
      let senderName: string;
      let senderEmail: string;

      if (memberId) {
        // Logged-in sender: trust the verified account record over
        // whatever the client happened to send, rather than a free-text
        // name/email field — this is the whole point of capturing
        // credentials instead of just taking self-reported text.
        const user = await manager.findOne(User, {
          where: { userId: memberId },
        });

        if (!user) {
          throw new BadRequestException('Your session is no longer valid.');
        }

        senderName = [user.firstName, user.secondName, user.surname]
          .filter(Boolean)
          .join(' ');

        senderEmail = user.email || data.email?.trim().toLowerCase() || '';

        if (!senderEmail) {
          throw new BadRequestException(
            'Add an email address to your profile, or provide one with this message.',
          );
        }
      } else {
        // Guest sender: nothing to verify against, so name and email
        // are required as plain self-reported fields.
        if (!data.name?.trim() || !data.email?.trim()) {
          throw new BadRequestException('Name and email are required.');
        }

        senderName = data.name.trim();
        senderEmail = data.email.trim().toLowerCase();
      }

      const contactMessage = manager.create(ContactMessage, {
        memberId,
        senderName,
        senderEmail,
        senderPhone: data.phone?.trim() || null,
        nidaNumber: data.nidaNumber?.trim() || null,
        category: data.category,
        subject: data.subject.trim(),
        message: data.message.trim(),
        status: 'New',
        ipAddress,
      });

      const saved = await manager.save(ContactMessage, contactMessage);

      await this.auditLogsService.record(manager, {
        memberId,
        actionType: 'contact_message.create',
        affectedTable: 'contact_messages',
        affectedRecordId: saved.contactMessageId,
        newValue: { category: saved.category, subject: saved.subject },
        ipAddress,
      });

      return {
        message:
          'Your message has been sent. The appropriate Tujitunze team will respond as soon as possible.',
      };
    });
  }
}
