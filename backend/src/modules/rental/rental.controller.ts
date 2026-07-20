import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { StubListDto, stubList } from '../../common/dto/api-contract.dto';
import { RentalAvailabilityQueryDto, RentalAvailabilityStubDto, RentalCalendarQueryDto } from './dto/rental.dto';

@ApiTags('rental')
@Controller('booking')
export class RentalController {
  @Public()
  @Get('calendar')
  @ApiOperation({ summary: 'Get rental-unit calendar scaffold' })
  @ApiOkResponse({ type: StubListDto })
  calendar(@Query() _query: RentalCalendarQueryDto): StubListDto { return stubList(); }

  @Public()
  @Get('check-availability')
  @ApiOperation({ summary: 'Check rental-unit availability scaffold' })
  @ApiOkResponse({ type: RentalAvailabilityStubDto })
  availability(@Query() query: RentalAvailabilityQueryDto): RentalAvailabilityStubDto {
    return { date: query.date, available: true, availableUnits: 0 };
  }
}
