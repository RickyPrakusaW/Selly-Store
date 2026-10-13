import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return base || `product-${Date.now()}`;
}

async function main() {
  const products = await prisma.product.findMany({
    where: { slug: null },
  });

  console.log(`Found ${products.length} products with null slug.`);

  for (const product of products) {
    const baseSlug = generateSlug(product.name);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await prisma.product.findFirst({
        where: { slug, id: { not: product.id } },
      });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { slug },
    });

    console.log(
      `Updated product "${product.name}" (${product.id}) with slug "${slug}"`,
    );
  }
}

main()
  .then(() => console.log('Successfully updated all null slugs!'))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
