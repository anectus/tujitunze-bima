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
exports.Notification = void 0;
const typeorm_1 = require("typeorm");
let Notification = class Notification {
    notificationId;
    memberId;
    notificationType;
    title;
    message;
    deliveryMethod;
    deliveryStatus;
    sentDate;
    readStatus;
};
exports.Notification = Notification;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({
        name: 'notification_id',
    }),
    __metadata("design:type", Number)
], Notification.prototype, "notificationId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'member_id',
        type: 'integer',
    }),
    __metadata("design:type", Number)
], Notification.prototype, "memberId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'notification_type',
        type: 'varchar',
        length: 50,
        nullable: true,
    }),
    __metadata("design:type", Object)
], Notification.prototype, "notificationType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'title',
        type: 'varchar',
        length: 150,
    }),
    __metadata("design:type", String)
], Notification.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'message',
        type: 'text',
    }),
    __metadata("design:type", String)
], Notification.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'delivery_method',
        type: 'varchar',
        length: 50,
        nullable: true,
    }),
    __metadata("design:type", Object)
], Notification.prototype, "deliveryMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'delivery_status',
        type: 'varchar',
        length: 30,
        nullable: true,
    }),
    __metadata("design:type", Object)
], Notification.prototype, "deliveryStatus", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({
        name: 'sent_date',
        type: 'timestamp',
    }),
    __metadata("design:type", Date)
], Notification.prototype, "sentDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'read_status',
        type: 'boolean',
        default: false,
    }),
    __metadata("design:type", Boolean)
], Notification.prototype, "readStatus", void 0);
exports.Notification = Notification = __decorate([
    (0, typeorm_1.Entity)({ name: 'notifications' })
], Notification);
//# sourceMappingURL=notification.entity.js.map