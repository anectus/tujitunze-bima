import {
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateClaimStatusDto {
  @IsIn(['Pending', 'Under Review', 'Approved', 'Rejected', 'Disputed'])
  status!: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  approvedAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;
}
