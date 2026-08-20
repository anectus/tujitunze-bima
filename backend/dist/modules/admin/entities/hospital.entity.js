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
exports.Hospital = void 0;
const typeorm_1 = require("typeorm");
let Hospital = class Hospital {
    hospitalId;
    hospitalName;
    hospitalCode;
    location;
    region;
    district;
    contactPhone;
    licenseNumber;
    status;
    createdAt;
};
exports.Hospital = Hospital;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({
        name: 'hospital_id',
    }),
    __metadata("design:type", Number)
], Hospital.prototype, "hospitalId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'hospital_name',
        type: 'varchar',
        length: 150,
    }),
    __metadata("design:type", String)
], Hospital.prototype, "hospitalName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'hospital_code',
        type: 'varchar',
        length: 50,
        nullable: true,
        unique: true,
    }),
    __metadata("design:type", Object)
], Hospital.prototype, "hospitalCode", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'location',
        type: 'text',
        nullable: true,
    }),
    __metadata("design:type", Object)
], Hospital.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'region',
        type: 'varchar',
        length: 100,
        nullable: true,
    }),
    __metadata("design:type", Object)
], Hospital.prototype, "region", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'district',
        type: 'varchar',
        length: 100,
        nullable: true,
    }),
    __metadata("design:type", Object)
], Hospital.prototype, "district", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'contact_phone',
        type: 'varchar',
        length: 20,
        nullable: true,
    }),
    __metadata("design:type", Object)
], Hospital.prototype, "contactPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'license_number',
        type: 'varchar',
        length: 100,
        nullable: true,
        unique: true,
    }),
    __metadata("design:type", Object)
], Hospital.prototype, "licenseNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'status',
        type: 'varchar',
        length: 30,
        default: 'Active',
    }),
    __metadata("design:type", String)
], Hospital.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({
        name: 'created_at',
        type: 'timestamp',
    }),
    __metadata("design:type", Date)
], Hospital.prototype, "createdAt", void 0);
exports.Hospital = Hospital = __decorate([
    (0, typeorm_1.Entity)({ name: 'hospitals' })
], Hospital);
//# sourceMappingURL=hospital.entity.js.map