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
exports.AdminHospitalsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const hospital_entity_1 = require("./entities/hospital.entity");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
let AdminHospitalsService = class AdminHospitalsService {
    dataSource;
    auditLogsService;
    constructor(dataSource, auditLogsService) {
        this.dataSource = dataSource;
        this.auditLogsService = auditLogsService;
    }
    async list() {
        return this.dataSource.manager.find(hospital_entity_1.Hospital, {
            order: { hospitalName: 'ASC' },
        });
    }
    async create(data, actorId, ipAddress = null) {
        const hospitalCode = data.hospitalCode?.trim() || null;
        const licenseNumber = data.licenseNumber?.trim() || null;
        return this.dataSource.transaction(async (manager) => {
            if (hospitalCode) {
                const existingCode = await manager.findOne(hospital_entity_1.Hospital, {
                    where: { hospitalCode },
                });
                if (existingCode) {
                    throw new common_1.ConflictException('Hospital code is already in use');
                }
            }
            if (licenseNumber) {
                const existingLicense = await manager.findOne(hospital_entity_1.Hospital, {
                    where: { licenseNumber },
                });
                if (existingLicense) {
                    throw new common_1.ConflictException('License number is already in use');
                }
            }
            const hospital = manager.create(hospital_entity_1.Hospital, {
                hospitalName: data.hospitalName.trim(),
                hospitalCode,
                location: data.location?.trim() || null,
                region: data.region?.trim() || null,
                district: data.district?.trim() || null,
                contactPhone: data.contactPhone?.trim() || null,
                licenseNumber,
                status: 'Active',
            });
            const saved = await manager.save(hospital_entity_1.Hospital, hospital);
            await this.auditLogsService.record(manager, {
                memberId: actorId,
                actionType: 'hospital.create',
                affectedTable: 'hospitals',
                affectedRecordId: saved.hospitalId,
                newValue: {
                    hospitalName: saved.hospitalName,
                    hospitalCode: saved.hospitalCode,
                },
                ipAddress,
            });
            return saved;
        });
    }
    async updateStatus(hospitalId, data, actorId, ipAddress = null) {
        return this.dataSource.transaction(async (manager) => {
            const hospital = await manager.findOne(hospital_entity_1.Hospital, {
                where: { hospitalId },
            });
            if (!hospital) {
                throw new common_1.NotFoundException('Hospital not found');
            }
            const previousStatus = hospital.status;
            hospital.status = data.status;
            const saved = await manager.save(hospital_entity_1.Hospital, hospital);
            await this.auditLogsService.record(manager, {
                memberId: actorId,
                actionType: 'hospital.status_change',
                affectedTable: 'hospitals',
                affectedRecordId: hospitalId,
                oldValue: { status: previousStatus },
                newValue: { status: saved.status },
                ipAddress,
            });
            return saved;
        });
    }
};
exports.AdminHospitalsService = AdminHospitalsService;
exports.AdminHospitalsService = AdminHospitalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        audit_logs_service_1.AuditLogsService])
], AdminHospitalsService);
//# sourceMappingURL=admin-hospitals.service.js.map