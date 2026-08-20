"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("./entities/user.entity");
const phone_number_entity_1 = require("./entities/phone-number.entity");
const bank_account_entity_1 = require("./entities/bank-account.entity");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
const notifications_service_1 = require("../notifications/notifications.service");
function formatMemberId(userId) {
    return `TB${String(userId).padStart(6, '0')}`;
}
let MembersService = class MembersService {
    dataSource;
    auditLogsService;
    notificationsService;
    constructor(dataSource, auditLogsService, notificationsService) {
        this.dataSource = dataSource;
        this.auditLogsService = auditLogsService;
        this.notificationsService = notificationsService;
    }
    normalizeTanzanianPhone(raw) {
        let phoneNumber = raw.trim().replace(/\s+/g, '');
        if (phoneNumber.startsWith('+255')) {
            phoneNumber = '0' + phoneNumber.substring(4);
        }
        else if (phoneNumber.startsWith('255')) {
            phoneNumber = '0' + phoneNumber.substring(3);
        }
        if (!/^0[67]\d{8}$/.test(phoneNumber)) {
            throw new common_1.BadRequestException('Invalid Tanzanian mobile phone number');
        }
        return phoneNumber;
    }
    async findActiveOperatorForPrefix(manager, prefix) {
        const operatorResult = await manager.query(`
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
          `, [prefix]);
        if (!operatorResult || operatorResult.length === 0) {
            throw new common_1.BadRequestException(`Telecom operator for prefix ${prefix} is not supported`);
        }
        return operatorResult[0];
    }
    async findActiveBank(manager, bankId) {
        const bankResult = await manager.query(`
      SELECT bank_id, bank_name
      FROM banks
      WHERE bank_id = $1
        AND status = 'Active'
      LIMIT 1
      `, [bankId]);
        if (!bankResult || bankResult.length === 0) {
            throw new common_1.BadRequestException('Selected bank is not supported');
        }
        return bankResult[0];
    }
    async findActiveRegion(manager, regionName) {
        const regionResult = await manager.query(`
      SELECT region_id, region_name, area_type
      FROM regions
      WHERE region_name = $1
        AND status = 'Active'
      LIMIT 1
      `, [regionName]);
        if (!regionResult || regionResult.length === 0) {
            throw new common_1.BadRequestException('Selected region is not supported');
        }
        return regionResult[0];
    }
    async findActiveDistrict(manager, regionId, districtName) {
        const districtResult = await manager.query(`
      SELECT district_id, district_name, region_id
      FROM districts
      WHERE region_id = $1
        AND district_name = $2
        AND status = 'Active'
      LIMIT 1
      `, [regionId, districtName]);
        if (!districtResult || districtResult.length === 0) {
            throw new common_1.BadRequestException('Selected district does not belong to the selected region');
        }
        return districtResult[0];
    }
    async findOperatorById(manager, operatorId) {
        const operatorResult = await manager.query(`
      SELECT operator_id, operator_name
      FROM telecom_operators
      WHERE operator_id = $1
      LIMIT 1
      `, [operatorId]);
        if (!operatorResult || operatorResult.length === 0) {
            throw new common_1.BadRequestException('Selected network is not supported');
        }
        return operatorResult[0];
    }
    async register(data) {
        const firstName = data.firstName.trim();
        const secondName = data.secondName?.trim() || null;
        const surname = data.surname.trim();
        const email = data.email?.trim().toLowerCase() || null;
        const nidaNumber = data.nidaNumber.trim();
        const phoneNumber = this.normalizeTanzanianPhone(data.phoneNumber);
        return this.dataSource.transaction(async (manager) => {
            const existingPhone = await manager.findOne(phone_number_entity_1.PhoneNumber, {
                where: { phoneNumber },
            });
            if (existingPhone) {
                throw new common_1.ConflictException('Phone number is already registered');
            }
            const existingNida = await manager.findOne(user_entity_1.User, {
                where: {
                    nidaNumber,
                },
            });
            if (existingNida) {
                throw new common_1.ConflictException('NIDA number is already registered');
            }
            if (email) {
                const existingEmail = await manager.findOne(user_entity_1.User, {
                    where: {
                        email,
                    },
                });
                if (existingEmail) {
                    throw new common_1.ConflictException('Email is already registered');
                }
            }
            const prefix = phoneNumber.substring(0, 3);
            const operator = await this.findActiveOperatorForPrefix(manager, prefix);
            const passwordHash = await bcrypt.hash(data.password, 12);
            const user = manager.create(user_entity_1.User, {
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
            const savedUser = await manager.save(user_entity_1.User, user);
            const phone = manager.create(phone_number_entity_1.PhoneNumber, {
                userId: savedUser.userId,
                operatorId: operator.operator_id,
                phoneNumber,
                isPrimary: true,
                phoneStatus: 'Active',
            });
            const savedPhone = await manager.save(phone_number_entity_1.PhoneNumber, phone);
            const roleResult = await manager.query(`SELECT role_id FROM roles WHERE role_name = $1 LIMIT 1`, ['Member']);
            if (!roleResult || roleResult.length === 0) {
                throw new common_1.InternalServerErrorException('Member role is not configured');
            }
            await manager.query(`INSERT INTO member_roles (member_id, role_id) VALUES ($1, $2)`, [savedUser.userId, roleResult[0].role_id]);
            const { passwordHash: _passwordHash, ...safeUser } = savedUser;
            return {
                message: 'Registration successful. Your account is pending verification.',
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
    async getProfile(userId) {
        const user = await this.dataSource.manager.findOne(user_entity_1.User, {
            where: { userId },
            relations: { phoneNumbers: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('Member not found');
        }
        const bankAccounts = await this.dataSource.manager.find(bank_account_entity_1.MemberBankAccount, {
            where: { memberId: userId },
        });
        const { passwordHash: _passwordHash, ...safeUser } = user;
        return { ...safeUser, bankAccounts };
    }
    async updateProfile(userId, data) {
        const dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
        const region = await this.findActiveRegion(this.dataSource.manager, data.region.trim());
        const districtName = data.district?.trim() || null;
        const district = districtName
            ? await this.findActiveDistrict(this.dataSource.manager, region.region_id, districtName)
            : null;
        return this.dataSource.transaction(async (manager) => {
            const user = await manager.findOne(user_entity_1.User, { where: { userId } });
            if (!user) {
                throw new common_1.NotFoundException('Member not found');
            }
            const wasOnboarded = !!user.region;
            user.gender = data.gender;
            user.dateOfBirth = dateOfBirth;
            user.region = region.region_name;
            user.district = district?.district_name ?? null;
            const savedUser = await manager.save(user_entity_1.User, user);
            if (!wasOnboarded) {
                await this.notificationsService.create(manager, {
                    memberId: userId,
                    notificationType: 'Membership',
                    title: 'Membership profile completed',
                    message: 'Your onboarding is complete. Your membership details are now up to date.',
                });
            }
            const { passwordHash: _passwordHash, ...safeUser } = savedUser;
            return safeUser;
        });
    }
    async listTelecomOperators() {
        return this.dataSource.manager.query(`
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
      `);
    }
    async listBanks() {
        return this.dataSource.manager.query(`
      SELECT bank_id, bank_name
      FROM banks
      WHERE status = 'Active'
      ORDER BY bank_name
      `);
    }
    async listRegions() {
        return this.dataSource.manager.query(`
      SELECT region_id, region_name, area_type
      FROM regions
      WHERE status = 'Active'
      ORDER BY region_name
      `);
    }
    async listDistrictsByRegion(regionId) {
        return this.dataSource.manager.query(`
      SELECT district_id, district_name, region_id
      FROM districts
      WHERE region_id = $1
        AND status = 'Active'
      ORDER BY district_name
      `, [regionId]);
    }
    async addPhoneNumber(userId, data, ipAddress = null) {
        const phoneNumber = this.normalizeTanzanianPhone(data.phoneNumber);
        const accountNumber = data.accountNumber?.trim() || null;
        return this.dataSource.transaction(async (manager) => {
            const existingPhone = await manager.findOne(phone_number_entity_1.PhoneNumber, {
                where: {
                    phoneNumber,
                },
            });
            if (existingPhone) {
                if (existingPhone.userId !== userId) {
                    throw new common_1.ConflictException('Phone number is already registered');
                }
                const existingOperator = await this.findOperatorById(manager, existingPhone.operatorId);
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
            const phone = manager.create(phone_number_entity_1.PhoneNumber, {
                userId,
                operatorId: operator.operator_id,
                phoneNumber,
                accountNumber,
                isPrimary: false,
                phoneStatus: 'Active',
            });
            const savedPhone = await manager.save(phone_number_entity_1.PhoneNumber, phone);
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
    async addBankAccount(userId, data, ipAddress = null) {
        const accountNumber = data.accountNumber.trim();
        return this.dataSource.transaction(async (manager) => {
            const existingAccount = await manager.findOne(bank_account_entity_1.MemberBankAccount, {
                where: { accountNumber },
            });
            if (existingAccount) {
                throw new common_1.ConflictException('Bank account number is already registered');
            }
            const bank = await this.findActiveBank(manager, data.bankId);
            const user = await manager.findOne(user_entity_1.User, { where: { userId } });
            if (!user) {
                throw new common_1.NotFoundException('Member not found');
            }
            const existingAccountsCount = await manager.count(bank_account_entity_1.MemberBankAccount, {
                where: { memberId: userId },
            });
            const accountHolderName = data.accountHolderName?.trim() ||
                [user.firstName, user.secondName, user.surname]
                    .filter(Boolean)
                    .join(' ');
            const bankAccount = manager.create(bank_account_entity_1.MemberBankAccount, {
                memberId: userId,
                bankId: bank.bank_id,
                accountNumber,
                accountHolderName,
                accountType: data.accountType,
                accountStatus: 'Pending',
                verificationStatus: 'Pending',
                isPrimary: existingAccountsCount === 0,
            });
            const saved = await manager.save(bank_account_entity_1.MemberBankAccount, bankAccount);
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
    async changePassword(userId, data, ipAddress = null) {
        return this.dataSource.transaction(async (manager) => {
            const user = await manager.findOne(user_entity_1.User, {
                where: { userId },
            });
            if (!user) {
                throw new common_1.NotFoundException('Member not found');
            }
            const currentPasswordMatches = await bcrypt.compare(data.currentPassword, user.passwordHash);
            if (!currentPasswordMatches) {
                throw new common_1.UnauthorizedException('Current password is incorrect');
            }
            user.passwordHash = await bcrypt.hash(data.newPassword, 12);
            await manager.save(user_entity_1.User, user);
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
    async getMembership(userId) {
        const user = await this.dataSource.manager.findOne(user_entity_1.User, {
            where: { userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('Member not found');
        }
        const [walletRow] = await this.dataSource.query(`SELECT balance, wallet_status FROM health_wallets WHERE member_id = $1 LIMIT 1`, [userId]);
        const [contributionSummary] = await this.dataSource.query(`SELECT
         COUNT(wt.*) > 0 AS has_contributed,
         MAX(wt.transaction_date) AS last_contribution_date,
         COALESCE(SUM(wt.amount), 0) AS total
       FROM wallet_transactions wt
       INNER JOIN health_wallets hw ON hw.wallet_id = wt.wallet_id
       WHERE hw.member_id = $1`, [userId]);
        const [activePolicy] = await this.dataSource.query(`SELECT
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
       LIMIT 1`, [userId]);
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
                lastContributionDate: contributionSummary?.last_contribution_date ?? null,
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
    async setPrimaryPhoneNumber(userId, phoneId, ipAddress = null) {
        return this.dataSource.transaction(async (manager) => {
            const phone = await manager.findOne(phone_number_entity_1.PhoneNumber, { where: { phoneId } });
            if (!phone) {
                throw new common_1.NotFoundException('Phone number not found');
            }
            if (phone.userId !== userId) {
                throw new common_1.ForbiddenException('That phone number does not belong to you');
            }
            if (phone.isPrimary) {
                return phone;
            }
            await manager.update(phone_number_entity_1.PhoneNumber, { userId, isPrimary: true }, { isPrimary: false });
            phone.isPrimary = true;
            const saved = await manager.save(phone_number_entity_1.PhoneNumber, phone);
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
    async listHospitals(search) {
        return this.dataSource.query(`SELECT hospital_id, hospital_name, hospital_code, location, region, district, contact_phone, status
       FROM hospitals
       WHERE status = 'Active'
         AND (
           $1::text IS NULL
           OR hospital_name ILIKE '%' || $1 || '%'
           OR region ILIKE '%' || $1 || '%'
           OR district ILIKE '%' || $1 || '%'
         )
       ORDER BY hospital_name`, [search?.trim() || null]);
    }
    async getHospital(hospitalId) {
        const [hospital] = await this.dataSource.query(`SELECT hospital_id, hospital_name, hospital_code, location, region, district, contact_phone, status
       FROM hospitals
       WHERE hospital_id = $1
         AND status = 'Active'
       LIMIT 1`, [hospitalId]);
        if (!hospital) {
            throw new common_1.NotFoundException('Hospital not found');
        }
        return hospital;
    }
    async listInsurance(userId) {
        return this.dataSource.query(`SELECT
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
       ORDER BY mi.start_date DESC`, [userId]);
    }
    async listClaims(userId) {
        return this.dataSource.query(`SELECT
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
       ORDER BY c.claim_date DESC`, [userId]);
    }
    async listVerifications(userId) {
        return this.dataSource.query(`SELECT
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
       ORDER BY v.verified_date DESC`, [userId]);
    }
};
exports.MembersService = MembersService;
exports.MembersService = MembersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        audit_logs_service_1.AuditLogsService,
        notifications_service_1.NotificationsService])
], MembersService);
//# sourceMappingURL=members.service.js.map