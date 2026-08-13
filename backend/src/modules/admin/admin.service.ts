import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { User } from '../members/entities/user.entity';
import { UpdateMemberStatusDto } from './dto/update-member-status.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async listMembers() {
    const users = await this.dataSource.manager.find(User, {
      order: { createdAt: 'DESC' },
    });

    return users.map(
      ({ passwordHash: _passwordHash, ...safeUser }) => safeUser,
    );
  }

  async getMember(userId: number) {
    const user = await this.dataSource.manager.findOne(User, {
      where: { userId },
      relations: { phoneNumbers: true },
    });

    if (!user) {
      throw new NotFoundException('Member not found');
    }

    const { passwordHash: _passwordHash, ...safeUser } = user;

    return safeUser;
  }

  async updateMemberStatus(
    userId: number,
    data: UpdateMemberStatusDto,
    actorId: number,
    ipAddress: string | null = null,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { userId } });

      if (!user) {
        throw new NotFoundException('Member not found');
      }

      const previousStatus = user.memberStatus;

      user.memberStatus = data.status;

      const saved = await manager.save(User, user);

      // memberId is the actor (the Admin making the change), not the
      // member being changed — that's affectedRecordId. Keeping "who did
      // this" and "who it happened to" distinct matters here since an
      // Admin acting on another member's account is exactly the case
      // this trail needs to answer questions about.
      await this.auditLogsService.record(manager, {
        memberId: actorId,
        actionType: 'member.status_change',
        affectedTable: 'users',
        affectedRecordId: userId,
        oldValue: { memberStatus: previousStatus },
        newValue: { memberStatus: saved.memberStatus },
        ipAddress,
      });

      const { passwordHash: _passwordHash, ...safeUser } = saved;

      return safeUser;
    });
  }
}
