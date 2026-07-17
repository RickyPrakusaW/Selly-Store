import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(private readonly gateway: NotificationsGateway) {}

  admin(event: string, payload: Record<string, unknown>): void {
    this.gateway.emitToAdmins(event, payload);
  }
}
