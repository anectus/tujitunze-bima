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
exports.PhoneNumber = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let PhoneNumber = class PhoneNumber {
    phoneId;
    userId;
    operatorId;
    phoneNumber;
    accountNumber;
    isPrimary;
    phoneStatus;
    createdAt;
    user;
};
exports.PhoneNumber = PhoneNumber;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({
        name: 'phone_id',
    }),
    __metadata("design:type", Number)
], PhoneNumber.prototype, "phoneId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'user_id',
        type: 'integer',
    }),
    __metadata("design:type", Number)
], PhoneNumber.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'operator_id',
        type: 'integer',
    }),
    __metadata("design:type", Number)
], PhoneNumber.prototype, "operatorId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'phone_number',
        type: 'varchar',
        length: 20,
        unique: true,
    }),
    __metadata("design:type", String)
], PhoneNumber.prototype, "phoneNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'account_number',
        type: 'varchar',
        length: 50,
        nullable: true,
    }),
    __metadata("design:type", Object)
], PhoneNumber.prototype, "accountNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'is_primary',
        type: 'boolean',
        default: false,
    }),
    __metadata("design:type", Boolean)
], PhoneNumber.prototype, "isPrimary", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'phone_status',
        type: 'varchar',
        length: 20,
        default: 'Active',
    }),
    __metadata("design:type", String)
], PhoneNumber.prototype, "phoneStatus", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({
        name: 'created_at',
        type: 'timestamp',
    }),
    __metadata("design:type", Date)
], PhoneNumber.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.phoneNumbers, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({
        name: 'user_id',
        referencedColumnName: 'userId',
    }),
    __metadata("design:type", user_entity_1.User)
], PhoneNumber.prototype, "user", void 0);
exports.PhoneNumber = PhoneNumber = __decorate([
    (0, typeorm_1.Entity)({ name: 'phone_numbers' })
], PhoneNumber);
//# sourceMappingURL=phone-number.entity.js.map