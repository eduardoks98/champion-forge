import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service.js';

const router = Router();

// Exchange OAuth code for token
router.post('/callback', async (req: Request, res: Response) => {
  try {
    const { code, redirect_uri } = req.body;

    if (!code) {
      return res.status(400).json({
        error: 'code_required',
        error_description: 'Authorization code is required',
      });
    }

    const redirectUri = redirect_uri || process.env.OAUTH_REDIRECT_URI || 'http://localhost:5173/auth/callback';

    console.log('[OAuth] Exchanging code for token');

    const result = await authService.exchangeCode(code, redirectUri);

    if (!result) {
      return res.status(401).json({
        error: 'exchange_failed',
        error_description: 'Failed to exchange code for token',
      });
    }

    console.log('[OAuth] Token generated for user:', result.user.id);

    res.json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error('[OAuth] /callback error:', error);
    res.status(500).json({
      error: 'internal_error',
      error_description: 'An error occurred during authentication',
    });
  }
});

export default router;
