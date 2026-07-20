import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, Matches } from 'class-validator';

export class RentalCalendarQueryDto {
  @ApiProperty({ example: '2026-07', pattern: '^\\d{4}-(0[1-9]|1[0-2])$' })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  month!: string;
}

export class RentalAvailabilityQueryDto {
  @ApiProperty({ example: '2026-07-24', format: 'date' })
  @IsDateString({ strict: true })
  date!: string;
}

export class RentalAvailabilityStubDto {
  @ApiProperty({ example: '2026-07-24' }) date!: string;
  @ApiProperty({ example: true }) available!: boolean;
  @ApiProperty({ example: 0 }) availableUnits!: number;
}
