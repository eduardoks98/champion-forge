// ==========================================
// STATS ROUTES
// ==========================================

import { Router, Request, Response } from 'express';
import { statsService } from '../services/stats.service.js';
import { authService } from '../services/auth.service.js';

const router = Router();

/**
 * Middleware para verificar autenticação
 */
async function authMiddleware(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token não fornecido' });
    return;
  }

  const token = authHeader.substring(7);
  const user = await authService.validateToken(token);

  if (!user) {
    res.status(401).json({ error: 'Token inválido' });
    return;
  }

  // Adicionar usuário ao request
  (req as Request & { user: typeof user }).user = user;
  next();
}

/**
 * GET /api/stats/:userId
 * Buscar estatísticas de um usuário com progresso calculado
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ error: 'userId é obrigatório' });
      return;
    }

    const statsResponse = await statsService.getUserStatsWithProgress(userId);
    res.json(statsResponse);
  } catch (error) {
    console.error('[Stats Route] Error fetching stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

/**
 * GET /api/stats/me
 * Buscar estatísticas do usuário autenticado
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as Request & { user: { id: string } }).user;
    const statsResponse = await statsService.getUserStatsWithProgress(user.id);
    res.json(statsResponse);
  } catch (error) {
    console.error('[Stats Route] Error fetching my stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

/**
 * POST /api/stats/:userId/increment
 * Incrementar uma estatística específica (uso interno/admin)
 */
router.post('/:userId/increment', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { stat, amount } = req.body;

    if (!userId || !stat) {
      res.status(400).json({ error: 'userId e stat são obrigatórios' });
      return;
    }

    const stats = await statsService.incrementStat(userId, stat, amount || 1);
    res.json({ success: true, stats });
  } catch (error) {
    console.error('[Stats Route] Error incrementing stat:', error);
    res.status(500).json({ error: 'Erro ao incrementar estatística' });
  }
});

export default router;
