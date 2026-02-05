import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { registerGameHandlers, getOnlineCount } from './socket/game.handler.js';
import { GameService } from './services/game.service.js';
import authRoutes from './routes/auth.routes.js';
import oauthRoutes from './routes/oauth.routes.js';
import statsRoutes from './routes/stats.routes.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5174',
    methods: ['GET', 'POST'],
  },
});

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5174',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', game: process.env.GAME_CODE });
});

// Online count for portal integration
app.get('/api/online', (_req, res) => {
  res.json(getOnlineCount());
});

// Auth routes
app.use('/api/auth', authRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/stats', statsRoutes);

const gameService = new GameService();

// Registrar handlers do jogo
registerGameHandlers(io, gameService);

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Game: ${process.env.GAME_CODE || 'champ'}`);
  console.log(`Client URL: ${process.env.CLIENT_URL || 'http://localhost:5174'}`);
});
