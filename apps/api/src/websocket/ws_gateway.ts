import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'node:http';
import { JwtService, JwtPayload } from '../auth/jwt.service.js';
import { MessageDTO, SecurityAnalysisResult } from '@securechat/types';

interface AuthenticatedWebSocket extends WebSocket {
  user?: JwtPayload;
  isAlive?: boolean;
}

export class WebSocketGateway {
  private wss: WebSocketServer | null = null;
  // Map: userId -> Set of active WebSockets
  private userSockets: Map<string, Set<AuthenticatedWebSocket>> = new Map();

  public init(server: any): void {
    this.wss = new WebSocketServer({ server, path: '/ws/v1' });

    this.wss.on('connection', (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const token = url.searchParams.get('token');

      if (!token) {
        ws.close(4001, 'Unauthorized: Missing token');
        return;
      }

      try {
        const payload = JwtService.verifyAccessToken(token);
        ws.user = payload;
        ws.isAlive = true;

        if (!this.userSockets.has(payload.userId)) {
          this.userSockets.set(payload.userId, new Set());
        }
        this.userSockets.get(payload.userId)!.add(ws);

        ws.on('pong', () => {
          ws.isAlive = true;
        });

        ws.on('message', (data: Buffer | string) => {
          this.handleClientMessage(ws, data);
        });

        ws.on('close', () => {
          if (ws.user && this.userSockets.has(ws.user.userId)) {
            const set = this.userSockets.get(ws.user.userId)!;
            set.delete(ws);
            if (set.size === 0) {
              this.userSockets.delete(ws.user.userId);
            }
          }
        });

        // Send connection ack
        ws.send(JSON.stringify({ event: 'connected', data: { userId: payload.userId, deviceId: payload.deviceId } }));
      } catch {
        ws.close(4001, 'Unauthorized: Invalid token');
      }
    });

    // Heartbeat liveness check every 30s
    setInterval(() => {
      if (!this.wss) return;
      this.wss.clients.forEach((wsClient: any) => {
        if (wsClient.isAlive === false) return wsClient.terminate();
        wsClient.isAlive = false;
        wsClient.ping();
      });
    }, 30000);
  }

  private handleClientMessage(ws: AuthenticatedWebSocket, rawData: Buffer | string): void {
    try {
      const parsed = JSON.parse(rawData.toString());
      const { event, data } = parsed;

      if (event === 'typing:start' || event === 'typing:stop') {
        if (data?.conversationId && data?.recipientUserId) {
          this.sendToUser(data.recipientUserId, {
            event: 'typing:update',
            data: {
              conversationId: data.conversationId,
              userId: ws.user!.userId,
              isTyping: event === 'typing:start',
            },
          });
        }
      }
    } catch (e) {
      console.error('Error handling WS message:', e);
    }
  }

  public sendToUser(userId: string, payload: any): void {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;

    const dataStr = JSON.stringify(payload);
    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(dataStr);
      }
    }
  }

  public broadcastMessage(conversationId: string, message: MessageDTO | any): void {
    const payload = {
      event: 'message:receive',
      data: {
        conversationId,
        message,
      },
    };

    const dataStr = JSON.stringify(payload);
    if (!this.wss) return;

    this.wss.clients.forEach((wsClient: any) => {
      if (wsClient.readyState === WebSocket.OPEN) {
        wsClient.send(dataStr);
      }
    });
  }

  public isUserConnected(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    if (!sockets || sockets.size === 0) return false;
    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) return true;
    }
    return false;
  }
}

export const wsGateway = new WebSocketGateway();
