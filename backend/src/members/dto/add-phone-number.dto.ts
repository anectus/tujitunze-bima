import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class AddPhoneNumberDto {
  @IsInt()
  @IsPositive()
  operatorId!: number;

  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  accountNumber?: string;
}
