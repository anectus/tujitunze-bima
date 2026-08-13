import { IsIn } from 'class-validator';

export class UpdateHospitalStatusDto {
  @IsIn(['Active', 'Inactive', 'Suspended'])
  status!: string;
}
