import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';
import { resolve } from 'path';
import { Public } from '../decorators/public.decorator';
import { Roles } from '../decorators/roles.decorator';

function validName(name: string): string {
  if (!/^[0-9a-f-]{36}\.(jpg|png)$/.test(name))
    throw new NotFoundException('File not found');
  return name;
}

@Controller('files/product-images')
export class PublicFilesController {
  @Public()
  @Get(':name')
  get(@Param('name') name: string, @Res() response: Response) {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    return response.sendFile(validName(name), {
      root: resolve(process.cwd(), 'uploads', 'product-images'),
    });
  }
}

@Roles(UserRole.OWNER, UserRole.FINANCE, UserRole.STAFF_VERIFICATION)
@Controller('files/payment-proofs')
export class ProtectedFilesController {
  @Get(':name')
  get(@Param('name') name: string, @Res() response: Response) {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cache-Control', 'private, no-store');
    return response.sendFile(validName(name), {
      root: resolve(process.cwd(), 'uploads', 'payment-proofs'),
    });
  }
}
