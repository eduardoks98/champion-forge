// ==========================================
// FÓRMULAS DE RESPAWN - BASEADO NA WIKI OFICIAL DO LOL
// ==========================================

// ==========================================
// TIMER BASE POR LEVEL
// ==========================================

// Tempo de respawn base em segundos por level
export const RESPAWN_BASE_SECONDS = [
  10,    // Level 1
  10,    // Level 2
  12,    // Level 3
  12,    // Level 4
  14,    // Level 5
  16,    // Level 6
  20,    // Level 7
  25,    // Level 8
  28,    // Level 9
  32.5,  // Level 10
  35,    // Level 11
  37.5,  // Level 12
  40,    // Level 13
  42.5,  // Level 14
  45,    // Level 15
  47.5,  // Level 16
  50,    // Level 17
  52.5,  // Level 18
];

/**
 * Retorna tempo de respawn base para um level
 */
export function getBaseRespawnTime(level: number): number {
  const index = Math.max(0, Math.min(17, level - 1));
  return RESPAWN_BASE_SECONDS[index];
}

// ==========================================
// MODIFICADOR POR TEMPO DE JOGO
// ==========================================

/**
 * Calcula tempo de respawn final considerando tempo de jogo
 *
 * Após 15 minutos, respawn aumenta progressivamente
 * Fórmula: baseTime * (1 + modifier)
 * modifier = (minutes - 15) * 2 * 0.425 / 100
 *
 * Cap máximo: 150% do base após 53.5 minutos
 *
 * @param level - Level do champion
 * @param gameMinutes - Tempo de jogo em minutos
 * @returns Tempo de respawn em segundos
 */
export function calculateRespawnTime(level: number, gameMinutes: number): number {
  const baseTime = getBaseRespawnTime(level);

  // Antes de 15 minutos, sem modificador
  if (gameMinutes < 15) {
    return baseTime;
  }

  // Fórmula de modificador após 15 minutos
  const modifier = (gameMinutes - 15) * 2 * 0.425 / 100;

  // Cap máximo: 150% do base
  const maxMultiplier = 1.5;
  const finalMultiplier = Math.min(1 + modifier, maxMultiplier);

  return baseTime * finalMultiplier;
}

/**
 * Calcula tempo de respawn em milissegundos
 */
export function calculateRespawnTimeMs(level: number, gameMinutes: number): number {
  return calculateRespawnTime(level, gameMinutes) * 1000;
}

// ==========================================
// ARAM ESPECÍFICO
// ==========================================

// ARAM tem tempos de respawn mais curtos
export const ARAM_RESPAWN_MODIFIER = 0.6; // 60% do tempo normal

/**
 * Calcula tempo de respawn para ARAM
 */
export function calculateARAMRespawnTime(level: number, gameMinutes: number): number {
  const normalTime = calculateRespawnTime(level, gameMinutes);
  return normalTime * ARAM_RESPAWN_MODIFIER;
}

// ==========================================
// DEATH TIMER REDUCTION (Revive effects)
// ==========================================

/**
 * Aplica redução de death timer (ex: Guardian Angel effect)
 *
 * @param baseRespawnTime - Tempo de respawn calculado
 * @param reductionPercent - Porcentagem de redução (0-100)
 * @returns Tempo de respawn reduzido
 */
export function applyDeathTimerReduction(
  baseRespawnTime: number,
  reductionPercent: number
): number {
  return baseRespawnTime * (1 - reductionPercent / 100);
}

// ==========================================
// RESPAWN STATE
// ==========================================

export interface RespawnState {
  isDead: boolean;
  deathTime: number;        // Timestamp de quando morreu
  respawnTime: number;      // Timestamp de quando vai respawnar
  respawnDuration: number;  // Duração total do respawn
}

/**
 * Cria estado inicial de respawn (vivo)
 */
export function createRespawnState(): RespawnState {
  return {
    isDead: false,
    deathTime: 0,
    respawnTime: 0,
    respawnDuration: 0,
  };
}

/**
 * Processa morte e calcula respawn
 */
export function processDeath(
  currentTimeMs: number,
  level: number,
  gameMinutes: number,
  isARAM: boolean = false
): RespawnState {
  const respawnSeconds = isARAM
    ? calculateARAMRespawnTime(level, gameMinutes)
    : calculateRespawnTime(level, gameMinutes);

  const respawnDuration = respawnSeconds * 1000;

  return {
    isDead: true,
    deathTime: currentTimeMs,
    respawnTime: currentTimeMs + respawnDuration,
    respawnDuration,
  };
}

/**
 * Verifica se o champion pode respawnar
 */
export function canRespawn(state: RespawnState, currentTimeMs: number): boolean {
  return state.isDead && currentTimeMs >= state.respawnTime;
}

/**
 * Calcula tempo restante para respawn
 */
export function getRemainingRespawnTime(state: RespawnState, currentTimeMs: number): number {
  if (!state.isDead) return 0;
  return Math.max(0, state.respawnTime - currentTimeMs);
}

/**
 * Calcula progresso do respawn (0-1)
 */
export function getRespawnProgress(state: RespawnState, currentTimeMs: number): number {
  if (!state.isDead || state.respawnDuration === 0) return 1;

  const elapsed = currentTimeMs - state.deathTime;
  return Math.min(1, elapsed / state.respawnDuration);
}

/**
 * Formata tempo de respawn para display
 */
export function formatRespawnTime(remainingMs: number): string {
  const seconds = Math.ceil(remainingMs / 1000);
  return seconds.toString();
}

// ==========================================
// SPAWN PROTECTION
// ==========================================

// Tempo de invulnerabilidade após respawn
export const SPAWN_PROTECTION_DURATION = 1500; // 1.5 segundos

/**
 * Verifica se ainda está sob proteção de spawn
 */
export function hasSpawnProtection(respawnTime: number, currentTime: number): boolean {
  return currentTime - respawnTime < SPAWN_PROTECTION_DURATION;
}
