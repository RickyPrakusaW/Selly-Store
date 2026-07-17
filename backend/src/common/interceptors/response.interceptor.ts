import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      map((result: unknown) => {
        if (
          result &&
          typeof result === 'object' &&
          'meta' in result &&
          'data' in result
        ) {
          return { success: true, ...result };
        }
        if (
          result &&
          typeof result === 'object' &&
          'message' in result &&
          'data' in result
        ) {
          return { success: true, ...result };
        }
        return { success: true, data: result ?? null };
      }),
    );
  }
}
