import 'dotenv/config';
import { createGameServer, AuthService } from '@mysys/game-sdk-server';
import { registerGameHandlers } from './socket/game.handler';
import { GameService } from './services/game.service';

const { app, io, httpServer, config } = createGameServer({
  gameCode: process.env.GAME_CODE!,
  gamesAdminUrl: process.env.GAMES_ADMIN_URL!,
  jwtSecret: process.env.GAMES_ADMIN_JWT_SECRET!,
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
  },
});

const authService = new AuthService({
  gamesAdminUrl: process.env.GAMES_ADMIN_URL!,
  jwtSecret: process.env.GAMES_ADMIN_JWT_SECRET!,
  gameCode: process.env.GAME_CODE!,
});

const gameService = new GameService();

// Registrar handlers do jogo
registerGameHandlers(io, authService, gameService);

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Game: ${process.env.GAME_CODE}`);
});
