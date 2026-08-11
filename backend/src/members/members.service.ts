import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';

import { DataSource } from 'typeorm';

import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { PhoneNumber } from './entities/phone-number.entity';

@Injectable()
export class MembersService {
  constructor(private readonly dataSource: DataSource) {}

  async register(data: {
    firstName: string;
    secondName?: string;
    surname: string;
    phoneNumber: string;
    nidaNumber: string;
    email?: string;
    password: string;
  }) {
    // =====================================================
    // 1. Validate required fields
    // =====================================================

    if (!data.firstName?.trim()) {
      throw new BadRequestException('First name is required');
    }

    if (!data.surname?.trim()) {
      throw new BadRequestException('Surname is required');
    }

    if (!data.phoneNumber?.trim()) {
      throw new BadRequestException('Phone number is required');
    }

    if (!data.nidaNumber?.trim()) {
      throw new BadRequestException('NIDA number is required');
    }

    if (!data.password) {
      throw new BadRequestException('Password is required');
    }

    if (data.password.length < 8) {
      throw new BadRequestException(
        'Password must contain at least 8 characters',
      );
    }

    // =====================================================
    // 2. Clean input
    // =====================================================

    const firstName = data.firstName.trim();

    const secondName = data.secondName?.trim() || null;

    const surname = data.surname.trim();

    const email = data.email?.trim().toLowerCase() || null;

    const nidaNumber = data.nidaNumber.trim();

    let phoneNumber = data.phoneNumber.trim();

    // Remove spaces
    phoneNumber = phoneNumber.replace(/\s+/g, '');

    // =====================================================
    // 3. Normalize Tanzanian phone number
    //
    // Accepted:
    // 0712345678
    // 255712345678
    // +255712345678
    //
    // Stored:
    // 0712345678
    // =====================================================

    if (phoneNumber.startsWith('+255')) {
      phoneNumber = '0' + phoneNumber.substring(4);
    } else if (phoneNumber.startsWith('255')) {
      phoneNumber = '0' + phoneNumber.substring(3);
    }

    // Tanzania mobile number validation
    if (!/^0[67]\d{8}$/.test(phoneNumber)) {
      throw new BadRequestException('Invalid Tanzanian mobile phone number');
    }

    // =====================================================
    // 4. Database transaction
    // =====================================================

    return this.dataSource.transaction(async (manager) => {
      // =================================================
      // 5. Check existing phone
      // =================================================

      const existingPhone = await manager.findOne(PhoneNumber, {
        where: {
          phoneNumber,
        },
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

      const operatorResult = await manager.query<
        { operator_id: number; operator_name: string }[]
      >(
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

      const operator = operatorResult[0];

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
}
