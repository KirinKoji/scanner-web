import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class ScanTicketDto {
  @IsString()
  qrCode: string;
}

export class ScanResponseDto {
  status: 'success' | 'error';
  message?: string;
  data?: {
    match_id: string;
    seatNumber: string;
    status: string;
    timestamp?: string;
    rowIndex?: number;
  };
}

export class ImportTicketDto {
  @IsOptional()
  @IsString()
  qrCode?: string;

  @IsOptional()
  @IsString()
  ticketId?: string;

  @IsString()
  transactionId: string;  

  @IsOptional()
  @IsString()
  eventName?: string;

  @IsOptional()
  @IsString()
  attendeeName?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  eventDate?: string;

  @IsOptional()
  @IsString()
  branchName?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ticketCount?: number;

  @IsOptional() 
  @Type(() => Number)
  @IsNumber()
  totalAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  revenueAmount?: number;

  @IsOptional()
  @IsBoolean()
  isValid?: boolean;
}
