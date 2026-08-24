import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { ContributionsModule } from './modules/contributions/contributions.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { ReconciliationModule } from './modules/reconciliation/reconciliation.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tujitunze_core',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
      logging: false,
    }),
    UsersModule,
    WalletsModule,
    ContributionsModule,
    TransactionsModule,
    ReconciliationModule,
    AuditModule,
  ],
})
export class AppModule {}
