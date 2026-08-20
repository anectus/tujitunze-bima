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
exports.AuditLog = void 0;
const typeorm_1 = require("typeorm");
let AuditLog = class AuditLog {
    auditId;
    memberId;
    actionType;
    affectedTable;
    affectedRecordId;
    oldValue;
    newValue;
    ipAddress;
    createdAt;
};
exports.AuditLog = AuditLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({
        name: 'audit_id',
    }),
    __metadata("design:type", Number)
], AuditLog.prototype, "auditId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'member_id',
        type: 'integer',
        nullable: true,
    }),
    __metadata("design:type", Object)
], AuditLog.prototype, "memberId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'action_type',
        type: 'varchar',
        length: 100,
    }),
    __metadata("design:type", String)
], AuditLog.prototype, "actionType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'affected_table',
        type: 'varchar',
        length: 100,
        nullable: true,
    }),
    __metadata("design:type", Object)
], AuditLog.prototype, "affectedTable", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'affected_record_id',
        type: 'integer',
        nullable: true,
    }),
    __metadata("design:type", Object)
], AuditLog.prototype, "affectedRecordId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'old_value',
        type: 'jsonb',
        nullable: true,
    }),
    __metadata("design:type", Object)
], AuditLog.prototype, "oldValue", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'new_value',
        type: 'jsonb',
        nullable: true,
    }),
    __metadata("design:type", Object)
], AuditLog.prototype, "newValue", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'ip_address',
        type: 'inet',
        nullable: true,
    }),
    __metadata("design:type", Object)
], AuditLog.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({
        name: 'created_at',
        type: 'timestamp',
    }),
    __metadata("design:type", Date)
], AuditLog.prototype, "createdAt", void 0);
exports.AuditLog = AuditLog = __decorate([
    (0, typeorm_1.Entity)({ name: 'audit_logs' })
], AuditLog);
//# sourceMappingURL=audit-log.entity.js.map