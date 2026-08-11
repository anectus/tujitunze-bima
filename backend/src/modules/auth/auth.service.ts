import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { DataSource } from 'typeorm';

import * as bcrypt from 'bcrypt';

import { User } from '../../members/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(private readonly dataSource: DataSource) {}

  async login(data: { identifier: string; password: string }) {
    if (!data.identifier?.trim()) {
      throw new BadRequestException('NIDA number or email is required');
    }

    if (!data.password) {
      throw new BadRequestException('Password is required');
    }

    const identifier = data.identifier.trim();

    // NIDA number and email are both unique, so at most one user can
    // match either — no ambiguity like there was matching on surname.
    const user = await this.dataSource.manager.findOne(User, {
      where: [{ nidaNumber: identifier }, { email: identifier.toLowerCase() }],
    });

    const passwordMatches =
      user && (await bcrypt.compare(data.password, user.passwordHash));

    if (!user || !passwordMatches) {
      throw new UnauthorizedException(
        'Invalid NIDA number, email, or password',
      );
    }

    const { passwordHash: _passwordHash, ...safeUser } = user;

    return {
      message: 'Login successful.',
      member: safeUser,
    };
  }
}
