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
exports.AdminHospitalsController = void 0;
const common_1 = require("@nestjs/common");
const admin_hospitals_service_1 = require("./admin-hospitals.service");
const create_hospital_dto_1 = require("./dto/create-hospital.dto");
const update_hospital_status_dto_1 = require("./dto/update-hospital-status.dto");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
let AdminHospitalsController = class AdminHospitalsController {
    adminHospitalsService;
    constructor(adminHospitalsService) {
        this.adminHospitalsService = adminHospitalsService;
    }
    async list() {
        return this.adminHospitalsService.list();
    }
    async create(body, admin, request) {
        return this.adminHospitalsService.create(body, admin.userId, request.ip);
    }
    async updateStatus(id, body, admin, request) {
        return this.adminHospitalsService.updateStatus(id, body, admin.userId, request.ip);
    }
};
exports.AdminHospitalsController = AdminHospitalsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminHospitalsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_hospital_dto_1.CreateHospitalDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminHospitalsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_hospital_status_dto_1.UpdateHospitalStatusDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminHospitalsController.prototype, "updateStatus", null);
exports.AdminHospitalsController = AdminHospitalsController = __decorate([
    (0, common_1.Controller)('admin/hospitals'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('Admin'),
    __metadata("design:paramtypes", [admin_hospitals_service_1.AdminHospitalsService])
], AdminHospitalsController);
//# sourceMappingURL=admin-hospitals.controller.js.map