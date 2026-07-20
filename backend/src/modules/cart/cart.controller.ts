import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUser } from '../../common/guards/jwt-user.interface';
import { StubEntityDto, StubListDto, stubEntity, stubList } from '../../common/dto/api-contract.dto';
import { CartService } from './cart.service';
import { AddCartItemDto, SyncCartDto, UpdateCartItemDto } from './dto/cart.dto';

@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current customer cart scaffold' })
  @ApiOkResponse({ type: StubListDto })
  get(@CurrentUser() _user: JwtUser): StubListDto {
    return stubList();
  }
  @Post('items')
  @ApiOperation({ summary: 'Add cart item scaffold' })
  @ApiCreatedResponse({ type: StubEntityDto })
  add(
    @CurrentUser() _user: JwtUser,
    @Body() _dto: AddCartItemDto,
  ): StubEntityDto {
    return stubEntity();
  }
  @Put('items/:id') update(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cart.update(user.id, id, dto);
  }
  @Delete('items/:id')
  @ApiOperation({ summary: 'Delete cart item scaffold' })
  @ApiNoContentResponse()
  remove(
    @CurrentUser() _user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): StubEntityDto {
    return stubEntity(id);
  }
  @Delete() clear(@CurrentUser() user: JwtUser) {
    return this.cart.clear(user.id);
  }
  @Post('sync') sync(@CurrentUser() user: JwtUser, @Body() dto: SyncCartDto) {
    return this.cart.sync(user.id, dto);
  }
}
