import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelecomTransaction } from './telecom-transaction.entity';
import { BankTransaction } from './bank-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TelecomTransaction, BankTransaction])],
  controllers: [],
  providers: [],
  exports: [],
})
export class TransactionsModule {}
