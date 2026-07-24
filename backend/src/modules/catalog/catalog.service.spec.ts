import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';
import { CatalogService } from './catalog.service';

describe('CatalogService product cleanup', () => {
  const product = {
    id: 'product-id',
    images: [
      {
        imageUrl:
          '/api/files/product-images/product_12345678-1234-1234-1234-123456789abc.png',
      },
    ],
  };

  function setup(orderItemCount: number) {
    const prisma = {
      product: {
        findFirst: jest.fn().mockResolvedValue(product),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
      },
      orderItem: {
        count: jest.fn().mockResolvedValue(orderItemCount),
      },
      cartItem: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      productCost: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      rentalUnit: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      productImage: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      productVariant: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $transaction: jest.fn((operations: Promise<unknown>[]) =>
        Promise.all(operations),
      ),
    };
    const storage = {
      removeByUrl: jest.fn().mockResolvedValue(undefined),
    };
    const service = new CatalogService(
      prisma as unknown as PrismaService,
      storage as unknown as StorageService,
    );
    return { prisma, storage, service };
  }

  it('permanently deletes an unused product and its physical images', async () => {
    const { prisma, storage, service } = setup(0);

    await expect(service.deleteProduct(product.id)).resolves.toMatchObject({
      mode: 'deleted',
    });
    expect(prisma.product.delete).toHaveBeenCalledWith({
      where: { id: product.id },
    });
    expect(storage.removeByUrl).toHaveBeenCalledWith(
      product.images[0].imageUrl,
    );
  });

  it('archives a product with order history but removes operational data', async () => {
    const { prisma, storage, service } = setup(1);

    await expect(service.deleteProduct(product.id)).resolves.toMatchObject({
      mode: 'archived',
    });
    expect(prisma.product.delete).not.toHaveBeenCalled();
    expect(prisma.product.update).toHaveBeenCalledTimes(1);
    expect(prisma.productImage.deleteMany).toHaveBeenCalledWith({
      where: { productId: product.id },
    });
    expect(prisma.productVariant.deleteMany).toHaveBeenCalledWith({
      where: { productId: product.id, orderItems: { none: {} } },
    });
    expect(storage.removeByUrl).toHaveBeenCalledWith(
      product.images[0].imageUrl,
    );
  });
});
