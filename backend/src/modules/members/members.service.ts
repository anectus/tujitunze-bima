import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { DataSource, EntityManager } from 'typeorm';

import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { PhoneNumber } from './entities/phone-number.entity';
import { MemberBankAccount } from './entities/bank-account.entity';
import { RegisterDto } from './dto/register.dto';
import { AddPhoneNumberDto } from './dto/add-phone-number.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AddBankAccountDto } from './dto/add-bank-account.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

interface TelecomOperator {
  operator_id: number;
  operator_name: string;
}

interface Bank {
  bank_id: number;
  bank_name: string;
}

@Injectable()
export class MembersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  // =====================================================
  // Normalize a Tanzanian phone number.
  //
  // Accepted: 0712345678 / 255712345678 / +255712345678
  // Stored:   0712345678
  // =====================================================

  private normalizeTanzanianPhone(raw: string): string {
    let phoneNumber = raw.trim().replace(/\s+/g, '');

    if (phoneNumber.startsWith('+255')) {
      phoneNumber = '0' + phoneNumber.substring(4);
    } else if (phoneNumber.startsWith('255')) {
      phoneNumber = '0' + phoneNumber.substring(3);
    }

    if (!/^0[67]\d{8}$/.test(phoneNumber)) {
      throw new BadRequestException('Invalid Tanzanian mobile phone number');
    }

    return phoneNumber;
  }

  private async findActiveOperatorForPrefix(
    manager: EntityManager,
    prefix: string,
  ): Promise<TelecomOperator> {
    const operatorResult = await manager.query<TelecomOperator[]>(
      `
          SELECT
            o.operator_id,
            o.operator_name
          FROM telecom_operators o
          INNER JOIN telecom_operator_prefixes p
            ON p.operator_id = o.operator_id
          WHERE p.prefix = $1
            AND p.status = 'Active'
            AND o.status = 'Active'
          LIMIT 1
          `,
      [prefix],
    );

    if (!operatorResult || operatorResult.length === 0) {
      throw new BadRequestException(
        `Telecom operator for prefix ${prefix} is not supported`,
      );
    }

    return operatorResult[0];
  }

  private async findActiveBank(
    manager: EntityManager,
    bankId: number,
  ): Promise<Bank> {
    const bankResult = await manager.query<Bank[]>(
      `
      SELECT bank_id, bank_name
      FROM banks
      WHERE bank_id = $1
        AND status = 'Active'
      LIMIT 1
      `,
      [bankId],
    );

    if (!bankResult || bankResult.length === 0) {
      throw new BadRequestException('Selected bank is not supported');
    }

    return bankResult[0];
  }

  private async findOperatorById(
    manager: EntityManager,
    operatorId: number,
  ): Promise<TelecomOperator> {
    const operatorResult = await manager.query<TelecomOperator[]>(
      `
      SELECT operator_id, operator_name
      FROM telecom_operators
      WHERE operator_id = $1
      LIMIT 1
      `,
      [operatorId],
    );

    if (!operatorResult || operatorResult.length === 0) {
      throw new BadRequestException('Selected network is not supported');
    }

    return operatorResult[0];
  }

  async register(data: RegisterDto) {
    // =====================================================
    // 1. Field presence/shape is enforced by RegisterDto via the
    //    global ValidationPipe — only business-rule validation
    //    (phone format, uniqueness) happens here.
    // =====================================================

    // =====================================================
    // 2. Clean input
    // =====================================================

    const firstName = data.firstName.trim();

    const secondName = data.secondName?.trim() || null;

    const surname = data.surname.trim();

    const email = data.email?.trim().toLowerCase() || null;

    const nidaNumber = data.nidaNumber.trim();

    const phoneNumber = this.normalizeTanzanianPhone(data.phoneNumber);

    // =====================================================
    // 4. Database transaction
    // =====================================================

    return this.dataSource.transaction(async (manager) => {
      // =================================================
      // 5. Check existing phone
      // =================================================

      const existingPhone = await manager.findOne(PhoneNumber, {
        where: { phoneNumber },
      });

      if (existingPhone) {
        throw new ConflictException('Phone number is already registered');
      }

      // =================================================
      // 6. Check existing NIDA
      // =================================================

      const existingNida = await manager.findOne(User, {
        where: {
          nidaNumber,
        },
      });

      if (existingNida) {
        throw new ConflictException('NIDA number is already registered');
      }

      // =================================================
      // 7. Check existing email
      // =================================================

      if (email) {
        const existingEmail = await manager.findOne(User, {
          where: {
            email,
          },
        });

        if (existingEmail) {
          throw new ConflictException('Email is already registered');
        }
      }

      // =================================================
      // 8. Extract telecom prefix
      // =================================================

      const prefix = phoneNumber.substring(0, 3);

      // =================================================
      // 9. Find telecom operator
      // =================================================

      const operator = await this.findActiveOperatorForPrefix(manager, prefix);

      // =================================================
      // 10. Hash password
      // =================================================

      const passwordHash = await bcrypt.hash(data.password, 12);

      // =================================================
      // 11. Create user
      // =================================================

      const user = manager.create(User, {
        firstName,
        secondName,
        surname,
        email,
        nidaNumber,
        passwordHash,

        memberStatus: 'Pending',

        emailVerified: false,
        phoneVerified: false,
      });

      // =================================================
      // 12. Save user
      // =================================================

      const savedUser = await manager.save(User, user);

      // =================================================
      // 13. Create phone number
      // =================================================

      const phone = manager.create(PhoneNumber, {
        userId: savedUser.userId,

        operatorId: operator.operator_id,

        phoneNumber,

        isPrimary: true,

        phoneStatus: 'Active',
      });

      // =================================================
      // 14. Save phone number
      // =================================================

      const savedPhone = await manager.save(PhoneNumber, phone);

      // =================================================
      // 14b. Assign the default 'Member' role
      // =================================================

      const roleResult = await manager.query<{ role_id: number }[]>(
        `SELECT role_id FROM roles WHERE role_name = $1 LIMIT 1`,
        ['Member'],
      );

      if (!roleResult || roleResult.length === 0) {
        throw new InternalServerErrorException('Member role is not configured');
      }

      await manager.query(
        `INSERT INTO member_roles (member_id, role_id) VALUES ($1, $2)`,
        [savedUser.userId, roleResult[0].role_id],
      );

      // =================================================
      // 15. Remove password hash
      // =================================================

      const { passwordHash: _passwordHash, ...safeUser } = savedUser;

      // =================================================
      // 16. Return response
      // =================================================

      return {
        message:
          'Registration successful. Your account is pending verification.',

        member: safeUser,

        phone: {
          phoneId: savedPhone.phoneId,

          phoneNumber: savedPhone.phoneNumber,

          operatorId: savedPhone.operatorId,

          operatorName: operator.operator_name,

          isPrimary: savedPhone.isPrimary,

          phoneStatus: savedPhone.phoneStatus,
        },
      };
    });
  }

  async getProfile(userId: number) {
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

  async updateProfile(userId: number, data: UpdateProfileDto) {
    const region = data.region.trim();

    const district = data.district?.trim() || null;

    const dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;

    const user = await this.dataSource.manager.findOne(User, {
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException('Member not found');
    }

    user.gender = data.gender;
    user.dateOfBirth = dateOfBirth;
    user.region = region;
    user.district = district;

    const savedUser = await this.dataSource.manager.save(User, user);

    const { passwordHash: _passwordHash, ...safeUser } = savedUser;

    return safeUser;
  }

  async listTelecomOperators() {
    return this.dataSource.manager.query<TelecomOperator[]>(
      `
      SELECT operator_id, operator_name
      FROM telecom_operators
      WHERE status = 'Active'
      ORDER BY operator_name
      `,
    );
  }

  async listBanks() {
    return this.dataSource.manager.query<Bank[]>(
      `
      SELECT bank_id, bank_name
      FROM banks
      WHERE status = 'Active'
      ORDER BY bank_name
      `,
    );
  }

  async addPhoneNumber(
    userId: number,
    data: AddPhoneNumberDto,
    ipAddress: string | null = null,
  ) {
    const phoneNumber = this.normalizeTanzanianPhone(data.phoneNumber);

    const accountNumber = data.accountNumber?.trim() || null;

    return this.dataSource.transaction(async (manager) => {
      const existingPhone = await manager.findOne(PhoneNumber, {
        where: {
          phoneNumber,
        },
      });

      if (existingPhone) {
        if (existingPhone.userId !== userId) {
          throw new ConflictException('Phone number is already registered');
        }

        // The member is re-submitting a number already on file for their
        // own account — most commonly their registration phone number,
        // entered again as a mobile money account on the membership form.
        // Treat it as already linked instead of erroring.
        const existingOperator = await this.findOperatorById(
          manager,
          existingPhone.operatorId,
        );

        return {
          phoneId: existingPhone.phoneId,
          phoneNumber: existingPhone.phoneNumber,
          accountNumber: existingPhone.accountNumber,
          operatorId: existingPhone.operatorId,
          operatorName: existingOperator.operator_name,
          isPrimary: existingPhone.isPrimary,
          phoneStatus: existingPhone.phoneStatus,
        };
      }

      const prefix = phoneNumber.substring(0, 3);

      const operator = await this.findActiveOperatorForPrefix(manager, prefix);

      if (operator.operator_id !== data.operatorId) {
        throw new BadRequestException(
          'Selected network does not match this phone number',
        );
      }

      const phone = manager.create(PhoneNumber, {
        userId,

        operatorId: operator.operator_id,

        phoneNumber,

        accountNumber,

        isPrimary: false,

        phoneStatus: 'Active',
      });

      const savedPhone = await manager.save(PhoneNumber, phone);

      await this.auditLogsService.record(manager, {
        memberId: userId,
        actionType: 'phone_number.add',
        affectedTable: 'phone_numbers',
        affectedRecordId: savedPhone.phoneId,
        newValue: {
          phoneNumber: savedPhone.phoneNumber,
          operatorId: savedPhone.operatorId,
        },
        ipAddress,
      });

      return {
        phoneId: savedPhone.phoneId,

        phoneNumber: savedPhone.phoneNumber,

        accountNumber: savedPhone.accountNumber,

        operatorId: savedPhone.operatorId,

        operatorName: operator.operator_name,

        isPrimary: savedPhone.isPrimary,

        phoneStatus: savedPhone.phoneStatus,
      };
    });
  }

  async addBankAccount(
    userId: number,
    data: AddBankAccountDto,
    ipAddress: string | null = null,
  ) {
    const accountNumber = data.accountNumber.trim();

    return this.dataSource.transaction(async (manager) => {
      const existingAccount = await manager.findOne(MemberBankAccount, {
        where: { accountNumber },
      });

      if (existingAccount) {
        throw new ConflictException(
          'Bank account number is already registered',
        );
      }

      const bank = await this.findActiveBank(manager, data.bankId);

      const user = await manager.findOne(User, { where: { userId } });

      if (!user) {
        throw new NotFoundException('Member not found');
      }

      const existingAccountsCount = await manager.count(MemberBankAccount, {
        where: { memberId: userId },
      });

      const accountHolderName =
        data.accountHolderName?.trim() ||
        [user.firstName, user.secondName, user.surname]
          .filter(Boolean)
          .join(' ');

      const bankAccount = manager.create(MemberBankAccount, {
        memberId: userId,

        bankId: bank.bank_id,

        accountNumber,

        accountHolderName,

        accountType: data.accountType,

        accountStatus: 'Pending',

        verificationStatus: 'Pending',

        isPrimary: existingAccountsCount === 0,
      });

      const saved = await manager.save(MemberBankAccount, bankAccount);

      await this.auditLogsService.record(manager, {
        memberId: userId,
        actionType: 'bank_account.add',
        affectedTable: 'member_bank_accounts',
        affectedRecordId: saved.memberBankAccountId,
        newValue: {
          bankId: saved.bankId,
          accountNumber: saved.accountNumber,
          accountType: saved.accountType,
        },
        ipAddress,
      });

      return {
        memberBankAccountId: saved.memberBankAccountId,
        bankId: saved.bankId,
        bankName: bank.bank_name,
        accountNumber: saved.accountNumber,
        accountHolderName: saved.accountHolderName,
        accountType: saved.accountType,
        isPrimary: saved.isPrimary,
        accountStatus: saved.accountStatus,
        verificationStatus: saved.verificationStatus,
      };
    });
  }

  async changePassword(
    userId: number,
    data: ChangePasswordDto,
    ipAddress: string | null = null,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { userId },
      });

      if (!user) {
        throw new NotFoundException('Member not found');
      }

      const currentPasswordMatches = await bcrypt.compare(
        data.currentPassword,
        user.passwordHash,
      );

      if (!currentPasswordMatches) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      user.passwordHash = await bcrypt.hash(data.newPassword, 12);

      await manager.save(User, user);

      // Never log password values (hash or plaintext) — the action itself
      // is what matters for the audit trail.
      await this.auditLogsService.record(manager, {
        memberId: userId,
        actionType: 'member.password_change',
        affectedTable: 'users',
        affectedRecordId: userId,
        ipAddress,
      });

      return { message: 'Password changed successfully.' };
    });
  }
}
