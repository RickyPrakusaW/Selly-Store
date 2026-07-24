const { unlink } = require('node:fs/promises');
const { resolve } = require('node:path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: { name: { startsWith: 'QA ' } },
    select: {
      id: true,
      images: { select: { imageUrl: true } },
    },
  });
  const productIds = products.map((product) => product.id);
  const orders = productIds.length
    ? await prisma.order.findMany({
        where: { items: { some: { productId: { in: productIds } } } },
        select: {
          id: true,
          paymentProofs: { select: { storageKey: true } },
        },
      })
    : [];
  const orderIds = orders.map((order) => order.id);

  await prisma.$transaction(async (tx) => {
    if (orderIds.length) {
      await tx.boardBooking.deleteMany({ where: { orderId: { in: orderIds } } });
      await tx.order.deleteMany({ where: { id: { in: orderIds } } });
    }
    if (productIds.length) {
      await tx.cartItem.deleteMany({ where: { productId: { in: productIds } } });
      await tx.productCost.deleteMany({ where: { productId: { in: productIds } } });
      await tx.product.deleteMany({ where: { id: { in: productIds } } });
    }
    await tx.capitalInjection.deleteMany({
      where: { source: { startsWith: 'QA Otomatis ' } },
    });
    await tx.expense.deleteMany({
      where: { description: { startsWith: 'QA Otomatis ' } },
    });
  });

  const files = [
    ...products.flatMap((product) =>
      product.images.map((image) =>
        image.imageUrl.replace(/^\/api\/files\//, ''),
      ),
    ),
    ...orders.flatMap((order) =>
      order.paymentProofs.map((proof) => proof.storageKey),
    ),
  ];
  await Promise.all(
    files.map((file) =>
      unlink(resolve(process.cwd(), 'uploads', file)).catch(() => undefined),
    ),
  );
  console.log(
    JSON.stringify({
      removedProducts: productIds.length,
      removedOrders: orderIds.length,
      removedFiles: files.length,
    }),
  );
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
