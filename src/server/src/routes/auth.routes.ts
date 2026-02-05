import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service.js';

const router = Router();

// Get current user
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    const user = await authService.validateToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    res.json({ user });
  } catch (error) {
    console.error('[Auth] /me error:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Logout - CRITICAL: Must call MySys API to trigger broadcast to other games
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      // CRITICAL: Call MySys API to trigger AuthSyncEvent broadcast
      // This notifies all other games (Bangshot, Portal, etc.) that user logged out
      const apiUrl = process.env.GAMES_ADMIN_API_URL || 'http://localhost:8000';
      const gameCode = process.env.GAME_CODE || 'champ';

      try {
        const response = await fetch(
          `${apiUrl}/api/games/${gameCode}/auth/logout`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          }
        );
        console.log('[Auth] MySys logout API called:', response.status);
      } catch (error) {
        console.error('[Auth] Failed to call MySys logout API:', error);
      }
    }

    res.json({ message: 'Logout realizado' });
  } catch (error) {
    console.error('[Auth] /logout error:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Validate token
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ valid: false, error: 'Token não fornecido' });
    }

    const user = await authService.validateToken(token);

    if (!user) {
      return res.json({ valid: false });
    }

    res.json({ valid: true, user });
  } catch (error) {
    console.error('[Auth] /validate error:', error);
    res.status(500).json({ valid: false, error: 'Erro interno' });
  }
});

export default router;
