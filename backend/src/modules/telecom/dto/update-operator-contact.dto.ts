import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateOperatorContactDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactPhone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  contactEmail?: string;
}
