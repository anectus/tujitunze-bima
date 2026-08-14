import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminHospitalsController } from './admin-hospitals.controller';
import { AdminHospitalsService } from './admin-hospitals.service';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { Hospital } from './entities/hospital.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([Hospital]), AuditLogsModule],
  controllers: [
    AdminController,
    AdminHospitalsController,
    AdminDashboardController,
  ],
  providers: [AdminService, AdminHospitalsService, AdminDashboardService],
})
export class AdminModule {}
