import { UserRole } from '@prisma/client';

export interface JwtUser {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  verified: boolean;
  tokenType: 'access' | 'refresh';
  jti: string;
  iat?: number;
  exp?: number;
}
