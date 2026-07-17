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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUser } from '../../common/guards/jwt-user.interface';
import { CartService } from './cart.service';
import { AddCartItemDto, SyncCartDto, UpdateCartItemDto } from './dto/cart.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get() get(@CurrentUser() user: JwtUser) {
    return this.cart.get(user.id);
  }
  @Post('items') add(
    @CurrentUser() user: JwtUser,
    @Body() dto: AddCartItemDto,
  ) {
    return this.cart.add(user.id, dto);
  }
  @Put('items/:id') update(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cart.update(user.id, id, dto);
  }
  @Delete('items/:id') remove(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.cart.remove(user.id, id);
  }
  @Delete() clear(@CurrentUser() user: JwtUser) {
    return this.cart.clear(user.id);
  }
  @Post('sync') sync(@CurrentUser() user: JwtUser, @Body() dto: SyncCartDto) {
    return this.cart.sync(user.id, dto);
  }
}
