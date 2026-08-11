import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';

import { Member } from './entities/member.entity';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
  ) {}

  async register(data: {
    firstName: string;
    middleName: string;
    surname: string;
    phoneNumber: string;
    nidaNumber: string;
    email?: string | null;
    password: string;
  }) {
    // Check phone number
    const existingPhone =
      await this.memberRepository.findOne({
        where: {
          phoneNumber: data.phoneNumber,
        },
      });

    if (existingPhone) {
      throw new ConflictException(
        'Phone number is already registered',
      );
    }

    // Check NIDA
    const existingNida =
      await this.memberRepository.findOne({
        where: {
          nidaNumber: data.nidaNumber,
        },
      });

    if (existingNida) {
      throw new ConflictException(
        'NIDA number is already registered',
      );
    }

    // Check email only when supplied
    if (data.email) {
      const existingEmail =
        await this.memberRepository.findOne({
          where: {
            email: data.email,
          },
        });

      if (existingEmail) {
        throw new ConflictException(
          'Email is already registered',
        );
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(
      data.password,
      12,
    );

    // Create member
    const member = this.memberRepository.create({
      firstName: data.firstName,
      middleName: data.middleName,
      surname: data.surname,
      phoneNumber: data.phoneNumber,
      nidaNumber: data.nidaNumber,
      email: data.email || null,
      passwordHash,
    });

    // Save to PostgreSQL
    const savedMember =
      await this.memberRepository.save(member);

    // Never return password hash
    const {
      passwordHash: _passwordHash,
      ...safeMember
    } = savedMember;

    return safeMember;
  }
}

