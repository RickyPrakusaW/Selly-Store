import { Injectable, NotFoundException } from '@nestjs/common';
import { BlacklistType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { pageMeta } from '../../common/dto/pagination.dto';
import { BlacklistQueryDto, CreateBlacklistDto } from './dto/blacklist.dto';

@Injectable()
export class BlacklistService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: BlacklistQueryDto) {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.blacklist.findMany({
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { blacklistedAt: 'desc' },
      }),
      this.prisma.blacklist.count(),
    ]);
    return { data, meta: pageMeta(query.page, query.limit, total) };
  }

  create(adminId: string, dto: CreateBlacklistDto) {
    const value =
      dto.type === BlacklistType.EMAIL
        ? dto.value.trim().toLowerCase()
        : dto.value.replace(/\s+/g, '');
    return this.prisma.blacklist.upsert({
      where: { type_value: { type: dto.type, value } },
      update: {
        reason: dto.reason,
        blacklistedByAdminId: adminId,
        blacklistedAt: new Date(),
      },
      create: { ...dto, value, blacklistedByAdminId: adminId },
    });
  }

  async remove(id: string) {
    const result = await this.prisma.blacklist.deleteMany({ where: { id } });
    if (!result.count) throw new NotFoundException('Blacklist entry not found');
    return { message: 'Blacklist entry removed', data: null };
  }
}
