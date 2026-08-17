import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { Notification } from './entities/notification.entity';

export interface NotificationEntry {
  memberId: number;
  notificationType:
    'Contribution' | 'Membership' | 'Verification' | 'Claim' | 'Security';
  title: string;
  message: string;
  deliveryMethod?: string;
  deliveryStatus?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly dataSource: DataSource) {}

  // Takes the caller's EntityManager, same as AuditLogsService.record —
  // lets a notification be written atomically inside the transaction of
  // the write it's about (e.g. a wallet top-up), so it never describes
  // something that ended up rolled back.
  async create(
    manager: EntityManager,
    entry: NotificationEntry,
  ): Promise<void> {
    const notification = manager.create(Notification, {
      memberId: entry.memberId,
      notificationType: entry.notificationType,
      title: entry.title,
      message: entry.message,
      deliveryMethod: entry.deliveryMethod ?? 'In-App',
      deliveryStatus: entry.deliveryStatus ?? 'Delivered',
      readStatus: false,
    });

    await manager.save(Notification, notification);
  }

  async listForMember(memberId: number, page: number, pageSize: number) {
    const [items, total] = await this.dataSource.manager.findAndCount(
      Notification,
      {
        where: { memberId },
        order: { sentDate: 'DESC' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      },
    );

    const unreadCount = await this.dataSource.manager.count(Notification, {
      where: { memberId, readStatus: false },
    });

    return { items, total, unreadCount, page, pageSize };
  }

  async markRead(memberId: number, notificationId: number) {
    const notification = await this.dataSource.manager.findOne(Notification, {
      where: { notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.memberId !== memberId) {
      throw new ForbiddenException('That notification does not belong to you');
    }

    notification.readStatus = true;

    return this.dataSource.manager.save(Notification, notification);
  }

  async markAllRead(memberId: number) {
    await this.dataSource.manager.update(
      Notification,
      { memberId, readStatus: false },
      { readStatus: true },
    );

    return { message: 'All notifications marked as read.' };
  }
}
