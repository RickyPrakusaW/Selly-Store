import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StockType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { pageMeta } from '../../common/dto/pagination.dto';
import { StorageService } from '../../common/storage/storage.service';
import { UploadedImage } from '../../common/storage/image-upload.pipe';
import {
  CatalogQueryDto,
  CreateCategoryDto,
  CreateProductDto,
  ImageMetadataDto,
  UpdateCategoryDto,
  UpdateProductDto,
  UpdateStockDto,
} from './dto/catalog.dto';

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async listCategories() {
    return this.prisma.category.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  createCategory(dto: CreateCategoryDto) {
    return this.prisma.category.create({ data: dto });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    await this.requireCategory(id);
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async deleteCategory(id: string) {
    await this.requireCategory(id);
    const activeProducts = await this.prisma.product.count({
      where: { categoryId: id, deletedAt: null },
    });
    if (activeProducts)
      throw new ConflictException('Category still has active products');
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async listProducts(query: CatalogQueryDto) {
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      isActive: true,
      category: {
        deletedAt: null,
        isActive: true,
        ...(query.category ? { slug: query.category } : {}),
      },
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
          variants: { where: { deletedAt: null } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);
    return {
      data: data.map((p) => ({
        ...p,
        availableQty: Math.max(0, p.stockQty - p.reservedQty),
      })),
      meta: pageMeta(query.page, query.limit, total),
    };
  }

  async getProduct(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null, isActive: true },
      include: {
        category: true,
        images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
        variants: { where: { deletedAt: null } },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return {
      ...product,
      availableQty: Math.max(0, product.stockQty - product.reservedQty),
    };
  }

  async createProduct(dto: CreateProductDto) {
    await this.requireCategory(dto.categoryId);
    this.validateStock(dto.stockType, dto.stockQty, dto.poDays);
    const { variants, ...product } = dto;
    return this.prisma.product.create({
      data: {
        ...product,
        poDays: dto.stockType === StockType.PRE_ORDER ? dto.poDays : null,
        variants: variants?.length ? { create: variants } : undefined,
      },
      include: { variants: true, category: true },
    });
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    await this.requireProduct(id);
    if (dto.categoryId) await this.requireCategory(dto.categoryId);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async updateStock(id: string, dto: UpdateStockDto) {
    const product = await this.requireProduct(id);
    this.validateStock(dto.stockType, dto.stockQty, dto.poDays);
    if (dto.stockQty < product.reservedQty)
      throw new ConflictException('Stock cannot be below reserved quantity');
    return this.prisma.product.update({
      where: { id },
      data: {
        stockType: dto.stockType,
        stockQty: dto.stockQty,
        poDays: dto.stockType === StockType.PRE_ORDER ? dto.poDays : null,
      },
    });
  }

  async deleteProduct(id: string) {
    await this.requireProduct(id);
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async addImage(
    productId: string,
    file: UploadedImage,
    metadata: ImageMetadataDto,
  ) {
    await this.requireProduct(productId);
    const stored = await this.storage.store(file, 'product-images');
    try {
      return await this.prisma.$transaction(async (tx) => {
        if (metadata.isPrimary)
          await tx.productImage.updateMany({
            where: { productId, deletedAt: null },
            data: { isPrimary: false },
          });
        return tx.productImage.create({
          data: {
            productId,
            imageUrl: stored.url,
            isPrimary: metadata.isPrimary,
            sortOrder: metadata.sortOrder,
          },
        });
      });
    } catch (error) {
      await this.storage.remove(stored.key);
      throw error;
    }
  }

  async deleteImage(productId: string, imageId: string) {
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId, deletedAt: null },
    });
    if (!image) throw new NotFoundException('Product image not found');
    return this.prisma.productImage.update({
      where: { id: imageId },
      data: { deletedAt: new Date(), isPrimary: false },
    });
  }

  private async requireCategory(id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  private async requireProduct(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  private validateStock(type: StockType, qty: number, poDays?: number) {
    if (type === StockType.PRE_ORDER && !poDays)
      throw new BadRequestException(
        'poDays is required for pre-order products',
      );
    if (qty < 0) throw new BadRequestException('Stock cannot be negative');
  }
}
