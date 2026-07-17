import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../../common/guards/jwt-user.interface';
import { PrismaService } from '../../prisma/prisma.service';

@WebSocketGateway({
  namespace: '/admin-notifications',
  cors: {
    credentials: true,
    origin(
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) {
      const allowedOrigins = new Set(
        (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
      );
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(
        new Error('Origin is not allowed by WebSocket CORS'),
        false,
      );
    },
  },
  transports: ['websocket'],
})
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = String(client.handshake.auth?.token ?? '').replace(
        /^Bearer\s+/i,
        '',
      );
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow('JWT_SECRET'),
      });
      if (payload.tokenType !== 'access' || payload.role === UserRole.CUSTOMER)
        throw new Error('forbidden');
      const admin = await this.prisma.user.findFirst({
        where: {
          id: payload.sub,
          role: payload.role,
          isActive: true,
          deletedAt: null,
        },
      });
      if (!admin) throw new Error('forbidden');
      await client.join('admins');
    } catch {
      this.logger.warn(`Rejected unauthorized WebSocket client ${client.id}`);
      client.disconnect(true);
    }
  }

  emitToAdmins(event: string, payload: Record<string, unknown>): void {
    this.server?.to('admins').emit(event, payload);
  }
}
