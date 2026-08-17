import {
  IsEmail,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateHospitalProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactPhone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  facilityType?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  bedCapacity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  servicesOffered?: string;
}
