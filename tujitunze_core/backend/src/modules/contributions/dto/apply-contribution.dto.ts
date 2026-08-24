import { IsNumber, IsString, IsOptional, IsIn } from 'class-validator';

export class ApplyContributionDto {
  @IsNumber()
  memberId: number;

  @IsString()
  @IsIn(['TELECOM', 'BANK'])
  sourceType: 'TELECOM' | 'BANK';

  @IsString()
  externalReference: string;

  @IsNumber()
  sourceTransactionAmount: number;

  @IsOptional()
  @IsString()
  ruleName?: string;
}
