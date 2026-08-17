import { Module } from '@nestjs/common';

import { TelecomController } from './telecom.controller';
import { TelecomService } from './telecom.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule],
  controllers: [TelecomController],
  providers: [TelecomService],
})
export class TelecomModule {}
