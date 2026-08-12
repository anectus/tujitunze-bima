import { Injectable, UnauthorizedException } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';

import * as bcrypt from 'bcrypt';

import { User } from '../../members/entities/user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
  ) {}

  async login(data: LoginDto) {
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

    const roleRows = await this.dataSource.manager.query<
      { role_name: string }[]
    >(
      `
      SELECT r.role_name
      FROM member_roles mr
      INNER JOIN roles r ON r.role_id = mr.role_id
      WHERE mr.member_id = $1
      `,
      [user.userId],
    );

    const roles = roleRows.map((row) => row.role_name);

    const accessToken = await this.jwtService.signAsync({
      sub: user.userId,
      roles,
    });

    const { passwordHash: _passwordHash, ...safeUser } = user;

    return {
      message: 'Login successful.',
      accessToken,
      member: { ...safeUser, roles },
    };
  }
}
