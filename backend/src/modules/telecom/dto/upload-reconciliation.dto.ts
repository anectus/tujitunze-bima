import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class ReconciliationRecordDto {
  @IsString()
  @MaxLength(100)
  externalReference!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  @IsOptional()
  @IsDateString()
  recordDate?: string;
}

export class UploadReconciliationDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5000)
  @ValidateNested({ each: true })
  @Type(() => ReconciliationRecordDto)
  records!: ReconciliationRecordDto[];
}
