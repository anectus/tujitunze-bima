import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateBankContactDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactPhone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  contactEmail?: string;
}
