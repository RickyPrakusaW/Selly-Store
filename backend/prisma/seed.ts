import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  for (const category of [
    { slug: 'bunga', name: 'Bunga' },
    { slug: 'kado', name: 'Kado' },
    { slug: 'papan_ucapan', name: 'Papan Ucapan' },
  ]) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, isActive: true, deletedAt: null },
      create: category,
    });
  }

  const boardCount = Number(process.env.SEED_BOARD_COUNT ?? 3);
  for (let index = 1; index <= boardCount; index += 1) {
    const boardName = `Papan ${index}`;
    await prisma.boardInventory.upsert({
      where: { boardName },
      update: { isActive: true, deletedAt: null },
      create: { boardName },
    });
  }

  const ownerEmail = process.env.SEED_OWNER_EMAIL?.trim().toLowerCase();
  const ownerPassword = process.env.SEED_OWNER_PASSWORD;
  if (ownerEmail && ownerPassword) {
    if (ownerPassword.length < 12) throw new Error('SEED_OWNER_PASSWORD must be at least 12 characters');
    await prisma.user.upsert({
      where: { email: ownerEmail },
      update: { role: UserRole.OWNER, isActive: true, isVerified: true, deletedAt: null },
      create: {
        email: ownerEmail,
        passwordHash: await bcrypt.hash(ownerPassword, 12),
        role: UserRole.OWNER,
        fullName: process.env.SEED_OWNER_NAME ?? 'Seli Florist Owner',
        isVerified: true,
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
