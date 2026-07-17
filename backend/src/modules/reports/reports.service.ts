import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import ExcelJS from 'exceljs';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportRangeDto } from './reports.dto';

const REVENUE_STATUSES = [
  OrderStatus.FULLY_PAID,
  OrderStatus.PROCESSING,
  OrderStatus.COMPLETED,
];

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(query: ReportRangeDto) {
    const { from, to } = this.range(query);
    const [orders, expenses, capital] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          status: { in: REVENUE_STATUSES },
          createdAt: { gte: from, lt: to },
        },
        select: {
          total: true,
          ongkirFee: true,
          createdAt: true,
          items: { select: { qty: true, costPriceSnapshot: true } },
        },
      }),
      this.prisma.expense.aggregate({
        where: { deletedAt: null, expenseDate: { gte: from, lt: to } },
        _sum: { amount: true },
      }),
      this.prisma.capitalInjection.aggregate({
        where: { injectedAt: { gte: from, lt: to } },
        _sum: { amount: true },
      }),
    ]);
    const grossRevenue = orders.reduce(
      (sum, order) => sum.add(order.total),
      new Prisma.Decimal(0),
    );
    const ongkirCollected = orders.reduce(
      (sum, order) => sum.add(order.ongkirFee),
      new Prisma.Decimal(0),
    );
    const totalHpp = orders.reduce(
      (sum, order) =>
        sum.add(
          order.items.reduce(
            (inner, item) => inner.add(item.costPriceSnapshot.mul(item.qty)),
            new Prisma.Decimal(0),
          ),
        ),
      new Prisma.Decimal(0),
    );
    const grossProfit = grossRevenue.sub(totalHpp);
    const totalExpenses = expenses._sum.amount ?? new Prisma.Decimal(0);
    return {
      grossRevenue,
      productRevenue: grossRevenue.sub(ongkirCollected),
      ongkirCollected,
      totalHpp,
      grossProfit,
      totalExpenses,
      netProfit: grossProfit.sub(totalExpenses),
      capitalInjections: capital._sum.amount ?? new Prisma.Decimal(0),
      orderCount: orders.length,
    };
  }

  async chart(query: ReportRangeDto) {
    const { from, to } = this.range(query);
    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: REVENUE_STATUSES },
        createdAt: { gte: from, lt: to },
      },
      select: {
        total: true,
        createdAt: true,
        items: { select: { qty: true, costPriceSnapshot: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    const groups = new Map<
      string,
      { revenue: Prisma.Decimal; hpp: Prisma.Decimal; orders: number }
    >();
    for (const order of orders) {
      const iso = order.createdAt.toISOString();
      const key = query.type === 'monthly' ? iso.slice(0, 7) : iso.slice(0, 10);
      const current = groups.get(key) ?? {
        revenue: new Prisma.Decimal(0),
        hpp: new Prisma.Decimal(0),
        orders: 0,
      };
      current.revenue = current.revenue.add(order.total);
      current.hpp = current.hpp.add(
        order.items.reduce(
          (sum, item) => sum.add(item.costPriceSnapshot.mul(item.qty)),
          new Prisma.Decimal(0),
        ),
      );
      current.orders += 1;
      groups.set(key, current);
    }
    return Array.from(groups.entries()).map(([period, value]) => ({
      period,
      ...value,
      grossProfit: value.revenue.sub(value.hpp),
    }));
  }

  async export(query: ReportRangeDto): Promise<Buffer> {
    const report = await this.summary(query);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Seli Florist API';
    const sheet = workbook.addWorksheet('Profit and Loss');
    sheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Amount (IDR)', key: 'amount', width: 22 },
    ];
    for (const [metric, value] of Object.entries(report)) {
      sheet.addRow({
        metric,
        amount: value instanceof Prisma.Decimal ? value.toNumber() : value,
      });
    }
    sheet.getRow(1).font = { bold: true };
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private range(query: ReportRangeDto) {
    const from = new Date(`${query.from.slice(0, 10)}T00:00:00.000Z`);
    const toDate = new Date(`${query.to.slice(0, 10)}T00:00:00.000Z`);
    if (from > toDate)
      throw new BadRequestException('from must not be after to');
    const to = new Date(toDate.getTime() + 24 * 60 * 60 * 1000);
    return { from, to };
  }
}
