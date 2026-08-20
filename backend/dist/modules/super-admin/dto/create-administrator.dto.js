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
exports.CreateAdministratorDto = exports.TENANT_SCOPED_ROLES = exports.STAFF_ROLES = void 0;
const class_validator_1 = require("class-validator");
exports.STAFF_ROLES = [
    'Admin',
    'Hospital',
    'Bank',
    'Telecom',
    'Insurance',
    'Super-admin',
];
exports.TENANT_SCOPED_ROLES = [
    'Hospital',
    'Bank',
    'Telecom',
    'Insurance',
];
class CreateAdministratorDto {
    firstName;
    secondName;
    surname;
    email;
    nidaNumber;
    password;
    role;
    tenantId;
}
exports.CreateAdministratorDto = CreateAdministratorDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateAdministratorDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateAdministratorDto.prototype, "secondName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateAdministratorDto.prototype, "surname", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateAdministratorDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{8}-\d{5}-\d{5}-\d{2}$/, {
        message: 'NIDA number must be in the format 00000000-00000-00000-00',
    }),
    __metadata("design:type", String)
], CreateAdministratorDto.prototype, "nidaNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], CreateAdministratorDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsIn)(exports.STAFF_ROLES),
    __metadata("design:type", String)
], CreateAdministratorDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateAdministratorDto.prototype, "tenantId", void 0);
//# sourceMappingURL=create-administrator.dto.js.map