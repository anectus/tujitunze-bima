import { Module } from '@nestjs/common';

import { HospitalController } from './hospital.controller';
import { HospitalService } from './hospital.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuditLogsModule, NotificationsModule],
  controllers: [HospitalController],
  providers: [HospitalService],
})
export class HospitalModule {}
