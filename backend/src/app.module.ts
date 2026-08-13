import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { databaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { ContactModule } from './modules/contact/contact.module';
import { MembersModule } from './modules/members/members.module';
import { WalletsModule } from './modules/wallets/wallets.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      useFactory: databaseConfig,
    }),

    MembersModule,

    AuthModule,

    AdminModule,

    AuditLogsModule,

    ContactModule,

    WalletsModule,
  ],
})
export class AppModule {}
