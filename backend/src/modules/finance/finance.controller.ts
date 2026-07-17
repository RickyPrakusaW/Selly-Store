import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { JwtUser } from '../../common/guards/jwt-user.interface';
import {
  CapitalInjectionDto,
  ExpenseDto,
  FinanceQueryDto,
  ProductCostDto,
} from './dto/finance.dto';
import { FinanceService } from './finance.service';

@Roles(UserRole.OWNER, UserRole.FINANCE)
@Controller('admin/finance')
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}
  @Get('product-costs') costs(@Query() query: FinanceQueryDto) {
    return this.finance.listProductCosts(query);
  }
  @Post('product-costs') setCost(@Body() dto: ProductCostDto) {
    return this.finance.setProductCost(dto);
  }
  @Get('capital') capital(@Query() query: FinanceQueryDto) {
    return this.finance.listCapital(query);
  }
  @Post('capital') addCapital(
    @CurrentUser() user: JwtUser,
    @Body() dto: CapitalInjectionDto,
  ) {
    return this.finance.createCapital(user.id, dto);
  }
  @Get('expenses') expenses(@Query() query: FinanceQueryDto) {
    return this.finance.listExpenses(query);
  }
  @Post('expenses') addExpense(
    @CurrentUser() user: JwtUser,
    @Body() dto: ExpenseDto,
  ) {
    return this.finance.createExpense(user.id, dto);
  }
  @Delete('expenses/:id') deleteExpense(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.finance.deleteExpense(id);
  }
}
