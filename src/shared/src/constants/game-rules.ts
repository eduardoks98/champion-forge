// Regras e constantes do jogo

export const GAME_CONFIG = {
  MAX_PLAYERS: 10,
  MIN_PLAYERS: 2,
  TURN_TIMEOUT: 120, // segundos
  RECONNECT_GRACE_PERIOD: 60, // segundos
} as const;
