"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const notification_entity_1 = require("./entities/notification.entity");
let NotificationsService = class NotificationsService {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async create(manager, entry) {
        const notification = manager.create(notification_entity_1.Notification, {
            memberId: entry.memberId,
            notificationType: entry.notificationType,
            title: entry.title,
            message: entry.message,
            deliveryMethod: entry.deliveryMethod ?? 'In-App',
            deliveryStatus: entry.deliveryStatus ?? 'Delivered',
            readStatus: false,
        });
        await manager.save(notification_entity_1.Notification, notification);
    }
    async listForMember(memberId, page, pageSize) {
        const [items, total] = await this.dataSource.manager.findAndCount(notification_entity_1.Notification, {
            where: { memberId },
            order: { sentDate: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        const unreadCount = await this.dataSource.manager.count(notification_entity_1.Notification, {
            where: { memberId, readStatus: false },
        });
        return { items, total, unreadCount, page, pageSize };
    }
    async markRead(memberId, notificationId) {
        const notification = await this.dataSource.manager.findOne(notification_entity_1.Notification, {
            where: { notificationId },
        });
        if (!notification) {
            throw new common_1.NotFoundException('Notification not found');
        }
        if (notification.memberId !== memberId) {
            throw new common_1.ForbiddenException('That notification does not belong to you');
        }
        notification.readStatus = true;
        return this.dataSource.manager.save(notification_entity_1.Notification, notification);
    }
    async markAllRead(memberId) {
        await this.dataSource.manager.update(notification_entity_1.Notification, { memberId, readStatus: false }, { readStatus: true });
        return { message: 'All notifications marked as read.' };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map