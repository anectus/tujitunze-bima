import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateHospitalDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  hospitalName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  hospitalCode?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  licenseNumber?: string;
}
