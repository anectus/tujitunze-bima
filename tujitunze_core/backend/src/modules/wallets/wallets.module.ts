import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthWallet } from './health-wallet.entity';
import { WalletTransaction } from './wallet-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HealthWallet, WalletTransaction])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class WalletsModule {}
