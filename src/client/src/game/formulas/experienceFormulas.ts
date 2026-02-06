// ==========================================
// FÓRMULAS DE EXPERIÊNCIA - BASEADO NA WIKI OFICIAL DO LOL
// ==========================================

// ==========================================
// TABELA DE XP POR LEVEL
// ==========================================

// XP acumulado necessário para cada level
export const XP_TABLE = [
  0,      // Level 1 (start)
  280,    // Level 2
  660,    // Level 3
  1140,   // Level 4
  1720,   // Level 5
  2400,   // Level 6
  3180,   // Level 7
  4060,   // Level 8
  5040,   // Level 9
  6120,   // Level 10
  7300,   // Level 11
  8580,   // Level 12
  9960,   // Level 13
  11440,  // Level 14
  13020,  // Level 15
  14700,  // Level 16
  16480,  // Level 17
  18360,  // Level 18 (max)
];

// XP necessário para subir de level (incremental)
export const XP_TO_LEVEL_UP = [
  0,    // 1 -> 2 (começa no 0)
  280,  // 1 -> 2
  380,  // 2 -> 3
  480,  // 3 -> 4
  580,  // 4 -> 5
  680,  // 5 -> 6
  780,  // 6 -> 7
  880,  // 7 -> 8
  980,  // 8 -> 9
  1080, // 9 -> 10
  1180, // 10 -> 11
  1280, // 11 -> 12
  1380, // 12 -> 13
  1480, // 13 -> 14
  1580, // 14 -> 15
  1680, // 15 -> 16
  1780, // 16 -> 17
  1880, // 17 -> 18
];

export const MAX_LEVEL = 18;

/**
 * Retorna XP total necessário para alcançar um level
 */
export function getXpForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level > MAX_LEVEL) return XP_TABLE[MAX_LEVEL - 1];
  return XP_TABLE[level - 1];
}

/**
 * Retorna XP necessário para subir do level atual para o próximo
 */
export function getXpToNextLevel(currentLevel: number): number {
  if (currentLevel >= MAX_LEVEL) return 0;
  return XP_TO_LEVEL_UP[currentLevel];
}

/**
 * Calcula o level baseado no XP total acumulado
 */
export function calculateLevelFromXp(totalXp: number): number {
  for (let level = MAX_LEVEL; level >= 1; level--) {
    if (totalXp >= XP_TABLE[level - 1]) {
      return level;
    }
  }
  return 1;
}

/**
 * Calcula XP atual dentro do level (para barra de progresso)
 */
export function getXpProgress(totalXp: number, currentLevel: number): { current: number; required: number; percent: number } {
  if (currentLevel >= MAX_LEVEL) {
    return { current: 0, required: 0, percent: 100 };
  }

  const xpAtCurrentLevel = XP_TABLE[currentLevel - 1];
  const xpAtNextLevel = XP_TABLE[currentLevel];
  const current = totalXp - xpAtCurrentLevel;
  const required = xpAtNextLevel - xpAtCurrentLevel;

  return {
    current,
    required,
    percent: Math.floor((current / required) * 100),
  };
}

// ==========================================
// XP SHARING
// ==========================================

export const XP_SHARE_RANGE = 1600; // Unidades

// Split de XP quando múltiplos champions estão no range
export const XP_SPLIT_PERCENTAGES: Record<number, number> = {
  1: 1.00,  // 100% - Solo
  2: 0.62,  // 62% cada
  3: 0.41,  // 41% cada
  4: 0.31,  // 31% cada
  5: 0.24,  // 24% cada
};

/**
 * Calcula XP compartilhado entre múltiplos champions
 *
 * @param baseXp - XP base da fonte
 * @param championsInRange - Número de champions aliados no range
 * @returns XP que cada champion recebe
 */
export function calculateSharedXp(baseXp: number, championsInRange: number): number {
  const clampedCount = Math.max(1, Math.min(5, championsInRange));
  const splitPercent = XP_SPLIT_PERCENTAGES[clampedCount];
  return Math.floor(baseXp * splitPercent);
}

// ==========================================
// XP DE KILL
// ==========================================

/**
 * Calcula XP por matar um champion
 * Fórmula base: 140 + (20 * victimLevel)
 *
 * Modificador por diferença de level:
 * - Killer abaixo do victim: +20% por level
 * - Killer acima do victim: -20% por level (mínimo 0%)
 *
 * @param victimLevel - Level da vítima
 * @param killerLevel - Level do assassino
 * @returns XP ganho
 */
export function calculateKillXp(victimLevel: number, killerLevel: number): number {
  const baseXp = 140 + (20 * victimLevel);

  // Modificador por diferença de level
  const levelDiff = victimLevel - killerLevel;
  let modifier = 1.0;

  if (levelDiff > 0) {
    // Killer abaixo do victim: +20% por level
    modifier = 1 + (levelDiff * 0.2);
  } else if (levelDiff < 0) {
    // Killer acima do victim: -20% por level (mínimo 0%)
    modifier = Math.max(0, 1 + (levelDiff * 0.2));
  }

  return Math.floor(baseXp * modifier);
}

/**
 * Calcula XP de assist (mesmo range que kill XP)
 * Geralmente 50% do XP de kill
 */
export function calculateAssistXp(victimLevel: number, killerLevel: number): number {
  return Math.floor(calculateKillXp(victimLevel, killerLevel) * 0.5);
}

// ==========================================
// XP DE MINIONS
// ==========================================

export const MINION_XP = {
  melee: 60,
  caster: 30,
  siege: 75,
  super: 90,
};

/**
 * Retorna XP base de um minion
 */
export function getMinionXp(type: keyof typeof MINION_XP): number {
  return MINION_XP[type];
}

// ==========================================
// XP PASSIVO (ARAM)
// ==========================================

// ARAM tem XP passivo constante
export const ARAM_PASSIVE_XP_PER_SECOND = 5;

/**
 * Calcula XP passivo acumulado em ARAM
 */
export function calculatePassiveXpARAM(gameTimeMs: number, startTimeMs: number = 0): number {
  const effectiveTime = Math.max(0, gameTimeMs - startTimeMs);
  return Math.floor((effectiveTime / 1000) * ARAM_PASSIVE_XP_PER_SECOND);
}

// ==========================================
// LEVEL UP HELPERS
// ==========================================

export interface LevelUpResult {
  newLevel: number;
  levelsGained: number;
  remainingXp: number;
}

/**
 * Processa ganho de XP e calcula level ups
 */
export function processXpGain(
  currentXp: number,
  currentLevel: number,
  xpGained: number
): LevelUpResult {
  let totalXp = currentXp + xpGained;
  let level = currentLevel;
  let levelsGained = 0;

  // Verificar level ups
  while (level < MAX_LEVEL && totalXp >= XP_TABLE[level]) {
    level++;
    levelsGained++;
  }

  return {
    newLevel: level,
    levelsGained,
    remainingXp: totalXp,
  };
}

// ==========================================
// CATCH-UP XP (XP extra quando atrás)
// ==========================================

/**
 * Calcula XP bonus de catch-up quando está atrás em levels
 * Jogadores atrás ganham até 50% mais XP
 */
export function calculateCatchUpXp(
  baseXp: number,
  playerLevel: number,
  averageEnemyLevel: number
): number {
  const levelDiff = averageEnemyLevel - playerLevel;

  if (levelDiff <= 0) {
    return baseXp; // Não está atrás
  }

  // +10% por level atrás, máximo 50%
  const bonus = Math.min(0.5, levelDiff * 0.1);
  return Math.floor(baseXp * (1 + bonus));
}
