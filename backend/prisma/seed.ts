import {
  PrismaClient,
  ProductMode,
  RentalUnitStatus,
  StockType,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const DUMMY_PASSWORD = 'PasswordKuat123!';

type SeedProduct = {
  slug: string;
  categorySlug: 'bunga' | 'kado' | 'papan_ucapan';
  name: string;
  description: string;
  basePrice: number;
  productMode: ProductMode;
  stockType: StockType;
  stockQty: number;
  imageUrl: string;
  variants: Array<{ name: string; priceDelta: number }>;
};

const categories = [
  {
    slug: 'bunga',
    name: 'Bunga Segar',
    description: 'Bouquet dan rangkaian bunga segar untuk berbagai momen.',
  },
  {
    slug: 'kado',
    name: 'Hampers & Kado',
    description: 'Hampers, gift box, dan hadiah bunga pilihan.',
  },
  {
    slug: 'papan_ucapan',
    name: 'Sewa Papan Ucapan',
    description: 'Papan bunga sewa dengan unit fisik yang dapat dijadwalkan.',
  },
] as const;

const products: SeedProduct[] = [
  {
    slug: 'bucket-mawar-merah-passionate',
    categorySlug: 'bunga',
    name: 'Bucket Mawar Merah Passionate',
    description:
      'Rangkaian mawar merah segar bernuansa elegan untuk menyampaikan kasih dan apresiasi.',
    basePrice: 250_000,
    productMode: ProductMode.SALE,
    stockType: StockType.READY_STOCK,
    stockQty: 15,
    imageUrl:
      'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=900&auto=format&fit=crop&q=85',
    variants: [
      { name: '10 tangkai', priceDelta: 0 },
      { name: '20 tangkai', priceDelta: 75_000 },
    ],
  },
  {
    slug: 'bouquet-tulip-pastel-spring',
    categorySlug: 'bunga',
    name: 'Bouquet Tulip Pastel Spring',
    description:
      'Bouquet tulip pastel dengan tampilan lembut dan ceria untuk hadiah istimewa.',
    basePrice: 380_000,
    productMode: ProductMode.SALE,
    stockType: StockType.PRE_ORDER,
    stockQty: 10,
    imageUrl:
      'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=900&auto=format&fit=crop&q=85',
    variants: [
      { name: 'Soft Pink', priceDelta: 0 },
      { name: 'Mixed Pastel', priceDelta: 30_000 },
    ],
  },
  {
    slug: 'rangkaian-lily-putih-premium',
    categorySlug: 'bunga',
    name: 'Rangkaian Lily Putih Premium',
    description:
      'Rangkaian lily putih premium dalam vas, cocok untuk dekorasi dan ucapan formal.',
    basePrice: 450_000,
    productMode: ProductMode.SALE,
    stockType: StockType.PRE_ORDER,
    stockQty: 8,
    imageUrl:
      'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=900&auto=format&fit=crop&q=85',
    variants: [],
  },
  {
    slug: 'hampers-bunga-boneka-teddy-bear',
    categorySlug: 'kado',
    name: 'Hampers Bunga & Boneka Teddy Bear',
    description:
      'Hampers bunga dengan boneka teddy bear lembut dan kartu ucapan personal.',
    basePrice: 299_000,
    productMode: ProductMode.SALE,
    stockType: StockType.READY_STOCK,
    stockQty: 20,
    imageUrl:
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=900&auto=format&fit=crop&q=85',
    variants: [
      { name: 'Teddy Bear Cokelat', priceDelta: 0 },
      { name: 'Teddy Bear Cream', priceDelta: 0 },
    ],
  },
  {
    slug: 'gift-box-bunga-cokelat-ferrero',
    categorySlug: 'kado',
    name: 'Gift Box Bunga & Cokelat Ferrero',
    description:
      'Gift box eksklusif berisi bunga pilihan dan cokelat Ferrero Rocher.',
    basePrice: 350_000,
    productMode: ProductMode.SALE,
    stockType: StockType.READY_STOCK,
    stockQty: 15,
    imageUrl:
      'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=900&auto=format&fit=crop&q=85',
    variants: [],
  },
  {
    slug: 'preserved-rose-box',
    categorySlug: 'kado',
    name: 'Preserved Rose Box',
    description:
      'Mawar preserved dalam kotak premium yang dirancang sebagai kenang-kenangan tahan lama.',
    basePrice: 550_000,
    productMode: ProductMode.SALE,
    stockType: StockType.READY_STOCK,
    stockQty: 5,
    imageUrl:
      'https://images.unsplash.com/photo-1533616688419-b7a585564566?w=900&auto=format&fit=crop&q=85',
    variants: [],
  },
  {
    slug: 'papan-bunga-duka-cita-elegance',
    categorySlug: 'papan_ucapan',
    name: 'Papan Bunga Duka Cita Elegance 2x1.2m',
    description:
      'Papan bunga duka cita bernuansa teduh dengan rangkaian bunga elegan ukuran 2x1.2 meter.',
    basePrice: 650_000,
    productMode: ProductMode.RENTAL,
    stockType: StockType.RENTAL_UNIT,
    stockQty: 0,
    imageUrl:
      'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=900&auto=format&fit=crop&q=85',
    variants: [],
  },
  {
    slug: 'papan-bunga-grand-opening-luxury',
    categorySlug: 'papan_ucapan',
    name: 'Papan Bunga Grand Opening Luxury 2x1.5m',
    description:
      'Papan bunga grand opening mewah dengan warna cerah ukuran 2x1.5 meter.',
    basePrice: 850_000,
    productMode: ProductMode.RENTAL,
    stockType: StockType.RENTAL_UNIT,
    stockQty: 0,
    imageUrl:
      'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=900&auto=format&fit=crop&q=85',
    variants: [],
  },
  {
    slug: 'papan-bunga-happy-wedding-romantic',
    categorySlug: 'papan_ucapan',
    name: 'Papan Bunga Happy Wedding Romantic 2x1.5m',
    description:
      'Papan bunga pernikahan romantis bernuansa merah muda dan putih ukuran 2x1.5 meter.',
    basePrice: 750_000,
    productMode: ProductMode.RENTAL,
    stockType: StockType.RENTAL_UNIT,
    stockQty: 0,
    imageUrl:
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=900&auto=format&fit=crop&q=85',
    variants: [],
  },
];

async function seedCategories(): Promise<Map<string, string>> {
  const categoryIds = new Map<string, string>();
  for (const category of categories) {
    const result = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        isActive: true,
        deletedAt: null,
      },
      create: category,
    });
    categoryIds.set(category.slug, result.id);
  }
  return categoryIds;
}

async function seedProducts(
  categoryIds: Map<string, string>,
): Promise<Map<string, string>> {
  const productIds = new Map<string, string>();
  for (const item of products) {
    const categoryId = categoryIds.get(item.categorySlug);
    if (!categoryId) throw new Error(`Missing category ${item.categorySlug}`);

    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        categoryId,
        name: item.name,
        description: item.description,
        productMode: item.productMode,
        basePrice: item.basePrice,
        stockType: item.stockType,
        stockQty: item.stockQty,
        reservedQty: 0,
        poDays: item.stockType === StockType.PRE_ORDER ? 2 : null,
        isActive: true,
        deletedAt: null,
      },
      create: {
        slug: item.slug,
        categoryId,
        name: item.name,
        description: item.description,
        productMode: item.productMode,
        basePrice: item.basePrice,
        stockType: item.stockType,
        stockQty: item.stockQty,
        poDays: item.stockType === StockType.PRE_ORDER ? 2 : null,
      },
    });
    productIds.set(item.slug, product.id);

    const primaryImage = await prisma.productImage.findFirst({
      where: { productId: product.id, isPrimary: true, deletedAt: null },
    });
    if (primaryImage) {
      await prisma.productImage.update({
        where: { id: primaryImage.id },
        data: { imageUrl: item.imageUrl, sortOrder: 0 },
      });
    } else {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          imageUrl: item.imageUrl,
          isPrimary: true,
          sortOrder: 0,
        },
      });
    }

    for (const variant of item.variants) {
      await prisma.productVariant.upsert({
        where: {
          productId_variantName: {
            productId: product.id,
            variantName: variant.name,
          },
        },
        update: { priceDelta: variant.priceDelta, deletedAt: null },
        create: {
          productId: product.id,
          variantName: variant.name,
          priceDelta: variant.priceDelta,
        },
      });
    }
  }
  return productIds;
}

async function seedRentalUnits(productIds: Map<string, string>): Promise<void> {
  const unitAssignments = [
    ['PB-001', 'papan-bunga-duka-cita-elegance'],
    ['PB-002', 'papan-bunga-duka-cita-elegance'],
    ['PB-003', 'papan-bunga-grand-opening-luxury'],
    ['PB-004', 'papan-bunga-grand-opening-luxury'],
    ['PB-005', 'papan-bunga-happy-wedding-romantic'],
  ] as const;

  for (const [unitCode, productSlug] of unitAssignments) {
    const productId = productIds.get(productSlug);
    if (!productId) throw new Error(`Missing rental product ${productSlug}`);
    await prisma.rentalUnit.upsert({
      where: { unitCode },
      update: {
        productId,
        displayName: `Papan Bunga ${unitCode}`,
        status: RentalUnitStatus.AVAILABLE,
        conditionNote: null,
        isActive: true,
      },
      create: {
        productId,
        unitCode,
        displayName: `Papan Bunga ${unitCode}`,
        status: RentalUnitStatus.AVAILABLE,
      },
    });
    await prisma.boardInventory.upsert({
      where: { boardName: unitCode },
      update: {
        boardType: 'Papan Bunga',
        isActive: true,
        deletedAt: null,
      },
      create: {
        boardName: unitCode,
        boardType: 'Papan Bunga',
      },
    });
  }
}

async function seedUsers(): Promise<void> {
  const passwordHash = await bcrypt.hash(DUMMY_PASSWORD, 12);
  const accounts = [
    {
      email: 'owner@seliflorist.com',
      fullName: 'Seli Florist Owner',
      phoneNumber: '+6281111111101',
      role: UserRole.OWNER,
    },
    {
      email: 'staff@seliflorist.com',
      fullName: 'Seli Florist Staff',
      phoneNumber: '+6281111111102',
      role: UserRole.STAFF_VERIFICATION,
    },
    {
      email: 'budi.santoso@gmail.com',
      fullName: 'Budi Santoso',
      phoneNumber: '+6281111111103',
      role: UserRole.CUSTOMER,
    },
    {
      email: 'siti.aminah@gmail.com',
      fullName: 'Siti Aminah',
      phoneNumber: '+6281111111104',
      role: UserRole.CUSTOMER,
    },
  ] as const;

  for (const account of accounts) {
    await prisma.user.upsert({
      where: { email: account.email },
      update: {
        passwordHash,
        fullName: account.fullName,
        phoneNumber: account.phoneNumber,
        role: account.role,
        isVerified: true,
        isActive: true,
        deletedAt: null,
      },
      create: {
        ...account,
        passwordHash,
        isVerified: true,
      },
    });
  }

  for (const account of accounts.slice(0, 2)) {
    await prisma.adminUser.upsert({
      where: { email: account.email },
      update: {
        passwordHash,
        fullName: account.fullName,
        role: account.role,
        isActive: true,
      },
      create: {
        email: account.email,
        passwordHash,
        fullName: account.fullName,
        role: account.role,
      },
    });
  }
}

async function main(): Promise<void> {
  console.log('Starting Seli Florist database seed...');
  const categoryIds = await seedCategories();
  const productIds = await seedProducts(categoryIds);
  await seedRentalUnits(productIds);
  await seedUsers();
  console.log(
    'Seli Florist seed completed: 3 categories, 9 products, 5 rental units, and 4 users.',
  );
}

main()
  .catch((error: unknown) => {
    console.error('Seli Florist seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
