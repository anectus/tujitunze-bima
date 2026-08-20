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
exports.SuperAdminRolesController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const super_admin_roles_service_1 = require("./super-admin-roles.service");
const create_role_dto_1 = require("./dto/create-role.dto");
const update_role_dto_1 = require("./dto/update-role.dto");
const update_role_permissions_dto_1 = require("./dto/update-role-permissions.dto");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
let SuperAdminRolesController = class SuperAdminRolesController {
    superAdminRolesService;
    constructor(superAdminRolesService) {
        this.superAdminRolesService = superAdminRolesService;
    }
    async listRoles() {
        return this.superAdminRolesService.listRoles();
    }
    async createRole(body, actor, request) {
        return this.superAdminRolesService.createRole(body, actor.userId, request.ip);
    }
    async updateRole(id, body, actor, request) {
        return this.superAdminRolesService.updateRole(id, body, actor.userId, request.ip);
    }
    async deleteRole(id, actor, request) {
        return this.superAdminRolesService.deleteRole(id, actor.userId, request.ip);
    }
    async listPermissions() {
        return this.superAdminRolesService.listPermissions();
    }
    async updateRolePermissions(id, body, actor, request) {
        return this.superAdminRolesService.updateRolePermissions(id, body, actor.userId, request.ip);
    }
};
exports.SuperAdminRolesController = SuperAdminRolesController;
__decorate([
    (0, common_1.Get)('roles'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SuperAdminRolesController.prototype, "listRoles", null);
__decorate([
    (0, common_1.Post)('roles'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_role_dto_1.CreateRoleDto, Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminRolesController.prototype, "createRole", null);
__decorate([
    (0, common_1.Patch)('roles/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_role_dto_1.UpdateRoleDto, Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminRolesController.prototype, "updateRole", null);
__decorate([
    (0, common_1.Delete)('roles/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminRolesController.prototype, "deleteRole", null);
__decorate([
    (0, common_1.Get)('permissions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SuperAdminRolesController.prototype, "listPermissions", null);
__decorate([
    (0, common_1.Put)('roles/:id/permissions'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_role_permissions_dto_1.UpdateRolePermissionsDto, Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminRolesController.prototype, "updateRolePermissions", null);
exports.SuperAdminRolesController = SuperAdminRolesController = __decorate([
    (0, throttler_1.Throttle)({ default: { limit: 30, ttl: 60_000 } }),
    (0, common_1.Controller)('super-admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('Super-admin'),
    __metadata("design:paramtypes", [super_admin_roles_service_1.SuperAdminRolesService])
], SuperAdminRolesController);
//# sourceMappingURL=super-admin-roles.controller.js.map