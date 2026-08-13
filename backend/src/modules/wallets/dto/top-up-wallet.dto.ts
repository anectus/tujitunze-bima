import { IsIn, IsInt, IsNumber, IsPositive, Max } from 'class-validator';

export class TopUpWalletDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(10000000)
  amount!: number;

  // "phone" (mobile money) is the primary, ordinary-person path this
  // wallet is designed around; "bank" exists for members who prefer it.
  @IsIn(['phone', 'bank'])
  sourceType!: 'phone' | 'bank';

  // phoneId when sourceType is "phone", memberBankAccountId when "bank" —
  // must belong to the requesting member, checked in the service.
  @IsInt()
  @IsPositive()
  sourceId!: number;
}
