import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  roleName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
