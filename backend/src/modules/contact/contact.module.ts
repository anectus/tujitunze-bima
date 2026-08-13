import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ContactMessage } from './entities/contact-message.entity';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { AuthModule } from '../auth/auth.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContactMessage]),
    AuthModule,
    AuditLogsModule,
  ],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
