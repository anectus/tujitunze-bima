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
exports.ContactService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../members/entities/user.entity");
const contact_message_entity_1 = require("./entities/contact-message.entity");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
let ContactService = class ContactService {
    dataSource;
    auditLogsService;
    constructor(dataSource, auditLogsService) {
        this.dataSource = dataSource;
        this.auditLogsService = auditLogsService;
    }
    async create(data, memberId, ipAddress = null) {
        return this.dataSource.transaction(async (manager) => {
            let senderName;
            let senderEmail;
            if (memberId) {
                const user = await manager.findOne(user_entity_1.User, {
                    where: { userId: memberId },
                });
                if (!user) {
                    throw new common_1.BadRequestException('Your session is no longer valid.');
                }
                senderName = [user.firstName, user.secondName, user.surname]
                    .filter(Boolean)
                    .join(' ');
                senderEmail = user.email || data.email?.trim().toLowerCase() || '';
                if (!senderEmail) {
                    throw new common_1.BadRequestException('Add an email address to your profile, or provide one with this message.');
                }
            }
            else {
                if (!data.name?.trim() || !data.email?.trim()) {
                    throw new common_1.BadRequestException('Name and email are required.');
                }
                senderName = data.name.trim();
                senderEmail = data.email.trim().toLowerCase();
            }
            const contactMessage = manager.create(contact_message_entity_1.ContactMessage, {
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
            const saved = await manager.save(contact_message_entity_1.ContactMessage, contactMessage);
            await this.auditLogsService.record(manager, {
                memberId,
                actionType: 'contact_message.create',
                affectedTable: 'contact_messages',
                affectedRecordId: saved.contactMessageId,
                newValue: { category: saved.category, subject: saved.subject },
                ipAddress,
            });
            return {
                message: 'Your message has been sent. The appropriate Tujitunze team will respond as soon as possible.',
            };
        });
    }
};
exports.ContactService = ContactService;
exports.ContactService = ContactService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        audit_logs_service_1.AuditLogsService])
], ContactService);
//# sourceMappingURL=contact.service.js.map