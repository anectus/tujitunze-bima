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
exports.MemberBankAccount = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let MemberBankAccount = class MemberBankAccount {
    memberBankAccountId;
    memberId;
    bankId;
    accountNumber;
    accountHolderName;
    accountType;
    accountStatus;
    verificationStatus;
    isPrimary;
    linkedDate;
    user;
};
exports.MemberBankAccount = MemberBankAccount;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({
        name: 'member_bank_account_id',
    }),
    __metadata("design:type", Number)
], MemberBankAccount.prototype, "memberBankAccountId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'member_id',
        type: 'integer',
    }),
    __metadata("design:type", Number)
], MemberBankAccount.prototype, "memberId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'bank_id',
        type: 'integer',
    }),
    __metadata("design:type", Number)
], MemberBankAccount.prototype, "bankId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'account_number',
        type: 'varchar',
        length: 50,
        unique: true,
    }),
    __metadata("design:type", String)
], MemberBankAccount.prototype, "accountNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'account_holder_name',
        type: 'varchar',
        length: 150,
    }),
    __metadata("design:type", String)
], MemberBankAccount.prototype, "accountHolderName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'account_type',
        type: 'varchar',
        length: 50,
        nullable: true,
    }),
    __metadata("design:type", Object)
], MemberBankAccount.prototype, "accountType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'account_status',
        type: 'varchar',
        length: 30,
        default: 'Pending',
    }),
    __metadata("design:type", String)
], MemberBankAccount.prototype, "accountStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'verification_status',
        type: 'varchar',
        length: 30,
        default: 'Pending',
    }),
    __metadata("design:type", String)
], MemberBankAccount.prototype, "verificationStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'is_primary',
        type: 'boolean',
        default: false,
    }),
    __metadata("design:type", Boolean)
], MemberBankAccount.prototype, "isPrimary", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({
        name: 'linked_date',
        type: 'timestamp',
    }),
    __metadata("design:type", Date)
], MemberBankAccount.prototype, "linkedDate", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({
        name: 'member_id',
        referencedColumnName: 'userId',
    }),
    __metadata("design:type", user_entity_1.User)
], MemberBankAccount.prototype, "user", void 0);
exports.MemberBankAccount = MemberBankAccount = __decorate([
    (0, typeorm_1.Entity)({ name: 'member_bank_accounts' })
], MemberBankAccount);
//# sourceMappingURL=bank-account.entity.js.map