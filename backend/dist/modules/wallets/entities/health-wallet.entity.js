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
exports.HealthWallet = void 0;
const typeorm_1 = require("typeorm");
const decimalTransformer = {
    to: (value) => value,
    from: (value) => parseFloat(value),
};
let HealthWallet = class HealthWallet {
    walletId;
    memberId;
    walletNumber;
    balance;
    walletStatus;
    createdAt;
    updatedAt;
};
exports.HealthWallet = HealthWallet;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({
        name: 'wallet_id',
    }),
    __metadata("design:type", Number)
], HealthWallet.prototype, "walletId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'member_id',
        type: 'integer',
        unique: true,
    }),
    __metadata("design:type", Number)
], HealthWallet.prototype, "memberId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'wallet_number',
        type: 'varchar',
        length: 50,
        unique: true,
    }),
    __metadata("design:type", String)
], HealthWallet.prototype, "walletNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'balance',
        type: 'decimal',
        precision: 15,
        scale: 2,
        default: 0,
        transformer: decimalTransformer,
    }),
    __metadata("design:type", Number)
], HealthWallet.prototype, "balance", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'wallet_status',
        type: 'varchar',
        length: 30,
        default: 'Active',
    }),
    __metadata("design:type", String)
], HealthWallet.prototype, "walletStatus", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({
        name: 'created_at',
        type: 'timestamp',
    }),
    __metadata("design:type", Date)
], HealthWallet.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({
        name: 'updated_at',
        type: 'timestamp',
    }),
    __metadata("design:type", Date)
], HealthWallet.prototype, "updatedAt", void 0);
exports.HealthWallet = HealthWallet = __decorate([
    (0, typeorm_1.Entity)({ name: 'health_wallets' })
], HealthWallet);
//# sourceMappingURL=health-wallet.entity.js.map