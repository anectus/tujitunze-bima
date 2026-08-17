import { Module } from '@nestjs/common';

import { BankController } from './bank.controller';
import { BankService } from './bank.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuditLogsModule, NotificationsModule],
  controllers: [BankController],
  providers: [BankService],
})
export class BankModule {}
