// apps/shared-domains/accounting/src/ledger-sync.gateway.ts
import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/ledger-updates' })
export class LedgerSyncGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  async handleConnection(client: Socket) {
    const host = client.handshake.headers.host || '';
    const parts = host.split('.');
    if (parts.length < 3) { client.disconnect(true); return; }
    const tenantId = parts[0];
    client.join(`room:tenant:${tenantId}`);
  }

  handleDisconnect(client: Socket) { console.log(`Client disconnected: ${client.id}`); }

  notifyLedgerChange(tenantId: string, eventPayload: { entryId: string; type: string }) {
    this.server.to(`room:tenant:${tenantId}`).emit('ledger_mutated', eventPayload);
  }
}
