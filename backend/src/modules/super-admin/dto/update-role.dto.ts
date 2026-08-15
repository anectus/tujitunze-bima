import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  roleName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
