import { PrismaClient, StockType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Seli Florist database seeding...');

  // 1. Categories
  const categoriesData = [
    { slug: 'bunga', name: 'Bunga', description: 'Rangkaian bunga segar, bouquet mawar, tulip, & bunga meja' },
    { slug: 'kado', name: 'Kado', description: 'Hampers eksklusif, boneka, cokelat, & preserved rose' },
    { slug: 'papan_ucapan', name: 'Papan Ucapan', description: 'Sewa papan ucapan duka cita, happy wedding, & grand opening' },
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, isActive: true, deletedAt: null },
      create: cat,
    });
    categoryMap.set(cat.slug, created.id);
  }
  console.log('✅ Categories seeded');

  // 2. Physical Boards Inventory
  const boardNames = ['Papan 1', 'Papan 2', 'Papan 3', 'Papan 4', 'Papan 5'];
  for (const boardName of boardNames) {
    await prisma.boardInventory.upsert({
      where: { boardName },
      update: { isActive: true, deletedAt: null },
      create: { boardName, boardType: 'Ukuran Standar 2x1.2m' },
    });
  }
  console.log('✅ Physical Board Inventories seeded');

  // 3. Products Data
  const products = [
    // --- BUNGA ---
    {
      categorySlug: 'bunga',
      name: 'Bucket Mawar Merah Passionate',
      description: 'Buketan 20 tangkai mawar merah segar kualitas super dengan wrapper kain spons merah muda elegan.',
      basePrice: 250000,
      stockType: StockType.READY_STOCK,
      stockQty: 15,
      imageUrl: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600&auto=format&fit=crop&q=80',
      variants: [
        { name: 'Ukuran Small (10 Tangkai)', priceDelta: 0 },
        { name: 'Ukuran Medium (20 Tangkai)', priceDelta: 50000 },
        { name: 'Ukuran Large (30 Tangkai)', priceDelta: 100000 },
      ],
    },
    {
      categorySlug: 'bunga',
      name: 'Bouquet Tulip Pastel Spring',
      description: 'Rangkaian tulip pastel import segar dipadukan dengan bunga baby breath impian.',
      basePrice: 380000,
      stockType: StockType.READY_STOCK,
      stockQty: 10,
      imageUrl: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=600&auto=format&fit=crop&q=80',
      variants: [
        { name: 'Single Color (Soft Pink)', priceDelta: 0 },
        { name: 'Mixed Pastels (Pink, Yellow, White)', priceDelta: 30000 },
      ],
    },
    {
      categorySlug: 'bunga',
      name: 'Rangkaian Lily Putih Premium',
      description: 'Bunga meja lily putih harum mewah di vas kaca cantik, cocok untuk ucapan selamat atau dekorasi.',
      basePrice: 450000,
      stockType: StockType.READY_STOCK,
      stockQty: 8,
      imageUrl: 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=600&auto=format&fit=crop&q=80',
      variants: [],
    },
    {
      categorySlug: 'bunga',
      name: 'Bunga Meja Hydrangea & Sunflower',
      description: 'Kombinasi bunga matahari segar dan hydrangea biru memberikan suasana segar dan hangat.',
      basePrice: 320000,
      stockType: StockType.READY_STOCK,
      stockQty: 12,
      imageUrl: 'https://images.unsplash.com/photo-1591886960571-74d43a9d4166?w=600&auto=format&fit=crop&q=80',
      variants: [],
    },

    // --- KADO ---
    {
      categorySlug: 'kado',
      name: 'Hampers Bunga & Boneka Teddy Bear',
      description: 'Hadiah manis berisi buket mawar mini, boneka teddy bear lembut 30cm, dan pita satin pink.',
      basePrice: 299000,
      stockType: StockType.READY_STOCK,
      stockQty: 20,
      imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80',
      variants: [
        { name: 'Teddy Bear Cokelat', priceDelta: 0 },
        { name: 'Teddy Bear Cream', priceDelta: 0 },
        { name: 'Dengan Kartu Ucapan Custom', priceDelta: 15000 },
      ],
    },
    {
      categorySlug: 'kado',
      name: 'Gift Box Bunga & Cokelat Ferrero',
      description: 'Kotak hadiah eksklusif berisi 16 butir cokelat Ferrero Rocher dan mawar segar berkualitas tinggi.',
      basePrice: 350000,
      stockType: StockType.READY_STOCK,
      stockQty: 15,
      imageUrl: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=600&auto=format&fit=crop&q=80',
      variants: [],
    },
    {
      categorySlug: 'kado',
      name: 'Kotak Perhiasan Bunga Abadi (Preserved Rose)',
      description: 'Mawar asli yang diawetkan bertahan hingga 3 tahun dalam kubus kaca mewah dengan laci perhiasan.',
      basePrice: 550000,
      stockType: StockType.READY_STOCK,
      stockQty: 5,
      imageUrl: 'https://images.unsplash.com/photo-1533616688419-b7a585564566?w=600&auto=format&fit=crop&q=80',
      variants: [],
    },

    // --- PAPAN UCAPAN ---
    {
      categorySlug: 'papan_ucapan',
      name: 'Papan Bunga Duka Cita Elegance 2x1.2m',
      description: 'Papan ucapan duka cita dengan latar warna teduh dan rangkaian bunga mahkota atas & bawah.',
      basePrice: 650000,
      stockType: StockType.PRE_ORDER,
      stockQty: 0,
      poDays: 1,
      imageUrl: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=600&auto=format&fit=crop&q=80',
      variants: [
        { name: 'Ukuran Standar 2x1.2m', priceDelta: 0 },
        { name: 'Ukuran Jumbo 2x1.5m (Bunga Keliling)', priceDelta: 200000 },
      ],
    },
    {
      categorySlug: 'papan_ucapan',
      name: 'Papan Bunga Grand Opening Luxury 2x1.5m',
      description: 'Papan ucapan selamat & sukses usaha baru dengan kombinasi bunga segar cerah warna merah dan kuning.',
      basePrice: 850000,
      stockType: StockType.PRE_ORDER,
      stockQty: 0,
      poDays: 1,
      imageUrl: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=600&auto=format&fit=crop&q=80',
      variants: [],
    },
    {
      categorySlug: 'papan_ucapan',
      name: 'Papan Bunga Happy Wedding Romantic 2x1.5m',
      description: 'Papan ucapan pernikahan nuansa pink dan putih romantis dengan ucapan kustom nama pengantin.',
      basePrice: 750000,
      stockType: StockType.PRE_ORDER,
      stockQty: 0,
      poDays: 1,
      imageUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&auto=format&fit=crop&q=80',
      variants: [],
    },
  ];

  for (const item of products) {
    const categoryId = categoryMap.get(item.categorySlug);
    if (!categoryId) continue;

    // Create or find product
    const existingProduct = await prisma.product.findFirst({
      where: { name: item.name, categoryId },
    });

    let productId = existingProduct?.id;

    if (!existingProduct) {
      const createdProduct = await prisma.product.create({
        data: {
          categoryId,
          name: item.name,
          description: item.description,
          basePrice: item.basePrice,
          stockType: item.stockType,
          stockQty: item.stockQty,
          poDays: item.poDays ?? null,
        },
      });
      productId = createdProduct.id;
    } else {
      await prisma.product.update({
        where: { id: productId },
        data: {
          description: item.description,
          basePrice: item.basePrice,
          stockType: item.stockType,
          stockQty: item.stockQty,
          poDays: item.poDays ?? null,
          isActive: true,
          deletedAt: null,
        },
      });
    }

    // Product Primary Image
    const existingImage = await prisma.productImage.findFirst({
      where: { productId, isPrimary: true },
    });

    if (!existingImage) {
      await prisma.productImage.create({
        data: {
          productId: productId!,
          imageUrl: item.imageUrl,
          isPrimary: true,
          sortOrder: 0,
        },
      });
    }

    // Variants
    for (const v of item.variants) {
      const existingVariant = await prisma.productVariant.findFirst({
        where: { productId, variantName: v.name },
      });
      if (!existingVariant) {
        await prisma.productVariant.create({
          data: {
            productId: productId!,
            variantName: v.name,
            priceDelta: v.priceDelta,
          },
        });
      }
    }
  }
  console.log('✅ Products, Images, & Variants seeded');

  // 4. Users (Owner & Dummy Customers)
  const defaultPasswordHash = await bcrypt.hash('PasswordKuat123', 12);

  const ownerEmail = process.env.SEED_OWNER_EMAIL?.trim().toLowerCase() || 'rickyprakusa281@gmail.com';
  const ownerPassword = process.env.SEED_OWNER_PASSWORD || 'YourStrongPassword123';

  await prisma.user.upsert({
    where: { email: ownerEmail },
    update: { role: UserRole.OWNER, isActive: true, isVerified: true, deletedAt: null },
    create: {
      email: ownerEmail,
      passwordHash: await bcrypt.hash(ownerPassword, 12),
      role: UserRole.OWNER,
      fullName: process.env.SEED_OWNER_NAME ?? 'Seli Florist Owner',
      phoneNumber: '+628123456789',
      isVerified: true,
    },
  });

  const dummyCustomers = [
    { email: 'budi.santoso@gmail.com', fullName: 'Budi Santoso', phone: '+6281234567801' },
    { email: 'siti.aminah@gmail.com', fullName: 'Siti Aminah', phone: '+6281234567802' },
  ];

  for (const cust of dummyCustomers) {
    await prisma.user.upsert({
      where: { email: cust.email },
      update: { isVerified: true, isActive: true, deletedAt: null },
      create: {
        email: cust.email,
        passwordHash: defaultPasswordHash,
        role: UserRole.CUSTOMER,
        fullName: cust.fullName,
        phoneNumber: cust.phone,
        isVerified: true,
      },
    });
  }
  console.log('✅ Users (Owner & Dummy Customers) seeded');

  console.log('🎉 Seli Florist Database Seeding Completed Successfully!');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error('❌ Error during seeding:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
