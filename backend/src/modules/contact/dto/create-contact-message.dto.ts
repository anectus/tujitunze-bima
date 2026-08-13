import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const CONTACT_CATEGORIES = [
  'General Enquiry',
  'Member Registration',
  'Health Wallet',
  'Hospital Verification',
  'Telecom Contributions',
  'Bank Integration',
  'Technical Support',
  'Complaint',
  'Partnership',
];

export class CreateContactMessageDto {
  // Required only for a guest (unauthenticated) sender — a logged-in
  // sender's name/email are taken from their verified account instead.
  // See ContactService.create().
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(23)
  nidaNumber?: string;

  @IsIn(CONTACT_CATEGORIES)
  category!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  subject!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message!: string;
}
