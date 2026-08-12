import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { RegisterPhoneNumberDto } from './register-phone-number.dto';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  secondName?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  surname!: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  // Beyond the primary phoneNumber above — each entry picks its own
  // network explicitly since it can't be inferred the way the primary
  // number's prefix is.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => RegisterPhoneNumberDto)
  additionalPhoneNumbers?: RegisterPhoneNumberDto[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  nidaNumber!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
