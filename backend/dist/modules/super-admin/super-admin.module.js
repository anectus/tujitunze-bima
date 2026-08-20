"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperAdminModule = void 0;
const common_1 = require("@nestjs/common");
const super_admin_controller_1 = require("./super-admin.controller");
const super_admin_service_1 = require("./super-admin.service");
const super_admin_roles_controller_1 = require("./super-admin-roles.controller");
const super_admin_roles_service_1 = require("./super-admin-roles.service");
const audit_logs_module_1 = require("../audit-logs/audit-logs.module");
let SuperAdminModule = class SuperAdminModule {
};
exports.SuperAdminModule = SuperAdminModule;
exports.SuperAdminModule = SuperAdminModule = __decorate([
    (0, common_1.Module)({
        imports: [audit_logs_module_1.AuditLogsModule],
        controllers: [super_admin_controller_1.SuperAdminController, super_admin_roles_controller_1.SuperAdminRolesController],
        providers: [super_admin_service_1.SuperAdminService, super_admin_roles_service_1.SuperAdminRolesService],
    })
], SuperAdminModule);
//# sourceMappingURL=super-admin.module.js.map