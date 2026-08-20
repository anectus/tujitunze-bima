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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const bank_service_1 = require("./bank.service");
const update_bank_contact_dto_1 = require("./dto/update-bank-contact.dto");
const configure_webhook_dto_1 = require("./dto/configure-webhook.dto");
const upload_reconciliation_dto_1 = require("./dto/upload-reconciliation.dto");
const fund_transfer_dto_1 = require("./dto/fund-transfer.dto");
const create_settlement_dto_1 = require("./dto/create-settlement.dto");
const update_transaction_status_dto_1 = require("./dto/update-transaction-status.dto");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
let BankController = class BankController {
    bankService;
    constructor(bankService) {
        this.bankService = bankService;
    }
    async getDashboard(user) {
        return this.bankService.getDashboard(user.userId);
    }
    async getProfile(user) {
        return this.bankService.getBankProfile(user.userId);
    }
    async updateContact(user, body, request) {
        return this.bankService.updateBankContact(user.userId, body, request.ip);
    }
    async regenerateApiKey(user, request) {
        return this.bankService.regenerateApiKey(user.userId, request.ip);
    }
    async configureWebhook(user, body, request) {
        return this.bankService.configureWebhook(user.userId, body, request.ip);
    }
    async testConnection(user) {
        return this.bankService.testConnection(user.userId);
    }
    async listBranches(user) {
        return this.bankService.listBranches(user.userId);
    }
    async listFundAccounts(user) {
        return this.bankService.listFundAccounts(user.userId);
    }
    async createFundTransfer(user, type, body, request) {
        return this.bankService.createFundTransfer(user.userId, type, body, request.ip);
    }
    async listFundTransfers(user, type, page, pageSize) {
        return this.bankService.listFundTransfers(user.userId, type, page, pageSize);
    }
    async listTransactions(user, type, status, page, pageSize) {
        return this.bankService.listTransactions(user.userId, type, status, page, pageSize);
    }
    async exportTransactions(user, type, status) {
        return this.bankService.exportTransactionsCsv(user.userId, type, status);
    }
    async updateTransactionStatus(user, id, body, request) {
        return this.bankService.updateTransactionStatus(user.userId, id, body, request.ip);
    }
    async createSettlement(user, body, request) {
        return this.bankService.createSettlement(user.userId, body, request.ip);
    }
    async completeSettlement(user, id, request) {
        return this.bankService.completeSettlement(user.userId, id, request.ip);
    }
    async listSettlements(user, status, counterpartyType) {
        return this.bankService.listSettlements(user.userId, status, counterpartyType);
    }
    async createReconciliationRun(user, body) {
        return this.bankService.createReconciliationRun(user.userId, body);
    }
    async listReconciliationRuns(user) {
        return this.bankService.listReconciliationRuns(user.userId);
    }
    async getReconciliationRun(user, id) {
        return this.bankService.getReconciliationRun(user.userId, id);
    }
    async getReports(user, period = 'daily') {
        return this.bankService.getReports(user.userId, period);
    }
    async listActivityLogs(user) {
        return this.bankService.listActivityLogs(user.userId);
    }
    async listApiAccessLogs(user) {
        return this.bankService.listApiAccessLogs(user.userId);
    }
};
exports.BankController = BankController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)('profile/contact'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_bank_contact_dto_1.UpdateBankContactDto, Object]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "updateContact", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60_000 } }),
    (0, common_1.Post)('profile/api-key/regenerate'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "regenerateApiKey", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60_000 } }),
    (0, common_1.Post)('profile/webhook'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, configure_webhook_dto_1.ConfigureWebhookDto, Object]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "configureWebhook", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60_000 } }),
    (0, common_1.Post)('profile/connection-test'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "testConnection", null);
__decorate([
    (0, common_1.Get)('branches'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "listBranches", null);
__decorate([
    (0, common_1.Get)('fund-accounts'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "listFundAccounts", null);
__decorate([
    (0, common_1.Post)('fund-accounts/:type/transfer'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('type')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, fund_transfer_dto_1.FundTransferDto, Object]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "createFundTransfer", null);
__decorate([
    (0, common_1.Get)('fund-accounts/:type/transfers'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('type')),
    __param(2, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(3, (0, common_1.Query)('pageSize', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number, Number]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "listFundTransfers", null);
__decorate([
    (0, common_1.Get)('transactions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(4, (0, common_1.Query)('pageSize', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Number, Number]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "listTransactions", null);
__decorate([
    (0, common_1.Get)('transactions/export'),
    (0, common_1.Header)('Content-Type', 'text/csv'),
    (0, common_1.Header)('Content-Disposition', 'attachment; filename="transactions.csv"'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "exportTransactions", null);
__decorate([
    (0, common_1.Patch)('transactions/:id/status'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, update_transaction_status_dto_1.UpdateTransactionStatusDto, Object]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "updateTransactionStatus", null);
__decorate([
    (0, common_1.Post)('settlements'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_settlement_dto_1.CreateSettlementDto, Object]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "createSettlement", null);
__decorate([
    (0, common_1.Patch)('settlements/:id/complete'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "completeSettlement", null);
__decorate([
    (0, common_1.Get)('settlements'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('counterpartyType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "listSettlements", null);
__decorate([
    (0, common_1.Post)('reconciliation/runs'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, upload_reconciliation_dto_1.UploadReconciliationDto]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "createReconciliationRun", null);
__decorate([
    (0, common_1.Get)('reconciliation/runs'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "listReconciliationRuns", null);
__decorate([
    (0, common_1.Get)('reconciliation/runs/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "getReconciliationRun", null);
__decorate([
    (0, common_1.Get)('reports'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "getReports", null);
__decorate([
    (0, common_1.Get)('activity-logs'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "listActivityLogs", null);
__decorate([
    (0, common_1.Get)('api-access-logs'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "listApiAccessLogs", null);
exports.BankController = BankController = __decorate([
    (0, common_1.Controller)('bank'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('Bank'),
    __metadata("design:paramtypes", [bank_service_1.BankService])
], BankController);
//# sourceMappingURL=bank.controller.js.map