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
exports.WalletsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const health_wallet_entity_1 = require("./entities/health-wallet.entity");
const wallet_transaction_entity_1 = require("./entities/wallet-transaction.entity");
const phone_number_entity_1 = require("../members/entities/phone-number.entity");
const bank_account_entity_1 = require("../members/entities/bank-account.entity");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
const notifications_service_1 = require("../notifications/notifications.service");
function formatTsh(amount) {
    return `TSh ${amount.toLocaleString('en-TZ', { minimumFractionDigits: 2 })}`;
}
let WalletsService = class WalletsService {
    dataSource;
    auditLogsService;
    notificationsService;
    constructor(dataSource, auditLogsService, notificationsService) {
        this.dataSource = dataSource;
        this.auditLogsService = auditLogsService;
        this.notificationsService = notificationsService;
    }
    async getOrCreateWallet(manager, memberId) {
        const existing = await manager.findOne(health_wallet_entity_1.HealthWallet, {
            where: { memberId },
        });
        if (existing) {
            return existing;
        }
        const wallet = manager.create(health_wallet_entity_1.HealthWallet, {
            memberId,
            walletNumber: `TW-${memberId}-${Date.now().toString(36).toUpperCase()}`,
            balance: 0,
            walletStatus: 'Active',
        });
        return manager.save(health_wallet_entity_1.HealthWallet, wallet);
    }
    async getWallet(memberId) {
        return this.dataSource.transaction(async (manager) => {
            const wallet = await this.getOrCreateWallet(manager, memberId);
            return {
                walletId: wallet.walletId,
                walletNumber: wallet.walletNumber,
                balance: wallet.balance,
                walletStatus: wallet.walletStatus,
            };
        });
    }
    async topUp(memberId, data, ipAddress = null) {
        return this.dataSource.transaction(async (manager) => {
            let sourceDescription;
            if (data.sourceType === 'phone') {
                const phone = await manager.findOne(phone_number_entity_1.PhoneNumber, {
                    where: { phoneId: data.sourceId },
                });
                if (!phone || phone.userId !== memberId) {
                    throw new common_1.ForbiddenException('That phone number is not linked to your account.');
                }
                sourceDescription = `mobile money (${phone.phoneNumber})`;
            }
            else {
                const account = await manager.findOne(bank_account_entity_1.MemberBankAccount, {
                    where: { memberBankAccountId: data.sourceId },
                });
                if (!account || account.memberId !== memberId) {
                    throw new common_1.ForbiddenException('That bank account is not linked to your account.');
                }
                sourceDescription = `bank account ending ${account.accountNumber.slice(-4)}`;
            }
            const wallet = await this.getOrCreateWallet(manager, memberId);
            if (wallet.walletStatus !== 'Active') {
                throw new common_1.BadRequestException(`Your wallet is ${wallet.walletStatus.toLowerCase()} and cannot receive a top-up.`);
            }
            wallet.balance = Number((wallet.balance + data.amount).toFixed(2));
            const savedWallet = await manager.save(health_wallet_entity_1.HealthWallet, wallet);
            const transactionReference = `CT-${Date.now().toString(36).toUpperCase()}-${memberId}`;
            const transaction = manager.create(wallet_transaction_entity_1.WalletTransaction, {
                walletId: wallet.walletId,
                transactionType: 'Top Up',
                amount: data.amount,
                transactionReference,
                remarks: `Top-up via ${sourceDescription}`,
            });
            const savedTransaction = await manager.save(wallet_transaction_entity_1.WalletTransaction, transaction);
            await this.auditLogsService.record(manager, {
                memberId,
                actionType: 'wallet.topup',
                affectedTable: 'health_wallets',
                affectedRecordId: wallet.walletId,
                newValue: {
                    amount: data.amount,
                    newBalance: savedWallet.balance,
                    source: sourceDescription,
                },
                ipAddress,
            });
            await this.notificationsService.create(manager, {
                memberId,
                notificationType: 'Contribution',
                title: 'Contribution received',
                message: `${formatTsh(data.amount)} was added to your Health Wallet via ${sourceDescription}. Reference: ${transactionReference}.`,
            });
            return {
                walletId: savedWallet.walletId,
                walletNumber: savedWallet.walletNumber,
                balance: savedWallet.balance,
                walletStatus: savedWallet.walletStatus,
                transaction: {
                    walletTransactionId: savedTransaction.walletTransactionId,
                    amount: savedTransaction.amount,
                    transactionReference: savedTransaction.transactionReference,
                    remarks: savedTransaction.remarks,
                    transactionDate: savedTransaction.transactionDate,
                },
            };
        });
    }
    async listTransactions(memberId, page, pageSize) {
        const wallet = await this.dataSource.transaction((manager) => this.getOrCreateWallet(manager, memberId));
        const [items, total] = await this.dataSource.manager.findAndCount(wallet_transaction_entity_1.WalletTransaction, {
            where: { walletId: wallet.walletId },
            order: { transactionDate: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        const sumRow = await this.dataSource
            .createQueryBuilder()
            .select('COALESCE(SUM(amount), 0)', 'sum')
            .from(wallet_transaction_entity_1.WalletTransaction, 'wt')
            .where('wt.wallet_id = :walletId', { walletId: wallet.walletId })
            .getRawOne();
        return {
            items,
            total,
            totalAmount: Number(sumRow?.sum ?? 0),
            page,
            pageSize,
        };
    }
};
exports.WalletsService = WalletsService;
exports.WalletsService = WalletsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        audit_logs_service_1.AuditLogsService,
        notifications_service_1.NotificationsService])
], WalletsService);
//# sourceMappingURL=wallets.service.js.map