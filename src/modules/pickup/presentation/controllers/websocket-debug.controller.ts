import { Controller, Get, Inject } from '@nestjs/common';
import { WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

interface ClientInfo {
  socketId: string;
  userId?: string;
  userRole?: string;
  rooms: string[];
  connected: boolean;
  namespace: string;
}

@Controller('websocket-debug')
export class WebsocketDebugController {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
  ) {}

  @Get('connected-clients')
  async getConnectedClients() {
    // This is a basic implementation - in production you might want to track connections more robustly
    const sockets = this.server?.sockets?.sockets || new Map();
    
    const clients: ClientInfo[] = [];
    for (const [socketId, socket] of sockets.entries()) {
      const clientSocket = socket as any;
      clients.push({
        socketId,
        userId: clientSocket.userId,
        userRole: clientSocket.userRole,
        rooms: Array.from(clientSocket.rooms || []),
        connected: clientSocket.connected || false,
        namespace: clientSocket.nsp?.name || 'unknown',
      });
    }

    return {
      totalClients: clients.length,
      clients: clients,
      agentConnections: clients.filter(c => c.userRole === 'agent'),
      userConnections: clients.filter(c => c.userRole === 'user'),
    };
  }
}
