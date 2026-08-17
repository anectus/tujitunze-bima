import {
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class FundTransferDto {
  @IsIn(['Deposit', 'Withdrawal'])
  transferType!: 'Deposit' | 'Withdrawal';

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
