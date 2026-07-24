import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { Public } from '../decorators/public.decorator';
import { Roles } from '../decorators/roles.decorator';

function validName(name: string): string {
  if (!/^[a-z0-9][a-z0-9_-]{0,100}\.(jpg|jpeg|png|webp)$/i.test(name))
    throw new NotFoundException('File not found');
  return name;
}

@Controller('files/product-images')
export class PublicFilesController {
  @Public()
  @Get(':name')
  get(@Param('name') name: string, @Res() response: Response): void {
    const filePath = resolve(process.cwd(), 'uploads', 'product-images', validName(name));
    if (!existsSync(filePath)) {
      throw new NotFoundException('Gambar produk tidak ditemukan');
    }
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    response.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    response.sendFile(filePath);
  }
}

@Controller('files/payment-proofs')
export class ProtectedFilesController {
  @Public()
  @Get(':name')
  get(@Param('name') name: string, @Res() response: Response): void {
    const filePath = resolve(process.cwd(), 'uploads', 'payment-proofs', validName(name));
    if (!existsSync(filePath)) {
      throw new NotFoundException('Bukti pembayaran tidak ditemukan');
    }
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    response.setHeader('Cache-Control', 'private, no-store');
    response.sendFile(filePath);
  }
}
