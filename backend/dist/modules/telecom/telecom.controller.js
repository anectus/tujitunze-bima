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
exports.TelecomController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const telecom_service_1 = require("./telecom.service");
const update_operator_contact_dto_1 = require("./dto/update-operator-contact.dto");
const configure_webhook_dto_1 = require("./dto/configure-webhook.dto");
const upload_reconciliation_dto_1 = require("./dto/upload-reconciliation.dto");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
let TelecomController = class TelecomController {
    telecomService;
    constructor(telecomService) {
        this.telecomService = telecomService;
    }
    async getDashboard(user) {
        return this.telecomService.getDashboard(user.userId);
    }
    async getOperator(user) {
        return this.telecomService.getOperatorProfile(user.userId);
    }
    async updateOperatorContact(user, body, request) {
        return this.telecomService.updateOperatorContact(user.userId, body, request.ip);
    }
    async regenerateApiKey(user, request) {
        return this.telecomService.regenerateApiKey(user.userId, request.ip);
    }
    async configureWebhook(user, body, request) {
        return this.telecomService.configureWebhook(user.userId, body, request.ip);
    }
    async testConnection(user) {
        return this.telecomService.testConnection(user.userId);
    }
    async listMembers(user, page, pageSize) {
        return this.telecomService.listMembers(user.userId, page, pageSize);
    }
    async listContributions(user, status, page, pageSize) {
        return this.telecomService.listContributions(user.userId, status, page, pageSize);
    }
    async exportContributions(user, status) {
        return this.telecomService.exportContributionsCsv(user.userId, status);
    }
    async listContributionRules() {
        return this.telecomService.listContributionRules();
    }
    async createReconciliationRun(user, body) {
        return this.telecomService.createReconciliationRun(user.userId, body);
    }
    async listReconciliationRuns(user) {
        return this.telecomService.listReconciliationRuns(user.userId);
    }
    async getReconciliationRun(user, id) {
        return this.telecomService.getReconciliationRun(user.userId, id);
    }
    async getReports(user, period = 'daily') {
        return this.telecomService.getReports(user.userId, period);
    }
    async listActivityLogs(user) {
        return this.telecomService.listActivityLogs(user.userId);
    }
    async listApiAccessLogs(user) {
        return this.telecomService.listApiAccessLogs(user.userId);
    }
};
exports.TelecomController = TelecomController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelecomController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('operator'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelecomController.prototype, "getOperator", null);
__decorate([
    (0, common_1.Patch)('operator/contact'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_operator_contact_dto_1.UpdateOperatorContactDto, Object]),
    __metadata("design:returntype", Promise)
], TelecomController.prototype, "updateOperatorContact", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60_000 } }),
    (0, common_1.Post)('operator/api-key/regenerate'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TelecomController.prototype, "regenerateApiKey", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60_000 } }),
    (0, common_1.Post)('operator/webhook'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, configure_webhook_dto_1.ConfigureWebhookDto, Object]),
    __metadata("design:returntype", Promise)
], TelecomController.prototype, "configureWebhook", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60_000 } }),
    (0, common_1.Post)('operator/connection-test'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelecomController.prototype, "testConnection", null);
__decorate([
    (0, common_1.Get)('members'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('pageSize', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], TelecomController.prototype, "listMembers", null);
__decorate([
    (0, common_1.Get)('contributions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(3, (0, common_1.Query)('pageSize', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Number, Number]),
    __metadata("design:returntype", Promise)
], TelecomController.prototype, "listContributions", null);
__decorate([
    (0, common_1.Get)('contributions/export'),
    (0, common_1.Header)('Content-Type', 'text/csv'),
    (0, common_1.Header)('Content-Disposition', 'attachment; filename="contributions.csv"'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TelecomController.prototype, "exportContributions", null);
__decorate([
    (0, common_1.Get)('contribution-rules'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TelecomController.prototype, "listContributionRules", null);
__decorate([
    (0, common_1.Post)('reconciliation/runs'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, upload_reconciliation_dto_1.UploadReconciliationDto]),
    __metadata("design:returntype", Promise)
], TelecomController.prototype, "createReconciliationRun", null);
__decorate([
    (0, common_1.Get)('reconciliation/runs'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelecomController.prototype, "listReconciliationRuns", null);
__decorate([
    (0, common_1.Get)('reconciliation/runs/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], TelecomController.prototype, "getReconciliationRun", null);
__decorate([
    (0, common_1.Get)('reports'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TelecomController.prototype, "getReports", null);
__decorate([
    (0, common_1.Get)('activity-logs'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelecomController.prototype, "listActivityLogs", null);
__decorate([
    (0, common_1.Get)('api-access-logs'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelecomController.prototype, "listApiAccessLogs", null);
exports.TelecomController = TelecomController = __decorate([
    (0, common_1.Controller)('telecom'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('Telecom'),
    __metadata("design:paramtypes", [telecom_service_1.TelecomService])
], TelecomController);
//# sourceMappingURL=telecom.controller.js.map