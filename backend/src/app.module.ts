import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { databaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { ContactModule } from './modules/contact/contact.module';
import { MembersModule } from './modules/members/members.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { HospitalModule } from './modules/hospital/hospital.module';
import { BankModule } from './modules/bank/bank.module';
import { TelecomModule } from './modules/telecom/telecom.module';
import { InsuranceModule } from './modules/insurance/insurance.module';
import { SuperAdminModule } from './modules/super-admin/super-admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Applies to every route unless overridden by @Throttle(...) on a
    // specific handler/controller (see auth/members/super-admin
    // controllers for the tighter limits on brute-force-sensitive
    // endpoints) — this default is just a generous background guard.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

    TypeOrmModule.forRootAsync({
      useFactory: databaseConfig,
    }),

    MembersModule,

    AuthModule,

    AdminModule,

    AuditLogsModule,

    ContactModule,

    WalletsModule,

    HospitalModule,

    BankModule,

    TelecomModule,

    InsuranceModule,

    SuperAdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
