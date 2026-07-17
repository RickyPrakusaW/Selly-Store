import { Injectable, PipeTransform } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';

const SENSITIVE_KEYS = new Set([
  'password',
  'currentPassword',
  'newPassword',
  'token',
  'refreshToken',
]);

@Injectable()
export class SanitizationPipe implements PipeTransform {
  transform(value: unknown): unknown {
    return this.clean(value);
  }

  private clean(value: unknown, key?: string): unknown {
    if (Buffer.isBuffer(value)) return value;
    if (
      value &&
      typeof value === 'object' &&
      'buffer' in value &&
      Buffer.isBuffer(value.buffer)
    )
      return value;
    if (typeof value === 'string') {
      if (key && SENSITIVE_KEYS.has(key)) return value;
      return sanitizeHtml(value, {
        allowedTags: [],
        allowedAttributes: {},
      }).trim();
    }
    if (Array.isArray(value)) return value.map((entry) => this.clean(entry));
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([entryKey, entryValue]) => [
          entryKey,
          this.clean(entryValue, entryKey),
        ]),
      );
    }
    return value;
  }
}
