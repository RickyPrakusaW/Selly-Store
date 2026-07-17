import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { pageMeta } from '../../common/dto/pagination.dto';
import {
  CreateStaffDto,
  StaffQueryDto,
  UpdateAdminProfileDto,
  UpdateStaffDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  profile(id: string) {
    return this.prisma.user.findFirst({
      where: { id, role: { not: UserRole.CUSTOMER }, deletedAt: null },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async updateProfile(id: string, dto: UpdateAdminProfileDto) {
    await this.prisma.user.update({ where: { id }, data: dto });
    return this.profile(id);
  }

  async listStaff(query: StaffQueryDto) {
    const where = { role: { not: UserRole.CUSTOMER }, deletedAt: null };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data, meta: pageMeta(query.page, query.limit, total) };
  }

  async createStaff(dto: CreateStaffDto) {
    if (await this.prisma.user.findUnique({ where: { email: dto.email } }))
      throw new ConflictException('Email is already registered');
    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: await bcrypt.hash(dto.password, 12),
        fullName: dto.fullName,
        role: dto.role,
        isVerified: true,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async updateStaff(id: string, dto: UpdateStaffDto) {
    const staff = await this.prisma.user.findFirst({
      where: { id, role: { not: UserRole.CUSTOMER }, deletedAt: null },
    });
    if (!staff) throw new NotFoundException('Staff user not found');
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });
  }

  async deleteStaff(actorId: string, id: string) {
    if (actorId === id)
      throw new ForbiddenException('You cannot delete your own account');
    const result = await this.prisma.user.updateMany({
      where: { id, role: { not: UserRole.CUSTOMER }, deletedAt: null },
      data: { deletedAt: new Date(), isActive: false },
    });
    if (!result.count) throw new NotFoundException('Staff user not found');
    return { message: 'Staff user deleted', data: null };
  }
}
