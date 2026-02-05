import type { Server, Socket } from 'socket.io';
import type { GameService } from '../services/game.service.js';
import { authService } from '../services/auth.service.js';

// Map de socket.id para dados do usuário (padrão Bangshot)
const socketUserMap = new Map<string, { odUserId: string; displayName: string } | null>();

// Referência ao io server para broadcasts
let ioInstance: Server | null = null;

function broadcastOnlineCount(io: Server) {
  io.emit('onlineCount', getOnlineCount().total);
}

// Export for REST endpoint - conta usuários únicos (padrão Bangshot)
export function getOnlineCount(): { total: number; inQueue: number; userIds: string[] } {
  // Contar usuários únicos (por odUserId) + conexões anônimas
  const uniqueUserIds = new Set<string>();
  let anonymousCount = 0;

  for (const [, userData] of socketUserMap) {
    if (!userData) {
      anonymousCount++;
      continue;
    }
    if (userData.odUserId) {
      uniqueUserIds.add(userData.odUserId);
    } else {
      anonymousCount++;
    }
  }

  return {
    total: uniqueUserIds.size + anonymousCount,
    inQueue: 0,
    userIds: Array.from(uniqueUserIds),
  };
}

export function registerGameHandlers(
  io: Server,
  gameService: GameService
): void {
  ioInstance = io;

  io.on('connection', async (socket: Socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Tentar autenticar pelo token (padrão Bangshot)
    const authToken = socket.handshake.auth?.token;
    if (authToken) {
      try {
        const user = await authService.validateToken(authToken);
        if (user) {
          socketUserMap.set(socket.id, {
            odUserId: user.id,
            displayName: user.display_name,
          });
          console.log(`[Socket] User authenticated: ${user.display_name} (${user.id})`);
        } else {
          socketUserMap.set(socket.id, null);
        }
      } catch (error) {
        console.log('[Socket] Token validation failed');
        socketUserMap.set(socket.id, null);
      }
    } else {
      // Conexão anônima
      socketUserMap.set(socket.id, null);
    }

    // Broadcast updated online count
    broadcastOnlineCount(io);

    // Send current online count to new user
    socket.emit('onlineCount', getOnlineCount().total);

    // Registrar eventos do jogo
    socket.on('createRoom', (data, callback) => {
      // TODO: Implementar criacao de sala
      callback({ success: false, error: 'Not implemented' });
    });

    socket.on('joinRoom', (data, callback) => {
      // TODO: Implementar entrada em sala
      callback({ success: false, error: 'Not implemented' });
    });

    socket.on('gameAction', (data, callback) => {
      // TODO: Implementar acoes do jogo
      callback({ success: false, error: 'Not implemented' });
    });

    socket.on('disconnect', () => {
      const userData = socketUserMap.get(socket.id);
      console.log(`Player disconnected: ${socket.id}${userData?.displayName ? ` (${userData.displayName})` : ''}`);

      // Remove from socket user map
      socketUserMap.delete(socket.id);

      // Broadcast updated online count
      broadcastOnlineCount(io);
    });
  });
}
