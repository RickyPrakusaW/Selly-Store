import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import { UploadedImage } from './image-upload.pipe';

@Injectable()
export class StorageService {
  private readonly root = resolve(process.cwd(), 'uploads');

  constructor(private readonly config: ConfigService) {}

  async store(
    file: UploadedImage,
    folder: 'payment-proofs' | 'product-images',
  ) {
    const key = `${folder}/${randomUUID()}.${file.detectedExtension}`;
    const targetDirectory = join(this.root, folder);
    await mkdir(targetDirectory, { recursive: true });
    await writeFile(join(this.root, key), file.buffer, { flag: 'wx' });
    return {
      key,
      url: `${this.config.get('BASE_URL') ?? ''}/api/files/${key}`,
    };
  }

  async remove(key: string): Promise<void> {
    const normalized = key.replaceAll('\\', '/');
    if (
      !/^(payment-proofs|product-images)\/[0-9a-f-]+\.(jpg|png)$/.test(
        normalized,
      )
    )
      return;
    await unlink(join(this.root, normalized)).catch(() => undefined);
  }
}
