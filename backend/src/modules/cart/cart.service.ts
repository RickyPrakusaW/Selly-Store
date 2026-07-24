import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AddCartItemDto, SyncCartDto, UpdateCartItemDto } from './dto/cart.dto';

const BOARD_CATEGORY = 'papan_ucapan';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  get(userId: string) {
    return this.prisma.cartItem.findMany({
      where: { userId, product: { deletedAt: null, isActive: true } },
      orderBy: { addedAt: 'asc' },
      include: {
        product: {
          include: {
            category: true,
            images: { where: { deletedAt: null, isPrimary: true }, take: 1 },
          },
        },
        variant: true,
      },
    });
  }

  async add(userId: string, dto: AddCartItemDto) {
    const normalized = await this.validateItem(dto);
    try {
      const existing = await this.prisma.cartItem.findFirst({
        where: {
          userId,
          productId: dto.productId,
          variantId: dto.variantId ?? null,
          bookingDate: normalized.bookingDate,
          bookingEndDate: normalized.bookingEndDate,
        },
      });
      if (existing) {
        await this.prisma.cartItem.update({
          where: { id: existing.id },
          data: {
            qty: existing.qty + dto.qty,
            customNote: dto.customNote ?? existing.customNote,
          },
        });
      } else {
        await this.prisma.cartItem.create({ data: { userId, ...normalized } });
      }
      return this.get(userId);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'The same cart item was modified concurrently; retry the request',
        );
      }
      throw error;
    }
  }

  async update(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, userId },
      include: { product: { include: { category: true } } },
    });
    if (!item) throw new NotFoundException('Item keranjang tidak ditemukan');
    let bookingDate = item.bookingDate;
    let bookingEndDate = item.bookingEndDate;
    if (dto.bookingDate) bookingDate = this.parseFutureDate(dto.bookingDate);
    if (dto.bookingEndDate)
      bookingEndDate = this.parseFutureDate(dto.bookingEndDate);
    if (bookingDate && !bookingEndDate)
      bookingEndDate = this.nextDate(bookingDate);
    if (bookingDate && bookingEndDate && bookingEndDate <= bookingDate)
      throw new BadRequestException(
        'Tanggal selesai sewa harus setelah tanggal mulai sewa',
      );
    if (item.product.category.slug === BOARD_CATEGORY && !bookingDate)
      throw new BadRequestException(
        'Tanggal sewa (bookingDate) wajib diisi untuk produk papan ucapan',
      );
    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: {
        qty: dto.qty,
        customNote: dto.customNote,
        bookingDate,
        bookingEndDate,
      },
    });
    return this.get(userId);
  }

  async remove(userId: string, itemId: string) {
    const deleted = await this.prisma.cartItem.deleteMany({
      where: { id: itemId, userId },
    });
    if (!deleted.count) throw new NotFoundException('Item keranjang tidak ditemukan');
    return this.get(userId);
  }

  async clear(userId: string) {
    await this.prisma.cartItem.deleteMany({ where: { userId } });
    return this.get(userId);
  }

  async sync(userId: string, dto: SyncCartDto) {
    for (const item of dto.items) {
      await this.add(userId, item);
    }
    return this.get(userId);
  }

  private async validateItem(dto: AddCartItemDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, deletedAt: null, isActive: true },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('Produk tidak ditemukan');
    if (dto.variantId) {
      const variant = await this.prisma.productVariant.findFirst({
        where: { id: dto.variantId, productId: dto.productId, deletedAt: null },
      });
      if (!variant)
        throw new BadRequestException(
          'Varian produk tidak sesuai dengan produk yang dipilih',
        );
    }
    if (product.category.slug === BOARD_CATEGORY && !dto.bookingDate)
      throw new BadRequestException(
        'Tanggal sewa (bookingDate) wajib diisi untuk produk papan ucapan',
      );
    if (
      product.category.slug !== BOARD_CATEGORY &&
      (dto.bookingDate || dto.bookingEndDate)
    )
      throw new BadRequestException(
        'Tanggal sewa hanya berlaku untuk produk papan ucapan',
      );
    const bookingDate = dto.bookingDate
      ? this.parseFutureDate(dto.bookingDate)
      : null;
    const bookingEndDate = bookingDate
      ? dto.bookingEndDate
        ? this.parseFutureDate(dto.bookingEndDate)
        : this.nextDate(bookingDate)
      : null;
    if (bookingDate && bookingEndDate && bookingEndDate <= bookingDate)
      throw new BadRequestException(
        'Tanggal selesai sewa harus setelah tanggal mulai sewa',
      );
    return {
      productId: dto.productId,
      variantId: dto.variantId ?? null,
      qty: dto.qty,
      customNote: dto.customNote,
      bookingDate,
      bookingEndDate,
    };
  }

  private parseFutureDate(value: string): Date {
    const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
    const today = new Date();
    const todayUtc = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    );
    if (Number.isNaN(date.valueOf()) || date < todayUtc)
      throw new BadRequestException('Tanggal sewa tidak boleh di masa lalu');
    return date;
  }

  private nextDate(value: Date): Date {
    const result = new Date(value);
    result.setUTCDate(result.getUTCDate() + 1);
    return result;
  }
}
