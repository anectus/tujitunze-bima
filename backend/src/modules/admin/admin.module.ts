import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminHospitalsController } from './admin-hospitals.controller';
import { AdminHospitalsService } from './admin-hospitals.service';
import { Hospital } from './entities/hospital.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([Hospital]), AuditLogsModule],
  controllers: [AdminController, AdminHospitalsController],
  providers: [AdminService, AdminHospitalsService],
})
export class AdminModule {}
