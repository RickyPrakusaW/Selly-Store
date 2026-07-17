import { IsDateString, IsIn, IsOptional } from 'class-validator';

export class ReportRangeDto {
  @IsDateString({ strict: true }) from!: string;
  @IsDateString({ strict: true }) to!: string;
  @IsOptional() @IsIn(['daily', 'monthly']) type?: 'daily' | 'monthly';
}

export class ExportReportDto {
  @IsDateString({ strict: true }) from!: string;
  @IsDateString({ strict: true }) to!: string;
  @IsIn(['profit_loss']) type!: 'profit_loss';
}
