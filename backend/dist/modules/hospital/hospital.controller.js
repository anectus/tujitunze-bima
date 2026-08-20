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
exports.HospitalController = void 0;
const common_1 = require("@nestjs/common");
const hospital_service_1 = require("./hospital.service");
const update_hospital_profile_dto_1 = require("./dto/update-hospital-profile.dto");
const verify_member_dto_1 = require("./dto/verify-member.dto");
const create_treatment_dto_1 = require("./dto/create-treatment.dto");
const update_treatment_status_dto_1 = require("./dto/update-treatment-status.dto");
const create_claim_dto_1 = require("./dto/create-claim.dto");
const update_claim_status_dto_1 = require("./dto/update-claim-status.dto");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
let HospitalController = class HospitalController {
    hospitalService;
    constructor(hospitalService) {
        this.hospitalService = hospitalService;
    }
    async getDashboard(user) {
        return this.hospitalService.getDashboard(user.userId);
    }
    async getProfile(user) {
        return this.hospitalService.getHospitalProfile(user.userId);
    }
    async updateProfile(user, body, request) {
        return this.hospitalService.updateHospitalProfile(user.userId, body, request.ip);
    }
    async listStaff(user) {
        return this.hospitalService.listAuthorizedUsers(user.userId);
    }
    async verifyMember(user, body, request) {
        return this.hospitalService.verifyMember(user.userId, body, request.ip);
    }
    async listVerifications(user, page, pageSize) {
        return this.hospitalService.listVerifications(user.userId, page, pageSize);
    }
    async listEligibleMembers(user) {
        return this.hospitalService.listEligibleMembers(user.userId);
    }
    async createTreatment(user, body, request) {
        return this.hospitalService.createTreatment(user.userId, body, request.ip);
    }
    async listTreatments(user, status, page, pageSize) {
        return this.hospitalService.listTreatments(user.userId, status, page, pageSize);
    }
    async updateTreatmentStatus(user, id, body, request) {
        return this.hospitalService.updateTreatmentStatus(user.userId, id, body, request.ip);
    }
    async createClaim(user, body, request) {
        return this.hospitalService.createClaim(user.userId, body, request.ip);
    }
    async submitDraftClaim(user, id, request) {
        return this.hospitalService.submitDraftClaim(user.userId, id, request.ip);
    }
    async listClaims(user, status, page, pageSize) {
        return this.hospitalService.listClaims(user.userId, status, page, pageSize);
    }
    async updateClaimStatus(user, id, body, request) {
        return this.hospitalService.updateClaimStatus(user.userId, id, body, request.ip);
    }
    async listPayments(user, status) {
        return this.hospitalService.listPayments(user.userId, status);
    }
    async getReports(user, period = 'daily') {
        return this.hospitalService.getReports(user.userId, period);
    }
    async listActivityLogs(user) {
        return this.hospitalService.listActivityLogs(user.userId);
    }
};
exports.HospitalController = HospitalController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HospitalController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HospitalController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)('profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_hospital_profile_dto_1.UpdateHospitalProfileDto, Object]),
    __metadata("design:returntype", Promise)
], HospitalController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)('staff'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HospitalController.prototype, "listStaff", null);
__decorate([
    (0, common_1.Post)('verifications'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, verify_member_dto_1.VerifyMemberDto, Object]),
    __metadata("design:returntype", Promise)
], HospitalController.prototype, "verifyMember", null);
__decorate([
    (0, common_1.Get)('verifications'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('pageSize', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], HospitalController.prototype, "listVerifications", null);
__decorate([
    (0, common_1.Get)('eligible-members'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HospitalController.prototype, "listEligibleMembers", null);
__decorate([
    (0, common_1.Post)('treatments'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_treatment_dto_1.CreateTreatmentDto, Object]),
    __metadata("design:returntype", Promise)
], HospitalController.prototype, "createTreatment", null);
__decorate([
    (0, common_1.Get)('treatments'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(3, (0, common_1.Query)('pageSize', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Number, Number]),
    __metadata("design:returntype", Promise)
], HospitalController.prototype, "listTreatments", null);
__decorate([
    (0, common_1.Patch)('treatments/:id/status'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, update_treatment_status_dto_1.UpdateTreatmentStatusDto, Object]),
    __metadata("design:returntype", Promise)
], HospitalController.prototype, "updateTreatmentStatus", null);
__decorate([
    (0, common_1.Post)('claims'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_claim_dto_1.CreateClaimDto, Object]),
    __metadata("design:returntype", Promise)
], HospitalController.prototype, "createClaim", null);
__decorate([
    (0, common_1.Patch)('claims/:id/submit'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", Promise)
], HospitalController.prototype, "submitDraftClaim", null);
__decorate([
    (0, common_1.Get)('claims'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(3, (0, common_1.Query)('pageSize', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Number, Number]),
    __metadata("design:returntype", Promise)
], HospitalController.prototype, "listClaims", null);
__decorate([
    (0, common_1.Patch)('claims/:id/status'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, update_claim_status_dto_1.UpdateClaimStatusDto, Object]),
    __metadata("design:returntype", Promise)
], HospitalController.prototype, "updateClaimStatus", null);
__decorate([
    (0, common_1.Get)('payments'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], HospitalController.prototype, "listPayments", null);
__decorate([
    (0, common_1.Get)('reports'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], HospitalController.prototype, "getReports", null);
__decorate([
    (0, common_1.Get)('activity-logs'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HospitalController.prototype, "listActivityLogs", null);
exports.HospitalController = HospitalController = __decorate([
    (0, common_1.Controller)('hospital'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('Hospital'),
    __metadata("design:paramtypes", [hospital_service_1.HospitalService])
], HospitalController);
//# sourceMappingURL=hospital.controller.js.map