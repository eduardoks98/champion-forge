// ==========================================
// AUTH SERVICE
// ==========================================

import jwt from 'jsonwebtoken';

// Note: For development with self-signed certificates, set NODE_TLS_REJECT_UNAUTHORIZED=0
// in the start script (start-server.bat)

// ==========================================
// TOKEN VALIDATION CACHE
// ==========================================

interface CachedValidation {
  valid: boolean;
  timestamp: number;
}

const tokenValidationCache = new Map<string, CachedValidation>();
const CACHE_TTL = 60 * 1000; // 1 minute - shorter for faster logout propagation

// ==========================================
// TYPES
// ==========================================

// Games Admin token payload (Centralized OAuth)
interface GamesAdminTokenPayload {
  sub: string; // game_user_id
  game: string; // game_code
  iat: number;
  exp: number;
}

// Games Admin API validation response
interface GamesAdminValidateResponse {
  valid: boolean;
  user?: GamesAdminUser;
}

interface GamesAdminUser {
  id: string;
  email: string;
  username: string;
  display_name: string;
  nickname?: string;
  avatar_url?: string;
  elo_rating?: number;
  rank?: string;
  is_admin?: boolean;
}

interface UserProfile {
  id: string;
  game_user_id: string | null;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  games_played: number;
  games_won: number;
  rounds_played: number;
  rounds_won: number;
  total_kills: number;
  total_deaths: number;
  elo_rating: number;
  rank: string;
  total_xp: number;
  is_admin: boolean;
  active_title_id: string | null;
  tier: string;
  division: number | null;
  lp: number;
}

// In-memory user cache (replace with database in production)
const userCache = new Map<string, UserProfile>();

// ==========================================
// ENVIRONMENT
// ==========================================

const env = {
  JWT_SECRET: process.env.JWT_SECRET || 'champion_forge_secret',
  GAMES_ADMIN_JWT_SECRET: process.env.GAMES_ADMIN_JWT_SECRET || '',
  GAMES_ADMIN_API_URL: process.env.GAMES_ADMIN_API_URL || 'http://localhost:8000',
  GAME_CODE: process.env.GAME_CODE || 'champ',
  PORTAL_API_KEY: process.env.PORTAL_API_KEY || '',
};

// ==========================================
// AUTH SERVICE CLASS
// ==========================================

export class AuthService {
  async validateToken(token: string): Promise<UserProfile | null> {
    // Try Games Admin token (centralized OAuth)
    const user = await this.validateGamesAdminToken(token);
    if (user) {
      return user;
    }

    console.log('[Auth] Token validation failed');
    return null;
  }

  /**
   * Validate a Games Admin JWT token and sync/create user locally
   * SSO: Accept tokens from any game (PORTAL, BANGSHOT, etc.)
   */
  async validateGamesAdminToken(token: string): Promise<UserProfile | null> {
    try {
      const secret = env.GAMES_ADMIN_JWT_SECRET;
      if (!secret) {
        console.log('[Auth] GAMES_ADMIN_JWT_SECRET not configured');
        return null;
      }

      // Validate JWT (don't log token content for security)
      const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as GamesAdminTokenPayload;
      console.log('[Auth] Token decoded successfully, game:', decoded.game);

      // SSO: Accept tokens from any game (PORTAL, BANGSHOT, etc.)
      // This allows centralized login via MySys Portal

      const gameUserId = decoded.sub;

      // CRITICAL: Always validate with MySys API to check if user has logged out
      const isValidWithMySys = await this.validateTokenWithMySys(token);
      if (!isValidWithMySys) {
        console.log('[Auth] Token rejected by MySys API (user may have logged out)');
        return null;
      }

      // Sync user data from MySys
      const user = await this.syncUserFromGamesAdmin(token, gameUserId);
      return user;
    } catch (error) {
      console.error('[Auth] validateGamesAdminToken error:', error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * Validate token with Portal API using internal API_KEY
   * Uses caching to reduce API calls (5 min TTL)
   */
  private async validateTokenWithMySys(token: string): Promise<boolean> {
    // Check cache first
    const cached = tokenValidationCache.get(token);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('[Auth] Using cached Portal validation:', cached.valid);
      return cached.valid;
    }

    try {
      // Use internal API with API_KEY for server-to-server communication
      const response = await fetch(
        `${env.GAMES_ADMIN_API_URL}/api/internal/validate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': env.PORTAL_API_KEY,
          },
          body: JSON.stringify({ token }),
        }
      );

      if (!response.ok) {
        console.error('[Auth] Portal API returned error status:', response.status);
        // Always fail closed - never accept tokens when API fails
        tokenValidationCache.set(token, { valid: false, timestamp: Date.now() });
        return false;
      }

      const data = await response.json() as { valid: boolean };
      console.log('[Auth] Portal API validation result:', data.valid);

      // Cache the result
      tokenValidationCache.set(token, { valid: data.valid === true, timestamp: Date.now() });
      return data.valid === true;
    } catch (error) {
      console.error('[Auth] Error validating token with MySys:', error);
      // Always fail closed - never accept tokens when network fails
      tokenValidationCache.set(token, { valid: false, timestamp: Date.now() });
      return false;
    }
  }

  /**
   * Sync user data from Games Admin API
   */
  async syncUserFromGamesAdmin(token: string, gameUserId: string): Promise<UserProfile | null> {
    try {
      const response = await fetch(
        `${env.GAMES_ADMIN_API_URL}/api/games/${env.GAME_CODE}/auth/validate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json() as GamesAdminValidateResponse;
      if (!data.valid || !data.user) {
        return null;
      }

      const adminUser = data.user;

      // Create user profile from Games Admin data
      const userProfile: UserProfile = {
        id: gameUserId,
        game_user_id: gameUserId,
        email: adminUser.email,
        username: adminUser.username,
        display_name: adminUser.nickname || adminUser.display_name,
        avatar_url: adminUser.avatar_url || null,
        games_played: 0,
        games_won: 0,
        rounds_played: 0,
        rounds_won: 0,
        total_kills: 0,
        total_deaths: 0,
        elo_rating: adminUser.elo_rating || 0,
        rank: adminUser.rank || 'Bronze',
        total_xp: 0,
        is_admin: adminUser.is_admin || false,
        active_title_id: null,
        tier: 'Bronze',
        division: 4,
        lp: 0,
      };

      // Cache the user
      userCache.set(gameUserId, userProfile);

      return userProfile;
    } catch (error) {
      console.error('[Auth] Error syncing user from Games Admin:', error);
      return null;
    }
  }

  getUser(userId: string): UserProfile | null {
    return userCache.get(userId) || null;
  }
}

export const authService = new AuthService();
