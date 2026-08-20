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
exports.User = void 0;
const typeorm_1 = require("typeorm");
const phone_number_entity_1 = require("./phone-number.entity");
let User = class User {
    userId;
    firstName;
    secondName;
    surname;
    email;
    nidaNumber;
    gender;
    dateOfBirth;
    address;
    region;
    district;
    passwordHash;
    memberStatus;
    emailVerified;
    phoneVerified;
    hospitalId;
    bankId;
    telecomOperatorId;
    insuranceProviderId;
    createdAt;
    updatedAt;
    phoneNumbers;
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({
        name: 'user_id',
    }),
    __metadata("design:type", Number)
], User.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'first_name',
        type: 'varchar',
        length: 50,
    }),
    __metadata("design:type", String)
], User.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'second_name',
        type: 'varchar',
        length: 50,
        nullable: true,
    }),
    __metadata("design:type", Object)
], User.prototype, "secondName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'surname',
        type: 'varchar',
        length: 50,
    }),
    __metadata("design:type", String)
], User.prototype, "surname", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'email',
        type: 'varchar',
        length: 100,
        unique: true,
        nullable: true,
    }),
    __metadata("design:type", Object)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'nida_number',
        type: 'varchar',
        length: 23,
        unique: true,
    }),
    __metadata("design:type", String)
], User.prototype, "nidaNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'gender',
        type: 'varchar',
        length: 20,
        nullable: true,
    }),
    __metadata("design:type", Object)
], User.prototype, "gender", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'date_of_birth',
        type: 'date',
        nullable: true,
    }),
    __metadata("design:type", Object)
], User.prototype, "dateOfBirth", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'address',
        type: 'text',
        nullable: true,
    }),
    __metadata("design:type", Object)
], User.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'region',
        type: 'varchar',
        length: 100,
        nullable: true,
    }),
    __metadata("design:type", Object)
], User.prototype, "region", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'district',
        type: 'varchar',
        length: 100,
        nullable: true,
    }),
    __metadata("design:type", Object)
], User.prototype, "district", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'password_hash',
        type: 'text',
    }),
    __metadata("design:type", String)
], User.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'member_status',
        type: 'varchar',
        length: 20,
        default: 'Pending',
    }),
    __metadata("design:type", String)
], User.prototype, "memberStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'email_verified',
        type: 'boolean',
        default: false,
    }),
    __metadata("design:type", Boolean)
], User.prototype, "emailVerified", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'phone_verified',
        type: 'boolean',
        default: false,
    }),
    __metadata("design:type", Boolean)
], User.prototype, "phoneVerified", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'hospital_id',
        type: 'int',
        nullable: true,
    }),
    __metadata("design:type", Object)
], User.prototype, "hospitalId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'bank_id',
        type: 'int',
        nullable: true,
    }),
    __metadata("design:type", Object)
], User.prototype, "bankId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'telecom_operator_id',
        type: 'int',
        nullable: true,
    }),
    __metadata("design:type", Object)
], User.prototype, "telecomOperatorId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'insurance_provider_id',
        type: 'int',
        nullable: true,
    }),
    __metadata("design:type", Object)
], User.prototype, "insuranceProviderId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({
        name: 'created_at',
        type: 'timestamp',
    }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({
        name: 'updated_at',
        type: 'timestamp',
    }),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => phone_number_entity_1.PhoneNumber, (phoneNumber) => phoneNumber.user),
    __metadata("design:type", Array)
], User.prototype, "phoneNumbers", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)({ name: 'users' })
], User);
//# sourceMappingURL=user.entity.js.map