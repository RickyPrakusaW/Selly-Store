import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const body =
      exception instanceof HttpException ? exception.getResponse() : null;
    const objectBody =
      typeof body === 'object' && body !== null ? body : undefined;
    const rawMessage =
      objectBody && 'message' in objectBody ? objectBody.message : body;
    const errors = Array.isArray(rawMessage) ? rawMessage : undefined;
    const message = errors
      ? 'Input validation failed'
      : typeof rawMessage === 'string'
        ? rawMessage
        : 'Internal server error';

    if (status >= 500)
      this.logger.error(`${request.method} ${request.url}`, exception);
    response
      .status(status)
      .json({ success: false, message, ...(errors ? { errors } : {}) });
  }
}
