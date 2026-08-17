import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateSettlementDto {
  @IsIn(['Telecom', 'Hospital'])
  counterpartyType!: 'Telecom' | 'Hospital';

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  counterpartyName!: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  telecomOperatorId?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  hospitalId?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;
}
