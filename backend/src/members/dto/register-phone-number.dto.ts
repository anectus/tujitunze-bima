import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

// An additional (non-primary) phone number submitted at registration —
// unlike the primary number, the network isn't inferred from the prefix
// alone here because the user picks it explicitly in the form.
export class RegisterPhoneNumberDto {
  @IsInt()
  @IsPositive()
  operatorId!: number;

  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;
}
