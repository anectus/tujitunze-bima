import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
import { NotificationsService } from '../notifications/notifications.service';

// TB + zero-padded 6-digit user id — computed on read rather than stored,
// since the schema has no dedicated member-number column yet (see the
// product-spec gap notes). Matches the "TB######" format members are
// meant to be issued.
function formatMemberId(userId: number): string {
  return `TB${String(userId).padStart(6, '0')}`;
}

interface Hospital {
  hospital_id: number;
  hospital_name: string;
  hospital_code: string | null;
  location: string | null;
  region: string | null;
  district: string | null;
  contact_phone: string | null;
  status: string;
}

interface MemberInsurancePolicy {
  member_insurance_id: number;
  policy_number: string;
  start_date: Date;
  end_date: Date | null;
  policy_status: string;
  plan_id: number;
  plan_name: string;
  premium_amount: string | null;
  coverage_amount: string | null;
  provider_id: number;
  provider_name: string;
}

interface MemberClaim {
  claim_id: number;
  claim_number: string;
  claim_amount: string;
  approved_amount: string | null;
  claim_status: string;
  claim_date: Date;
  processed_date: Date | null;
  remarks: string | null;
  hospital_id: number;
  hospital_name: string;
}

interface MemberVerification {
  verification_id: number;
  verification_method: string;
  verification_result: string;
  member_status: string | null;
  verified_date: Date;
  remarks: string | null;
  hospital_id: number;
  hospital_name: string;
}

interface TelecomOperator {
  operator_id: number;
  operator_name: string;
  prefixes: string[];
}

interface Bank {
  bank_id: number;
  bank_name: string;
}

interface Region {
  region_id: number;
  region_name: string;
  area_type: string;
}

interface District {
  district_id: number;
  district_name: string;
  region_id: number;
}

@Injectable()
export class MembersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditLogsService: AuditLogsService,
    private readonly notificationsService: NotificationsService,
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

  private async findActiveRegion(
    manager: EntityManager,
    regionName: string,
  ): Promise<Region> {
    const regionResult = await manager.query<Region[]>(
      `
      SELECT region_id, region_name, area_type
      FROM regions
      WHERE region_name = $1
        AND status = 'Active'
      LIMIT 1
      `,
      [regionName],
    );

    if (!regionResult || regionResult.length === 0) {
      throw new BadRequestException('Selected region is not supported');
    }

    return regionResult[0];
  }

  private async findActiveDistrict(
    manager: EntityManager,
    regionId: number,
    districtName: string,
  ): Promise<District> {
    const districtResult = await manager.query<District[]>(
      `
      SELECT district_id, district_name, region_id
      FROM districts
      WHERE region_id = $1
        AND district_name = $2
        AND status = 'Active'
      LIMIT 1
      `,
      [regionId, districtName],
    );

    if (!districtResult || districtResult.length === 0) {
      throw new BadRequestException(
        'Selected district does not belong to the selected region',
      );
    }

    return districtResult[0];
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

    const bankAccounts = await this.dataSource.manager.find(MemberBankAccount, {
      where: { memberId: userId },
    });

    const { passwordHash: _passwordHash, ...safeUser } = user;

    return { ...safeUser, bankAccounts };
  }

  async updateProfile(userId: number, data: UpdateProfileDto) {
    const dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;

    const region = await this.findActiveRegion(
      this.dataSource.manager,
      data.region.trim(),
    );

    const districtName = data.district?.trim() || null;

    const district = districtName
      ? await this.findActiveDistrict(
          this.dataSource.manager,
          region.region_id,
          districtName,
        )
      : null;

    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { userId } });

      if (!user) {
        throw new NotFoundException('Member not found');
      }

      const wasOnboarded = !!user.region;

      user.gender = data.gender;
      user.dateOfBirth = dateOfBirth;
      user.region = region.region_name;
      user.district = district?.district_name ?? null;

      const savedUser = await manager.save(User, user);

      if (!wasOnboarded) {
        await this.notificationsService.create(manager, {
          memberId: userId,
          notificationType: 'Membership',
          title: 'Membership profile completed',
          message:
            'Your onboarding is complete. Your membership details are now up to date.',
        });
      }

      const { passwordHash: _passwordHash, ...safeUser } = savedUser;

      return safeUser;
    });
  }

  async listTelecomOperators() {
    return this.dataSource.manager.query<TelecomOperator[]>(
      `
      SELECT
        o.operator_id,
        o.operator_name,
        COALESCE(
          array_agg(p.prefix ORDER BY p.prefix) FILTER (WHERE p.prefix IS NOT NULL),
          ARRAY[]::VARCHAR[]
        ) AS prefixes
      FROM telecom_operators o
      LEFT JOIN telecom_operator_prefixes p
        ON p.operator_id = o.operator_id
        AND p.status = 'Active'
      WHERE o.status = 'Active'
      GROUP BY o.operator_id, o.operator_name
      ORDER BY o.operator_name
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

  async listRegions() {
    return this.dataSource.manager.query<Region[]>(
      `
      SELECT region_id, region_name, area_type
      FROM regions
      WHERE status = 'Active'
      ORDER BY region_name
      `,
    );
  }

  async listDistrictsByRegion(regionId: number) {
    return this.dataSource.manager.query<District[]>(
      `
      SELECT district_id, district_name, region_id
      FROM districts
      WHERE region_id = $1
        AND status = 'Active'
      ORDER BY district_name
      `,
      [regionId],
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

      await this.notificationsService.create(manager, {
        memberId: userId,
        notificationType: 'Security',
        title: 'Phone number linked',
        message: `${savedPhone.phoneNumber} (${operator.operator_name}) was linked to your account.`,
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

      await this.notificationsService.create(manager, {
        memberId: userId,
        notificationType: 'Security',
        title: 'Bank account linked',
        message: `A ${bank.bank_name} account ending ${accountNumber.slice(-4)} was linked to your account.`,
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

      await this.notificationsService.create(manager, {
        memberId: userId,
        notificationType: 'Security',
        title: 'Password changed',
        message: 'Your account password was changed successfully.',
      });

      return { message: 'Password changed successfully.' };
    });
  }

  // =====================================================
  // My Membership — combines user status, wallet, and insurance into the
  // one summary the dashboard's "My Membership" / "Health Fund Status"
  // cards render. Raw SQL (rather than injecting HealthWallet/insurance
  // entities into this module) mirrors the existing cross-table read
  // pattern already used above for telecom operators/banks/regions.
  // =====================================================

  async getMembership(userId: number) {
    const user = await this.dataSource.manager.findOne(User, {
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException('Member not found');
    }

    const [walletRow] = await this.dataSource.query<
      { balance: string; wallet_status: string }[]
    >(
      `SELECT balance, wallet_status FROM health_wallets WHERE member_id = $1 LIMIT 1`,
      [userId],
    );

    const [contributionSummary] = await this.dataSource.query<
      {
        has_contributed: boolean;
        last_contribution_date: Date | null;
        total: string;
      }[]
    >(
      `SELECT
         COUNT(wt.*) > 0 AS has_contributed,
         MAX(wt.transaction_date) AS last_contribution_date,
         COALESCE(SUM(wt.amount), 0) AS total
       FROM wallet_transactions wt
       INNER JOIN health_wallets hw ON hw.wallet_id = wt.wallet_id
       WHERE hw.member_id = $1`,
      [userId],
    );

    const [activePolicy] = await this.dataSource.query<
      {
        policy_number: string;
        policy_status: string;
        plan_name: string;
        provider_name: string;
        coverage_amount: string | null;
      }[]
    >(
      `SELECT
         mi.policy_number,
         mi.policy_status,
         ip.plan_name,
         ipr.provider_name,
         ip.coverage_amount
       FROM member_insurance mi
       INNER JOIN insurance_plans ip ON ip.plan_id = mi.plan_id
       INNER JOIN insurance_providers ipr ON ipr.provider_id = ip.provider_id
       WHERE mi.member_id = $1
         AND mi.policy_status = 'Active'
       ORDER BY mi.start_date DESC
       LIMIT 1`,
      [userId],
    );

    // A member is treated as healthcare-eligible once an Admin has
    // verified them (memberStatus = 'Active') — onboarding completion
    // (region set) is a separate, frontend-tracked concept (see
    // LoginForm/Header's "Complete Membership" flow) that doesn't by
    // itself grant eligibility.
    const healthcareEligible = user.memberStatus === 'Active';

    return {
      memberId: formatMemberId(user.userId),
      memberStatus: user.memberStatus,
      registrationDate: user.createdAt,
      onboardingComplete: !!user.region,
      healthcareEligible,
      fundStatus: {
        balance: walletRow ? Number(walletRow.balance) : 0,
        walletStatus: walletRow ? walletRow.wallet_status : 'Not yet opened',
      },
      contributionStatus: {
        hasContributed: contributionSummary?.has_contributed ?? false,
        lastContributionDate:
          contributionSummary?.last_contribution_date ?? null,
        totalContributed: contributionSummary
          ? Number(contributionSummary.total)
          : 0,
      },
      coverage: activePolicy
        ? {
            policyNumber: activePolicy.policy_number,
            status: activePolicy.policy_status,
            planName: activePolicy.plan_name,
            providerName: activePolicy.provider_name,
            coverageAmount: activePolicy.coverage_amount
              ? Number(activePolicy.coverage_amount)
              : null,
          }
        : null,
    };
  }

  // =====================================================
  // Manage phone numbers — set primary. Adding was already supported;
  // this is the other "Manage phone numbers" action from the Member
  // dashboard spec. Removing a linked number is deliberately left out —
  // it's a contribution source (see wallet top-up), so unlinking it needs
  // its own care later rather than a same-pass addition here.
  // =====================================================

  async setPrimaryPhoneNumber(
    userId: number,
    phoneId: number,
    ipAddress: string | null = null,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const phone = await manager.findOne(PhoneNumber, { where: { phoneId } });

      if (!phone) {
        throw new NotFoundException('Phone number not found');
      }

      if (phone.userId !== userId) {
        throw new ForbiddenException(
          'That phone number does not belong to you',
        );
      }

      if (phone.isPrimary) {
        return phone;
      }

      await manager.update(
        PhoneNumber,
        { userId, isPrimary: true },
        { isPrimary: false },
      );

      phone.isPrimary = true;

      const saved = await manager.save(PhoneNumber, phone);

      await this.auditLogsService.record(manager, {
        memberId: userId,
        actionType: 'phone_number.set_primary',
        affectedTable: 'phone_numbers',
        affectedRecordId: saved.phoneId,
        newValue: { phoneNumber: saved.phoneNumber },
        ipAddress,
      });

      await this.notificationsService.create(manager, {
        memberId: userId,
        notificationType: 'Security',
        title: 'Primary phone number updated',
        message: `${saved.phoneNumber} is now your primary phone number.`,
      });

      return saved;
    });
  }

  // =====================================================
  // Healthcare Services — member-facing read of the hospital directory
  // Admin already manages (see admin/entities/hospital.entity.ts). Only
  // Active hospitals are shown; raw SQL avoids registering that entity
  // in a second module just for a read.
  // =====================================================

  async listHospitals(search?: string) {
    return this.dataSource.query<Hospital[]>(
      `SELECT hospital_id, hospital_name, hospital_code, location, region, district, contact_phone, status
       FROM hospitals
       WHERE status = 'Active'
         AND (
           $1::text IS NULL
           OR hospital_name ILIKE '%' || $1 || '%'
           OR region ILIKE '%' || $1 || '%'
           OR district ILIKE '%' || $1 || '%'
         )
       ORDER BY hospital_name`,
      [search?.trim() || null],
    );
  }

  async getHospital(hospitalId: number) {
    const [hospital] = await this.dataSource.query<Hospital[]>(
      `SELECT hospital_id, hospital_name, hospital_code, location, region, district, contact_phone, status
       FROM hospitals
       WHERE hospital_id = $1
         AND status = 'Active'
       LIMIT 1`,
      [hospitalId],
    );

    if (!hospital) {
      throw new NotFoundException('Hospital not found');
    }

    return hospital;
  }

  // =====================================================
  // My Insurance — the member's own policies (member_insurance), each
  // joined out to its plan and provider. Backs the "Health Fund Status"
  // coverage bullets and the insurance/plans frontend page.
  // =====================================================

  async listInsurance(userId: number) {
    return this.dataSource.query<MemberInsurancePolicy[]>(
      `SELECT
         mi.member_insurance_id,
         mi.policy_number,
         mi.start_date,
         mi.end_date,
         mi.policy_status,
         ip.plan_id,
         ip.plan_name,
         ip.premium_amount,
         ip.coverage_amount,
         ipr.provider_id,
         ipr.provider_name
       FROM member_insurance mi
       INNER JOIN insurance_plans ip ON ip.plan_id = mi.plan_id
       INNER JOIN insurance_providers ipr ON ipr.provider_id = ip.provider_id
       WHERE mi.member_id = $1
       ORDER BY mi.start_date DESC`,
      [userId],
    );
  }

  // =====================================================
  // Claims — the member's own healthcare_claims, joined out to the
  // hospital name. Read-only: submitting a new claim isn't in the
  // Member dashboard spec (claims are raised by Hospital-side staff),
  // and there's no Hospital-facing endpoint that writes here yet either.
  // =====================================================

  async listClaims(userId: number) {
    return this.dataSource.query<MemberClaim[]>(
      `SELECT
         c.claim_id,
         c.claim_number,
         c.claim_amount,
         c.approved_amount,
         c.claim_status,
         c.claim_date,
         c.processed_date,
         c.remarks,
         h.hospital_id,
         h.hospital_name
       FROM healthcare_claims c
       INNER JOIN hospitals h ON h.hospital_id = c.hospital_id
       WHERE c.member_id = $1
       ORDER BY c.claim_date DESC`,
      [userId],
    );
  }

  // =====================================================
  // Hospital Verification — the member's own healthcare_verifications,
  // joined out to the hospital name. Nothing writes to this table yet
  // (that's a Hospital-role check-in flow that doesn't exist), so this
  // will read back empty until that's built — same honest-gap shape as
  // Claims above.
  // =====================================================

  async listVerifications(userId: number) {
    return this.dataSource.query<MemberVerification[]>(
      `SELECT
         v.verification_id,
         v.verification_method,
         v.verification_result,
         v.member_status,
         v.verified_date,
         v.remarks,
         h.hospital_id,
         h.hospital_name
       FROM healthcare_verifications v
       INNER JOIN hospitals h ON h.hospital_id = v.hospital_id
       WHERE v.member_id = $1
       ORDER BY v.verified_date DESC`,
      [userId],
    );
  }
}
