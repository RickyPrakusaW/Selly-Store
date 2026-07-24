import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import { UploadedImage } from './image-upload.pipe';

export function normalizeFileUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname.startsWith('/api/files/') ? parsed.pathname : url;
  } catch {
    return url;
  }
}

export function storageKeyFromUrl(url: string): string | null {
  const normalized = normalizeFileUrl(url);
  const match = normalized.match(
    /^\/api\/files\/((?:payment-proofs|product-images)\/[a-z0-9][a-z0-9_-]{0,100}\.(?:jpg|jpeg|png|webp))$/i,
  );
  return match?.[1] ?? null;
}

@Injectable()
export class StorageService {
  private readonly root = resolve(process.cwd(), 'uploads');

  async store(
    file: UploadedImage,
    folder: 'payment-proofs' | 'product-images',
    prefix?: string,
  ) {
    const sanitize = (str: string) =>
      str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 30);
    const cleanPrefix = prefix ? `${sanitize(prefix)}_` : '';
    const key = `${folder}/${cleanPrefix}${randomUUID()}.${file.detectedExtension}`;
    const targetDirectory = join(this.root, folder);
    await mkdir(targetDirectory, { recursive: true });
    await writeFile(join(this.root, key), file.buffer, { flag: 'wx' });
    return {
      key,
      url: `/api/files/${key}`,
    };
  }

  async remove(key: string): Promise<void> {
    const normalized = key.replaceAll('\\', '/');
    if (
      !/^(payment-proofs|product-images)\/[a-z0-9][a-z0-9_-]{0,100}\.(jpg|jpeg|png|webp)$/i.test(
        normalized,
      )
    )
      return;
    await unlink(join(this.root, normalized)).catch(() => undefined);
  }

  async removeByUrl(url: string): Promise<void> {
    const key = storageKeyFromUrl(url);
    if (key) await this.remove(key);
  }
}
