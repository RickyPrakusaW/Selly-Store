import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { Observable, map } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const res = http.getResponse<Response>();

    return next.handle().pipe(
      map((result: unknown) => {
        if (res?.headersSent) {
          return result;
        }
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
