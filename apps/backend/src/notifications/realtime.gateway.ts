/**
 * RealtimeGateway — Socket.IO gateway for the /realtime namespace.
 *
 * Used by the frontend's useWebSocket hook and EntryPortal for:
 *   - newCheckin / newCheckout   (attendance, whoIsInWidget, realtimePresenceWidget)
 *   - deviceControlUpdate        (DeviceControl page)
 *   - payrollUpdate              (complianceStatusBar)
 *   - taxUpdate                  (taxAutomationWidget)
 *   - joinRoom / leaveRoom       (room-based subscriptions)
 *
 * Auth: JWT cookie or Bearer token passed in socket handshake.auth.token.
 * Room convention:
 *   user:<userId>          — per-user private room
 *   dashboard              — shared dashboard room
 *   global                 — broadcast room
 *   company_<companyId>    — per-company room
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
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: '*', credentials: true },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  afterInit() {
    this.logger.log('RealtimeGateway initialised on namespace /realtime');
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
          const raw = match.trim().split('=').slice(1).join('=');
          return decodeURIComponent(raw);
        })();

      if (!token) throw new Error('No token');

      const secret = this.config.get<string>('JWT_SECRET');
      const payload = this.jwt.verify<{ sub: string; companyId?: string }>(token, { secret });
      const userId = payload.sub;
      const companyId = payload.companyId;

      // Always join the user's private room and shared rooms
      await client.join(`user:${userId}`);
      await client.join('global');
      if (companyId) await client.join(`company_${companyId}`);

      (client.data as Record<string, string>).userId = userId;
      if (companyId) (client.data as Record<string, string>).companyId = companyId;

      this.logger.debug(`/realtime connected: user ${userId}`);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client.data as Record<string, string>).userId;
    this.logger.debug(`/realtime disconnected: ${userId ?? 'unknown'}`);
  }

  // ── Room management ──────────────────────────────────────────────────────

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { room: string },
  ) {
    if (payload?.room) {
      await client.join(payload.room);
      this.logger.debug(`User ${(client.data as any).userId} joined room ${payload.room}`);
    }
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { room: string },
  ) {
    if (payload?.room) {
      await client.leave(payload.room);
    }
  }

  // ── Broadcast helpers (called by backend services) ───────────────────────

  /** Emit an event to every socket in a room. */
  broadcastToRoom(room: string, event: string, data: unknown) {
    if (!this.server) return;
    this.server.to(room).emit(event, data);
  }

  /** Emit attendance check-in event to dashboard + global rooms. */
  emitCheckin(data: unknown) {
    this.broadcastToRoom('dashboard', 'newCheckin', data);
    this.broadcastToRoom('global', 'newCheckin', data);
  }

  /** Emit attendance check-out event to dashboard + global rooms. */
  emitCheckout(data: unknown) {
    this.broadcastToRoom('dashboard', 'newCheckout', data);
    this.broadcastToRoom('global', 'newCheckout', data);
  }

  /** Emit a device-control change to the dashboard room. */
  emitDeviceControlUpdate(data: unknown) {
    this.broadcastToRoom('dashboard', 'deviceControlUpdate', data);
  }

  /** Emit a payroll change to the dashboard room. */
  emitPayrollUpdate(data: unknown) {
    this.broadcastToRoom('dashboard', 'payrollUpdate', data);
  }

  /** Emit a tax automation event to a company room (falls back to dashboard). */
  emitTaxUpdate(companyId: string | undefined, data: unknown) {
    const room = companyId ? `company_${companyId}` : 'dashboard';
    this.broadcastToRoom(room, 'taxUpdate', data);
  }
}
