import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBoardDto, UpdateBoardDto } from './booking.dto';

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}

  async calendar(month: string) {
    const [year, monthNumber] = month.split('-').map(Number);
    const from = new Date(Date.UTC(year, monthNumber - 1, 1));
    const to = new Date(Date.UTC(year, monthNumber, 1));
    const boards = await this.prisma.boardInventory.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { boardName: 'asc' },
      include: {
        bookings: {
          where: {
            bookingStart: { lt: to },
            bookingEnd: { gt: from },
            status: {
              in: [BookingStatus.SOFT_LOCKED, BookingStatus.CONFIRMED],
            },
          },
          select: { bookingStart: true, bookingEnd: true, status: true },
        },
      },
    });
    return boards;
  }

  async availability(dateValue: string) {
    const date = new Date(`${dateValue.slice(0, 10)}T00:00:00.000Z`);
    const nextDate = new Date(date);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    const [totalBoards, booked] = await this.prisma.$transaction([
      this.prisma.boardInventory.count({
        where: { isActive: true, deletedAt: null },
      }),
      this.prisma.boardBooking.count({
        where: {
          bookingStart: { lt: nextDate },
          bookingEnd: { gt: date },
          status: { in: [BookingStatus.SOFT_LOCKED, BookingStatus.CONFIRMED] },
          board: { isActive: true, deletedAt: null },
        },
      }),
    ]);
    return {
      date: dateValue,
      available: totalBoards > booked,
      availableBoards: Math.max(0, totalBoards - booked),
    };
  }

  listBoards() {
    return this.prisma.boardInventory.findMany({
      where: { deletedAt: null },
      orderBy: { boardName: 'asc' },
    });
  }

  createBoard(dto: CreateBoardDto) {
    return this.prisma.boardInventory.create({ data: dto });
  }

  async updateBoard(id: string, dto: UpdateBoardDto) {
    const board = await this.prisma.boardInventory.findFirst({
      where: { id, deletedAt: null },
    });
    if (!board) throw new NotFoundException('Unit papan ucapan tidak ditemukan');
    return this.prisma.boardInventory.update({ where: { id }, data: dto });
  }

  async deleteBoard(id: string) {
    const active = await this.prisma.boardBooking.count({
      where: {
        boardId: id,
        status: { in: [BookingStatus.SOFT_LOCKED, BookingStatus.CONFIRMED] },
      },
    });
    if (active) throw new ConflictException('Unit papan ucapan masih memiliki jadwal sewa aktif');
    const result = await this.prisma.boardInventory.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date(), isActive: false },
    });
    if (!result.count) throw new NotFoundException('Unit papan ucapan tidak ditemukan');
    return { message: 'Unit papan ucapan berhasil dihapus', data: null };
  }
}
