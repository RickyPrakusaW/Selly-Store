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

  async send(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        `[DEV MAIL LOG] To: ${to} | Subject: ${subject} | Content: ${text}`,
      );
      return;
    }
    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        text,
        html,
      });
    } catch (error: any) {
      this.logger.error(
        `[DEV MAIL ERROR] Failed to send email to ${to}: ${error?.message || error}`,
      );
      this.logger.warn(`[DEV MAIL FALLBACK] Content for ${to}: ${text}`);
      throw error;
    }
  }

  async sendVerification(to: string, token: string): Promise<void> {
    const baseUrl = this.config
      .get<string>('BASE_URL', 'http://localhost:3000')
      .replace(/\/$/, '');
    const verificationUrl = `${baseUrl}/api/auth/verify?token=${encodeURIComponent(token)}`;
    const subject = 'Verifikasi akun Seli Florist Anda';
    const text = [
      'Halo, Sahabat Seli Florist!',
      '',
      'Terima kasih sudah mendaftar. Klik tautan berikut untuk memverifikasi akun Anda:',
      verificationUrl,
      '',
      'Tautan ini berlaku selama 24 jam. Jika Anda tidak merasa membuat akun, abaikan email ini.',
    ].join('\n');
    const html = `<!doctype html>
<html lang="id">
  <body style="margin:0;padding:0;background:#fff7f9;font-family:Arial,Helvetica,sans-serif;color:#3f3438;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fff7f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #f2d7df;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(125,52,76,.08);">
            <tr>
              <td align="center" style="padding:30px 28px 20px;background:linear-gradient(135deg,#fff0f4,#f9dce5);">
                <div style="font-family:Georgia,serif;font-size:30px;font-weight:700;color:#9f3f61;">Seli Florist</div>
                <div style="margin-top:6px;font-size:14px;color:#76545f;">Bunga indah untuk setiap cerita</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 32px 12px;">
                <h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:24px;line-height:1.35;color:#603245;">Halo, Sahabat Seli Florist!</h1>
                <p style="margin:0 0 14px;font-size:16px;line-height:1.7;">Terima kasih sudah membuat akun di Seli Florist. Tinggal satu langkah lagi sebelum Anda bisa mulai berbelanja.</p>
                <p style="margin:0;font-size:16px;line-height:1.7;">Klik tombol di bawah ini untuk mengaktifkan dan memverifikasi akun Anda:</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px 32px 28px;">
                <a href="${verificationUrl}" style="display:inline-block;padding:15px 26px;border-radius:999px;background:#a94065;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:.5px;box-shadow:0 7px 18px rgba(169,64,101,.24);">[ VERIFIKASI AKUN SAYA ]</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;">
                <p style="margin:0 0 10px;font-size:14px;line-height:1.65;color:#765f68;">Tautan verifikasi berlaku selama <strong>24 jam</strong>. Jika tombol tidak dapat dibuka, salin tautan berikut ke browser:</p>
                <p style="margin:0;word-break:break-all;font-size:12px;line-height:1.6;color:#9f3f61;">${verificationUrl}</p>
                <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#90747e;">Jika Anda tidak merasa membuat akun ini, abaikan email ini dengan aman.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

    await this.send(to, subject, text, html);
  }
}
