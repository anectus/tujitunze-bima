import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

// Every staff role except Member — Member accounts only ever come from
// the public /members/register flow, never from here.
export const STAFF_ROLES = [
  'Admin',
  'Hospital',
  'Bank',
  'Telecom',
  'Insurance',
  'Super-admin',
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

// Hospital/Bank/Telecom/Insurance staff must be linked to the tenant they
// work for (users.hospital_id/bank_id/telecom_operator_id/
// insurance_provider_id) — Admin/Super-admin are platform-wide and take
// no tenant. See SuperAdminService.createAdministrator for the check that
// tenantId is present/absent to match the chosen role.
export const TENANT_SCOPED_ROLES: StaffRole[] = [
  'Hospital',
  'Bank',
  'Telecom',
  'Insurance',
];

export class CreateAdministratorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  secondName?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  surname!: string;

  // Required (unlike RegisterDto's optional email) — a staff account
  // needs a memorable login identifier, and NIDA-only login is impractical
  // for day-to-day staff use.
  @IsEmail()
  @MaxLength(100)
  email!: string;

  @IsString()
  @Matches(/^\d{8}-\d{5}-\d{5}-\d{2}$/, {
    message: 'NIDA number must be in the format 00000000-00000-00000-00',
  })
  nidaNumber!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsIn(STAFF_ROLES)
  role!: StaffRole;

  // Required for Hospital/Bank/Telecom/Insurance, forbidden for
  // Admin/Super-admin — validated against `role` in the service, since
  // confirming the id actually exists needs a DB round trip anyway.
  @IsOptional()
  @IsInt()
  tenantId?: number;
}
