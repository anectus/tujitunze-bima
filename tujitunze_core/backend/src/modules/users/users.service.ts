import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  findOne(userId: number) {
    return this.repo.findOneBy({ userId });
  }

  async create(user: Partial<User>) {
    return this.repo.save(this.repo.create(user));
  }
}
