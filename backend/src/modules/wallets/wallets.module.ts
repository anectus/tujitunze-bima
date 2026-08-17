import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HealthWallet } from './entities/health-wallet.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HealthWallet, WalletTransaction]),
    AuditLogsModule,
    NotificationsModule,
  ],
  controllers: [WalletsController],
  providers: [WalletsService],
})
export class WalletsModule {}
