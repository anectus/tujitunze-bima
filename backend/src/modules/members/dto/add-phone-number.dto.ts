import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AddPhoneNumberDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  accountNumber?: string;
}
