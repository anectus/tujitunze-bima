import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

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

  // Registration only ever collects one phone number — additional
  // numbers are added afterwards from the member's profile via
  // POST /members/phone-numbers, not at sign-up.
  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  // Tanzania NIDA number: 20 digits, grouped 8-5-5-2 with dashes
  // (e.g. 20030707-35805-00002-26). The frontend auto-inserts the dashes
  // as the user types, but this is still validated server-side since the
  // API is a trust boundary, not just this frontend.
  @IsString()
  @Matches(/^\d{8}-\d{5}-\d{5}-\d{2}$/, {
    message: 'NIDA number must be in the format 00000000-00000-00000-00',
  })
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
