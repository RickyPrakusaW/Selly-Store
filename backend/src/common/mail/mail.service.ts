import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter?: Transporter;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.from = config.get<string>('EMAIL_FROM', 'no-reply@seliflorist.local');
    const host = config.get<string>('EMAIL_HOST');
    const user = config.get<string>('EMAIL_USER');
    const pass = config.get<string>('EMAIL_PASS');
    if (host && user && pass && !pass.startsWith('your_')) {
      this.transporter = nodemailer.createTransport({
        host,
        port: config.get<number>('EMAIL_PORT', 587),
        secure: config.get<number>('EMAIL_PORT', 587) === 465,
        auth: { user, pass },
      });
    }
  }

  async send(to: string, subject: string, text: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        `Email transport is not configured; skipped message to ${to}`,
      );
      return;
    }
    await this.transporter.sendMail({ from: this.from, to, subject, text });
  }
}
