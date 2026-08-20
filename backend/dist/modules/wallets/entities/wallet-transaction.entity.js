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
exports.WalletTransaction = void 0;
const typeorm_1 = require("typeorm");
const decimalTransformer = {
    to: (value) => value,
    from: (value) => parseFloat(value),
};
let WalletTransaction = class WalletTransaction {
    walletTransactionId;
    walletId;
    contributionId;
    bankTransactionId;
    transactionType;
    amount;
    transactionReference;
    remarks;
    transactionDate;
};
exports.WalletTransaction = WalletTransaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({
        name: 'wallet_transaction_id',
    }),
    __metadata("design:type", Number)
], WalletTransaction.prototype, "walletTransactionId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'wallet_id',
        type: 'integer',
    }),
    __metadata("design:type", Number)
], WalletTransaction.prototype, "walletId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'contribution_id',
        type: 'integer',
        nullable: true,
    }),
    __metadata("design:type", Object)
], WalletTransaction.prototype, "contributionId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'bank_transaction_id',
        type: 'integer',
        nullable: true,
    }),
    __metadata("design:type", Object)
], WalletTransaction.prototype, "bankTransactionId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'transaction_type',
        type: 'varchar',
        length: 50,
    }),
    __metadata("design:type", String)
], WalletTransaction.prototype, "transactionType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'amount',
        type: 'decimal',
        precision: 15,
        scale: 2,
        transformer: decimalTransformer,
    }),
    __metadata("design:type", Number)
], WalletTransaction.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'transaction_reference',
        type: 'varchar',
        length: 100,
        unique: true,
        nullable: true,
    }),
    __metadata("design:type", Object)
], WalletTransaction.prototype, "transactionReference", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'remarks',
        type: 'text',
        nullable: true,
    }),
    __metadata("design:type", Object)
], WalletTransaction.prototype, "remarks", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({
        name: 'transaction_date',
        type: 'timestamp',
    }),
    __metadata("design:type", Date)
], WalletTransaction.prototype, "transactionDate", void 0);
exports.WalletTransaction = WalletTransaction = __decorate([
    (0, typeorm_1.Entity)({ name: 'wallet_transactions' })
], WalletTransaction);
//# sourceMappingURL=wallet-transaction.entity.js.map