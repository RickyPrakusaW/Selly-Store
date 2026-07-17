import { Controller, Get, Query, Res } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { ExportReportDto, ReportRangeDto } from './reports.dto';
import { ReportsService } from './reports.service';

@Roles(UserRole.OWNER, UserRole.FINANCE)
@Controller('admin/reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}
  @Get('summary') summary(@Query() query: ReportRangeDto) {
    return this.reports.summary(query);
  }
  @Get('chart-data') chart(@Query() query: ReportRangeDto) {
    return this.reports.chart(query);
  }

  @Get('export')
  async export(@Query() query: ExportReportDto, @Res() response: Response) {
    const file = await this.reports.export({ from: query.from, to: query.to });
    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="seli-florist-${query.from}-${query.to}.xlsx"`,
    );
    response.send(file);
  }
}
