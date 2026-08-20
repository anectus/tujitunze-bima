"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const typeorm_1 = require("@nestjs/typeorm");
const database_config_1 = require("./config/database.config");
const auth_module_1 = require("./modules/auth/auth.module");
const admin_module_1 = require("./modules/admin/admin.module");
const audit_logs_module_1 = require("./modules/audit-logs/audit-logs.module");
const contact_module_1 = require("./modules/contact/contact.module");
const members_module_1 = require("./modules/members/members.module");
const wallets_module_1 = require("./modules/wallets/wallets.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const hospital_module_1 = require("./modules/hospital/hospital.module");
const bank_module_1 = require("./modules/bank/bank.module");
const telecom_module_1 = require("./modules/telecom/telecom.module");
const insurance_module_1 = require("./modules/insurance/insurance.module");
const super_admin_module_1 = require("./modules/super-admin/super-admin.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
            typeorm_1.TypeOrmModule.forRootAsync({
                useFactory: database_config_1.databaseConfig,
            }),
            members_module_1.MembersModule,
            auth_module_1.AuthModule,
            admin_module_1.AdminModule,
            audit_logs_module_1.AuditLogsModule,
            contact_module_1.ContactModule,
            wallets_module_1.WalletsModule,
            notifications_module_1.NotificationsModule,
            hospital_module_1.HospitalModule,
            bank_module_1.BankModule,
            telecom_module_1.TelecomModule,
            insurance_module_1.InsuranceModule,
            super_admin_module_1.SuperAdminModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map