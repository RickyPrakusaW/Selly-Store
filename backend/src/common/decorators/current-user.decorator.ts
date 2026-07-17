import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtUser } from '../guards/jwt-user.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): JwtUser =>
    context.switchToHttp().getRequest<{ user: JwtUser }>().user,
);
