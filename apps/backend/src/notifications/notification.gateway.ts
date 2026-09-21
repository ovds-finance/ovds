/**
 * Socket.IO WebSocket gateway — real-time notification feed for the React client.
 *
 * Clients connect at  ws://host/notifications
 * Auth:  JWT cookie or Bearer token passed in the handshake auth object.
 * Event: "notification" — emitted to the user's private room when a new
 *         in-app notification is created.
 *
 * Room convention:  `user:<userId>`
 */
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/notifications',
  cors: { origin: '*', credentials: true },
})
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(NotificationGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  afterInit() {
    this.logger.log('NotificationGateway initialised');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth as Record<string, string>)?.token ||
        (() => {
          const match = client.handshake.headers.cookie
            ?.split(';')
            .find((c) => c.trim().startsWith('access_token='));
          if (!match) return undefined;
          // Use slice(1).join('=') to handle base64 padding ('=') inside the value
          const raw = match.trim().split('=').slice(1).join('=');
          return decodeURIComponent(raw);
        })();

      if (!token) throw new Error('No token');

      const secret = this.config.get<string>('JWT_SECRET');
      const payload = this.jwt.verify<{ sub: string }>(token, { secret });
      const userId = payload.sub;

      await client.join(`user:${userId}`);
      (client.data as Record<string, string>).userId = userId;
      this.logger.debug(`WS connected: user ${userId}`);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client.data as Record<string, string>).userId;
    this.logger.debug(`WS disconnected: ${userId ?? 'unknown'}`);
  }

  /** Emit a notification event to all sockets in a user's room. */
  sendToUser(userId: string, event: string, data: unknown) {
    if (!this.server) {
      this.logger.warn(`sendToUser called before gateway initialised — skipping for user ${userId}`);
      return;
    }
    this.server.to(`user:${userId}`).emit(event, data);
  }

  /** Client ACKs that it read a notification (optional optimistic UX). */
  @SubscribeMessage('mark_read')
  handleMarkRead(client: Socket, notificationId: string) {
    const userId = (client.data as Record<string, string>).userId;
    this.logger.debug(`mark_read ${notificationId} by user ${userId}`);
    // Actual DB update is handled by the REST controller
  }
}
