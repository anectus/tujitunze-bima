import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateClaimDto {
  @IsInt()
  @IsPositive()
  memberId!: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  treatmentId?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  memberInsuranceId?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  claimAmount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;

  // true saves as 'Draft' (not yet submitted); false/omitted submits
  // immediately as 'Pending'.
  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;
}
