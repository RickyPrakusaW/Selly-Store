import { ReportsService } from './reports.service';
import type { PrismaService } from '../../prisma/prisma.service';

describe('ReportsService', () => {
  const prisma = {
    order: { findMany: jest.fn().mockResolvedValue([]) },
    expense: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: null } }),
    },
    capitalInjection: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: null } }),
    },
  } as unknown as PrismaService;

  it('creates a valid XLSX archive', async () => {
    const service = new ReportsService(prisma);
    const output = await service.export({
      from: '2026-01-01',
      to: '2026-01-31',
    });
    expect(output.subarray(0, 2).toString()).toBe('PK');
    expect(output.length).toBeGreaterThan(1000);
  });
});
