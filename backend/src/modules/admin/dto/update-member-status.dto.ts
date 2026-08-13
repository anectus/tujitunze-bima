import { IsIn } from 'class-validator';

export class UpdateMemberStatusDto {
  @IsIn(['Pending', 'Active', 'Suspended', 'Inactive'])
  status!: string;
}
