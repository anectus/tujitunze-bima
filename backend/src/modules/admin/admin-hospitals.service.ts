import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { Hospital } from './entities/hospital.entity';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalStatusDto } from './dto/update-hospital-status.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class AdminHospitalsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async list() {
    return this.dataSource.manager.find(Hospital, {
      order: { hospitalName: 'ASC' },
    });
  }

  async create(
    data: CreateHospitalDto,
    actorId: number,
    ipAddress: string | null = null,
  ) {
    const hospitalCode = data.hospitalCode?.trim() || null;
    const licenseNumber = data.licenseNumber?.trim() || null;

    return this.dataSource.transaction(async (manager) => {
      if (hospitalCode) {
        const existingCode = await manager.findOne(Hospital, {
          where: { hospitalCode },
        });

        if (existingCode) {
          throw new ConflictException('Hospital code is already in use');
        }
      }

      if (licenseNumber) {
        const existingLicense = await manager.findOne(Hospital, {
          where: { licenseNumber },
        });

        if (existingLicense) {
          throw new ConflictException('License number is already in use');
        }
      }

      const hospital = manager.create(Hospital, {
        hospitalName: data.hospitalName.trim(),
        hospitalCode,
        location: data.location?.trim() || null,
        region: data.region?.trim() || null,
        district: data.district?.trim() || null,
        contactPhone: data.contactPhone?.trim() || null,
        licenseNumber,
        status: 'Active',
      });

      const saved = await manager.save(Hospital, hospital);

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

  async updateStatus(
    hospitalId: number,
    data: UpdateHospitalStatusDto,
    actorId: number,
    ipAddress: string | null = null,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const hospital = await manager.findOne(Hospital, {
        where: { hospitalId },
      });

      if (!hospital) {
        throw new NotFoundException('Hospital not found');
      }

      const previousStatus = hospital.status;

      hospital.status = data.status;

      const saved = await manager.save(Hospital, hospital);

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
}
