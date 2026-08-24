import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLog } from './audit.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  // Simple wrapper; for transactional saving pass repository from manager directly
  async record(action: string, details?: any, actorType?: string, actorId?: number) {
    const entry = this.repo.create({ action, details, actorType, actorId });
    return this.repo.save(entry);
  }
}
