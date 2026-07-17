import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ImageUploadPipe } from '../../common/storage/image-upload.pipe';
import type { UploadedImage } from '../../common/storage/image-upload.pipe';
import { CatalogService } from './catalog.service';
import {
  CatalogQueryDto,
  CreateCategoryDto,
  CreateProductDto,
  ImageMetadataDto,
  UpdateCategoryDto,
  UpdateProductDto,
  UpdateStockDto,
} from './dto/catalog.dto';

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Public() @Get('categories') categories() {
    return this.catalog.listCategories();
  }
  @Public() @Get('products') products(@Query() query: CatalogQueryDto) {
    return this.catalog.listProducts(query);
  }
  @Public() @Get('products/:id') product(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.catalog.getProduct(id);
  }

  @Roles(UserRole.OWNER)
  @Post('admin/categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.catalog.createCategory(dto);
  }

  @Roles(UserRole.OWNER)
  @Put('admin/categories/:id')
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.catalog.updateCategory(id, dto);
  }

  @Roles(UserRole.OWNER)
  @Delete('admin/categories/:id')
  deleteCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.deleteCategory(id);
  }

  @Roles(UserRole.OWNER)
  @Post('admin/products')
  create(@Body() dto: CreateProductDto) {
    return this.catalog.createProduct(dto);
  }

  @Roles(UserRole.OWNER)
  @Put('admin/products/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.catalog.updateProduct(id, dto);
  }

  @Roles(UserRole.OWNER)
  @Put('admin/products/:id/stock')
  stock(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStockDto) {
    return this.catalog.updateStock(id, dto);
  }

  @Roles(UserRole.OWNER)
  @Delete('admin/products/:id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.deleteProduct(id);
  }

  @Roles(UserRole.OWNER)
  @Post('admin/products/:id/images')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 2 * 1024 * 1024, files: 1 },
    }),
  )
  image(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(ImageUploadPipe) file: UploadedImage,
    @Body() metadata: ImageMetadataDto,
  ) {
    return this.catalog.addImage(id, file, metadata);
  }

  @Roles(UserRole.OWNER)
  @Delete('admin/products/:id/images/:imageId')
  deleteImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ) {
    return this.catalog.deleteImage(id, imageId);
  }
}
