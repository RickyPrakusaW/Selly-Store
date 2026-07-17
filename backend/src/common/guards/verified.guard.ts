import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { VERIFIED_ONLY_KEY } from '../decorators/verified-only.decorator';
import { JwtUser } from './jwt-user.interface';

@Injectable()
export class VerifiedGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<boolean>(
      VERIFIED_ONLY_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) return true;
    const user = context.switchToHttp().getRequest<{ user?: JwtUser }>().user;
    if (!user?.isVerified) {
      throw new ForbiddenException('Email verification is required');
    }
    return true;
  }
}
