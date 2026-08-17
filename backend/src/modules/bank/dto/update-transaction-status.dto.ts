import { IsIn } from 'class-validator';

export class UpdateTransactionStatusDto {
  @IsIn(['Approved', 'Completed', 'Failed'])
  status!: string;
}
