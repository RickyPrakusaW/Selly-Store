import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { pageMeta } from '../../common/dto/pagination.dto';
import {
  CapitalInjectionDto,
  ExpenseDto,
  FinanceQueryDto,
  ProductCostDto,
} from './dto/finance.dto';

const dateOnly = (value: string) =>
  new Date(`${value.slice(0, 10)}T00:00:00.000Z`);

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  setProductCost(dto: ProductCostDto) {
    const effectiveDate = dateOnly(dto.effectiveDate);
    return this.prisma.productCost.upsert({
      where: {
        productId_effectiveDate: { productId: dto.productId, effectiveDate },
      },
      update: { costPrice: dto.costPrice },
      create: {
        productId: dto.productId,
        costPrice: dto.costPrice,
        effectiveDate,
      },
    });
  }

  async listProductCosts(query: FinanceQueryDto) {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.productCost.findMany({
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { effectiveDate: 'desc' },
        include: { product: { select: { id: true, name: true } } },
      }),
      this.prisma.productCost.count(),
    ]);
    return { data, meta: pageMeta(query.page, query.limit, total) };
  }

  createCapital(adminId: string, dto: CapitalInjectionDto) {
    return this.prisma.capitalInjection.create({
      data: {
        ...dto,
        injectedAt: dateOnly(dto.injectedAt),
        createdByAdminId: adminId,
      },
    });
  }

  async listCapital(query: FinanceQueryDto) {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.capitalInjection.findMany({
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { injectedAt: 'desc' },
      }),
      this.prisma.capitalInjection.count(),
    ]);
    return { data, meta: pageMeta(query.page, query.limit, total) };
  }

  createExpense(adminId: string, dto: ExpenseDto) {
    return this.prisma.expense.create({
      data: {
        ...dto,
        expenseDate: dateOnly(dto.expenseDate),
        createdByAdminId: adminId,
      },
    });
  }

  async listExpenses(query: FinanceQueryDto) {
    const where = { deletedAt: null };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { expenseDate: 'desc' },
      }),
      this.prisma.expense.count({ where }),
    ]);
    return { data, meta: pageMeta(query.page, query.limit, total) };
  }

  async deleteExpense(id: string) {
    const result = await this.prisma.expense.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (!result.count) throw new NotFoundException('Expense not found');
    return { message: 'Expense deleted', data: null };
  }
}
