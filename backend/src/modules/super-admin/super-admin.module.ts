import { Module } from '@nestjs/common';

import { SuperAdminController } from './super-admin.controller';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminRolesController } from './super-admin-roles.controller';
import { SuperAdminRolesService } from './super-admin-roles.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule],
  controllers: [SuperAdminController, SuperAdminRolesController],
  providers: [SuperAdminService, SuperAdminRolesService],
})
export class SuperAdminModule {}
