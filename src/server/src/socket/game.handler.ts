import type { Server } from 'socket.io';
import type { AuthService } from '@mysys/game-sdk-server';
import type { GameService } from '../services/game.service';

export function registerGameHandlers(
  io: Server,
  authService: AuthService,
  gameService: GameService
): void {
  io.on('connection', async (socket) => {
    // Autenticar
    const result = await authService.validateSocketAuth(socket.handshake.auth);

    if (!result.valid || !result.user) {
      socket.emit('error', { code: 'AUTH_FAILED', message: result.error });
      socket.disconnect(true);
      return;
    }

    console.log(`Player connected: ${result.user.nickname}`);

    // Registrar eventos do jogo
    socket.on('createRoom', (data, callback) => {
      // TODO: Implementar criação de sala
      callback({ success: false, error: 'Not implemented' });
    });

    socket.on('joinRoom', (data, callback) => {
      // TODO: Implementar entrada em sala
      callback({ success: false, error: 'Not implemented' });
    });

    socket.on('gameAction', (data, callback) => {
      // TODO: Implementar ações do jogo
      callback({ success: false, error: 'Not implemented' });
    });

    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${result.user?.nickname}`);
    });
  });
}
