// ==========================================
// GAME CONFIG
// Configuracoes globais do jogo
// ==========================================

/**
 * Configuracao do grid isometrico
 */
export const GRID_CONFIG = {
  /** Largura do mapa em tiles */
  mapWidth: 20,

  /** Altura do mapa em tiles */
  mapHeight: 20,

  /** Largura do tile em pixels */
  tileWidth: 64,

  /** Altura do tile em pixels (metade para isometrico 2:1) */
  tileHeight: 32,
} as const;

/**
 * Velocidades em tiles por segundo
 *
 * ANTES (pixels/frame @ 60fps):
 * - Player: 4 px/frame = 240 px/s = muito rapido
 * - Enemy: 2 px/frame = 120 px/s = muito rapido
 *
 * DEPOIS (tiles/segundo):
 * - Player: 3 tiles/s = 192 px/s (com tile de 64px)
 * - Enemy: 1.5 tiles/s = 96 px/s
 */
export const MOVEMENT_SPEEDS = {
  /** Velocidade do jogador (tiles/segundo) */
  player: 3,

  /** Velocidade do jogador durante dash (tiles/segundo) */
  playerDash: 10,

  /** Velocidade do inimigo normal (tiles/segundo) */
  enemy: 1.5,

  /** Velocidade do inimigo rapido (tiles/segundo) */
  enemyFast: 2.5,

  /** Velocidade do boss (tiles/segundo) */
  boss: 1,

  /** Velocidade de projeteis (tiles/segundo) */
  projectile: 8,

  /** Velocidade do fireball (tiles/segundo) */
  fireball: 6,

  /** Velocidade do ice spear (tiles/segundo) */
  iceSpear: 8,
} as const;

/**
 * Converte velocidade em tiles/segundo para pixels/frame
 * @param tilesPerSecond Velocidade em tiles por segundo
 * @param tileSize Tamanho do tile em pixels
 * @param fps Frames por segundo (default: 60)
 */
export function tilesToPixelsPerFrame(
  tilesPerSecond: number,
  tileSize: number = GRID_CONFIG.tileWidth,
  fps: number = 60
): number {
  return (tilesPerSecond * tileSize) / fps;
}

/**
 * Converte velocidade em tiles/segundo para pixels/segundo
 */
export function tilesToPixelsPerSecond(
  tilesPerSecond: number,
  tileSize: number = GRID_CONFIG.tileWidth
): number {
  return tilesPerSecond * tileSize;
}

/**
 * Configuracao de camera
 */
export const CAMERA_CONFIG = {
  /** Margem para começar a scrollar (em pixels) */
  scrollMargin: 200,

  /** Suavizacao do movimento da camera (0-1, menor = mais suave) */
  smoothing: 0.1,

  /** Zoom minimo */
  minZoom: 0.5,

  /** Zoom maximo */
  maxZoom: 2,

  /** Zoom padrao */
  defaultZoom: 1,
} as const;

/**
 * Configuracao de colisao
 */
export const COLLISION_CONFIG = {
  /** Raio de colisao do jogador (em tiles) */
  playerRadius: 0.4,

  /** Raio de colisao do inimigo (em tiles) */
  enemyRadius: 0.35,

  /** Raio de colisao de projeteis (em tiles) */
  projectileRadius: 0.15,
} as const;

/**
 * Configuracao de combate
 */
export const COMBAT_CONFIG = {
  /** Range de ataque melee (em tiles) */
  meleeRange: 1.5,

  /** Range de deteccao de inimigos (em tiles) */
  enemyDetectionRange: 6,

  /** Range de ataque de inimigos (em tiles) */
  enemyAttackRange: 1.2,

  /** Multiplicador de dano critico */
  critMultiplier: 1.5,

  /** Chance de critico base */
  baseCritChance: 0.1,
} as const;

/**
 * Configuracao de debug
 */
export const DEBUG_CONFIG = {
  /** Mostrar grid */
  showGrid: false,

  /** Mostrar pathfinding */
  showPathfinding: false,

  /** Mostrar bones */
  showBones: false,

  /** Mostrar hitboxes */
  showHitboxes: false,

  /** Mostrar FPS */
  showFPS: true,
} as const;

/**
 * Configuracao de animacao
 */
export const ANIMATION_CONFIG = {
  /** Duracao do walk cycle (segundos) */
  walkCycleDuration: 0.5,

  /** Duracao do ataque (segundos) */
  attackDuration: 0.3,

  /** Duracao do hit stun (segundos) */
  hitStunDuration: 0.2,

  /** Suavizacao de bones (maior = mais suave) */
  boneSmoothing: 8,
} as const;
