import { normalizeFileUrl, storageKeyFromUrl } from './storage.service';

describe('normalizeFileUrl', () => {
  it('converts an absolute backend file URL to a relative API path', () => {
    expect(
      normalizeFileUrl(
        'http://localhost:3000/api/files/product-images/product_123.png',
      ),
    ).toBe('/api/files/product-images/product_123.png');
  });

  it('keeps an existing relative file URL unchanged', () => {
    expect(normalizeFileUrl('/api/files/product-images/product_123.webp')).toBe(
      '/api/files/product-images/product_123.webp',
    );
  });

  it('does not rewrite external catalog image URLs', () => {
    const externalUrl = 'https://images.unsplash.com/photo-123?w=900';
    expect(normalizeFileUrl(externalUrl)).toBe(externalUrl);
  });
});

describe('storageKeyFromUrl', () => {
  it('extracts a product image key from relative and legacy absolute URLs', () => {
    const key =
      'product-images/product-name_12345678-1234-1234-1234-123456789abc.png';
    expect(storageKeyFromUrl(`/api/files/${key}`)).toBe(key);
    expect(storageKeyFromUrl(`http://localhost:3000/api/files/${key}`)).toBe(
      key,
    );
  });

  it('rejects external URLs and paths outside managed upload folders', () => {
    expect(
      storageKeyFromUrl('https://images.unsplash.com/photo-123'),
    ).toBeNull();
    expect(storageKeyFromUrl('/api/files/../../secret.txt')).toBeNull();
  });
});
