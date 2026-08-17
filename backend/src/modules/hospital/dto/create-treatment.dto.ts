import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTreatmentDto {
  @IsInt()
  @IsPositive()
  memberId!: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  verificationId?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  servicesProvided!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  procedures?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  prescription?: string;
}
