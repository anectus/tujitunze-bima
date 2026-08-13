import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsIn(['Male', 'Female'])
  gender!: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  region!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;
}
