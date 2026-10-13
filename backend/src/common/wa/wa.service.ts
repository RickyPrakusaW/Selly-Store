import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WaService {
  private readonly logger = new Logger(WaService.name);
  private readonly token?: string;

  constructor(private readonly config: ConfigService) {
    this.token = this.config.get<string>('FONNTE_TOKEN');
  }

  async send(target: string, message: string): Promise<boolean> {
    if (!this.token) {
      this.logger.warn(
        `[FONNTE WA LOG] Token missing. Message to ${target}: ${message}`,
      );
      return false;
    }

    try {
      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          Authorization: this.token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target,
          message,
          countryCode: '62',
        }),
      });

      const data = (await response.json()) as { status?: boolean } | null;

      if (response.ok && data?.status) {
        this.logger.log(`[FONNTE WA SUCCESS] Sent WhatsApp to ${target}`);
        return true;
      } else {
        this.logger.error(
          `[FONNTE WA ERROR] ${target}: ${JSON.stringify(data)}`,
        );
        return false;
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[FONNTE WA FAILED] Could not send to ${target}: ${errMsg}`,
      );
      return false;
    }
  }
}
