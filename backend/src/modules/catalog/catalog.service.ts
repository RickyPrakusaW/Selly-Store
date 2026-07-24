import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, StockType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { pageMeta } from '../../common/dto/pagination.dto';
import {
  normalizeFileUrl,
  StorageService,
} from '../../common/storage/storage.service';
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
export class CatalogService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async onModuleInit() {
    try {
      // Clean up temporary dummy test entries created during visual testing
      await this.prisma.product.deleteMany({
        where: {
          name: { in: ['sdf', 'dfg', 'asdas', 'nemo', 'drtg', 'Kucing'] },
        },
      });

      const products = await this.prisma.product.findMany({
        where: { slug: null },
      });

      for (const product of products) {
        const slug = await this.ensureUniqueSlug(product.name, product.id);
        await this.prisma.product.update({
          where: { id: product.id },
          data: { slug },
        });
      }
    } catch {
      // Ignore initial auto-healing errors if DB is migrating
    }
  }


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
      throw new ConflictException('Kategori masih memiliki produk aktif');
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
        images: p.images.map((image) => ({
          ...image,
          imageUrl: normalizeFileUrl(image.imageUrl),
        })),
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
    if (!product) throw new NotFoundException('Produk tidak ditemukan');
    return {
      ...product,
      images: product.images.map((image) => ({
        ...image,
        imageUrl: normalizeFileUrl(image.imageUrl),
      })),
      availableQty: Math.max(0, product.stockQty - product.reservedQty),
    };
  }

  private generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return base || `product-${Date.now()}`;
  }

  private async ensureUniqueSlug(
    name: string,
    currentProductId?: string,
  ): Promise<string> {
    const baseSlug = this.generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.product.findFirst({
        where: {
          slug,
          ...(currentProductId ? { id: { not: currentProductId } } : {}),
        },
      });

      if (!existing) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  async createProduct(dto: CreateProductDto) {
    await this.requireCategory(dto.categoryId);
    this.validateStock(dto.stockType, dto.stockQty, dto.poDays);
    const { variants, ...product } = dto;
    const slug = await this.ensureUniqueSlug(dto.name);

    return this.prisma.product.create({
      data: {
        ...product,
        slug,
        poDays: dto.stockType === StockType.PRE_ORDER ? dto.poDays : null,
        variants: variants?.length ? { create: variants } : undefined,
      },
      include: { variants: true, category: true },
    });
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    await this.requireProduct(id);
    if (dto.categoryId) await this.requireCategory(dto.categoryId);
    const slug = dto.name
      ? await this.ensureUniqueSlug(dto.name, id)
      : undefined;
    return this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        ...(slug ? { slug } : {}),
      },
    });
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
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: { images: true },
    });
    if (!product) throw new NotFoundException('Produk tidak ditemukan');

    const orderItemCount = await this.prisma.orderItem.count({
      where: { productId: id },
    });

    if (orderItemCount > 0) {
      await this.prisma.$transaction([
        this.prisma.cartItem.deleteMany({ where: { productId: id } }),
        this.prisma.productCost.deleteMany({ where: { productId: id } }),
        this.prisma.rentalUnit.deleteMany({ where: { productId: id } }),
        this.prisma.productImage.deleteMany({ where: { productId: id } }),
        this.prisma.productVariant.deleteMany({
          where: { productId: id, orderItems: { none: {} } },
        }),
        this.prisma.product.update({
          where: { id },
          data: { deletedAt: new Date(), isActive: false },
        }),
      ]);
      await Promise.all(
        product.images.map((image) => this.storage.removeByUrl(image.imageUrl)),
      );
      return {
        mode: 'archived' as const,
        message:
          'Produk diarsipkan karena memiliki riwayat transaksi. Data operasional dan file gambar telah dibersihkan.',
      };
    }

    await this.prisma.$transaction([
      this.prisma.cartItem.deleteMany({ where: { productId: id } }),
      this.prisma.productCost.deleteMany({ where: { productId: id } }),
      this.prisma.rentalUnit.deleteMany({ where: { productId: id } }),
      this.prisma.product.delete({ where: { id } }),
    ]);
    await Promise.all(
      product.images.map((image) => this.storage.removeByUrl(image.imageUrl)),
    );
    return {
      mode: 'deleted' as const,
      message: 'Produk dan seluruh data terkait berhasil dihapus permanen.',
    };
  }

  async addImage(
    productId: string,
    file: UploadedImage,
    metadata: ImageMetadataDto,
  ) {
    const product = await this.requireProduct(productId);
    const stored = await this.storage.store(
      file,
      'product-images',
      product.name,
    );

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
    await this.prisma.productImage.delete({ where: { id: imageId } });
    await this.storage.removeByUrl(image.imageUrl);
    return { message: 'Gambar dan file fisiknya berhasil dihapus.' };
  }

  private async requireCategory(id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    if (!category) throw new NotFoundException('Kategori tidak ditemukan');
    return category;
  }

  private async requireProduct(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!product) throw new NotFoundException('Produk tidak ditemukan');
    return product;
  }

  private validateStock(type: StockType, qty: number, poDays?: number) {
    if (type === StockType.PRE_ORDER && !poDays)
      throw new BadRequestException(
        'Jumlah hari PO (poDays) wajib diisi untuk produk pre-order',
      );
    if (qty < 0)
      throw new BadRequestException('Jumlah stok tidak boleh negatif');
  }
}
