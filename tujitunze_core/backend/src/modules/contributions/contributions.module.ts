import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContributionRule } from './contribution-rule.entity';
import { ContributionTransaction } from './contribution-transaction.entity';
import { ContributionsService } from './contributions.service';
import { ContributionsController } from './contributions.controller';
import { HealthWallet } from '../wallets/health-wallet.entity';
import { WalletTransaction } from '../wallets/wallet-transaction.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ContributionRule,
      ContributionTransaction,
      HealthWallet,
      WalletTransaction,
    ]),
    AuditModule,
  ],
  controllers: [ContributionsController],
  providers: [ContributionsService],
  exports: [ContributionsService],
})
export class ContributionsModule {}
