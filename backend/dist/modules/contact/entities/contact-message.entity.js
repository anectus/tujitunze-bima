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
exports.ContactMessage = void 0;
const typeorm_1 = require("typeorm");
let ContactMessage = class ContactMessage {
    contactMessageId;
    memberId;
    senderName;
    senderEmail;
    senderPhone;
    nidaNumber;
    category;
    subject;
    message;
    status;
    ipAddress;
    createdAt;
};
exports.ContactMessage = ContactMessage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({
        name: 'contact_message_id',
    }),
    __metadata("design:type", Number)
], ContactMessage.prototype, "contactMessageId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'member_id',
        type: 'integer',
        nullable: true,
    }),
    __metadata("design:type", Object)
], ContactMessage.prototype, "memberId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'sender_name',
        type: 'varchar',
        length: 150,
    }),
    __metadata("design:type", String)
], ContactMessage.prototype, "senderName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'sender_email',
        type: 'varchar',
        length: 100,
    }),
    __metadata("design:type", String)
], ContactMessage.prototype, "senderEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'sender_phone',
        type: 'varchar',
        length: 20,
        nullable: true,
    }),
    __metadata("design:type", Object)
], ContactMessage.prototype, "senderPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'nida_number',
        type: 'varchar',
        length: 23,
        nullable: true,
    }),
    __metadata("design:type", Object)
], ContactMessage.prototype, "nidaNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'category',
        type: 'varchar',
        length: 50,
    }),
    __metadata("design:type", String)
], ContactMessage.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'subject',
        type: 'varchar',
        length: 150,
    }),
    __metadata("design:type", String)
], ContactMessage.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'message',
        type: 'text',
    }),
    __metadata("design:type", String)
], ContactMessage.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'status',
        type: 'varchar',
        length: 30,
        default: 'New',
    }),
    __metadata("design:type", String)
], ContactMessage.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'ip_address',
        type: 'inet',
        nullable: true,
    }),
    __metadata("design:type", Object)
], ContactMessage.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({
        name: 'created_at',
        type: 'timestamp',
    }),
    __metadata("design:type", Date)
], ContactMessage.prototype, "createdAt", void 0);
exports.ContactMessage = ContactMessage = __decorate([
    (0, typeorm_1.Entity)({ name: 'contact_messages' })
], ContactMessage);
//# sourceMappingURL=contact-message.entity.js.map