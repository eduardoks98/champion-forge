import type { Server, Socket } from 'socket.io';
import type { GameService } from '../services/game.service.js';

export function registerGameHandlers(
  io: Server,
  gameService: GameService
): void {
  io.on('connection', (socket: Socket) => {
    console.log(`Player connected: ${socket.id}`);

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
      console.log(`Player disconnected: ${socket.id}`);
    });
  });
}
