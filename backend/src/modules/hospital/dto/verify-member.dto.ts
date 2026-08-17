import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class VerifyMemberDto {
  @IsIn(['NIDA', 'MemberID'])
  verificationMethod!: 'NIDA' | 'MemberID';

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  identifier!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}
