import { IsIn } from 'class-validator';

export class UpdateTreatmentStatusDto {
  @IsIn(['Active', 'Completed'])
  status!: string;
}
