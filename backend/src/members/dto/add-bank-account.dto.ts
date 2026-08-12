import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class AddBankAccountDto {
  @IsInt()
  @IsPositive()
  bankId!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  accountNumber!: string;

  @IsIn(['Savings', 'Current'])
  accountType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  accountHolderName?: string;
}
