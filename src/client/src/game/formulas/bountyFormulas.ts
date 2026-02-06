// ==========================================
// FÓRMULAS DE BOUNTY - BASEADO NA WIKI OFICIAL DO LOL
// ==========================================

// ==========================================
// GOLD DE KILL POR LEVEL
// ==========================================

// Gold base por matar champion (escala com level da VÍTIMA)
export const KILL_GOLD_BY_LEVEL = [
  300, // Level 1
  300, // Level 2
  300, // Level 3
  300, // Level 4
  300, // Level 5
  300, // Level 6
  310, // Level 7
  320, // Level 8
  330, // Level 9
  340, // Level 10
  350, // Level 11
  360, // Level 12
  370, // Level 13
  380, // Level 14
  390, // Level 15
  400, // Level 16
  410, // Level 17
  420, // Level 18
];

// First Blood: +100 gold adicional
export const FIRST_BLOOD_BONUS = 100;

/**
 * Retorna o gold base por matar um champion de determinado level
 */
export function getBaseKillGold(victimLevel: number): number {
  const index = Math.max(0, Math.min(17, victimLevel - 1));
  return KILL_GOLD_BY_LEVEL[index];
}

// ==========================================
// BOUNTY SYSTEM
// ==========================================

export interface BountyState {
  goldFromKills: number;     // Gold acumulado de kills/assists
  goldFromCS: number;        // Gold acumulado de minions/monstros
  consecutiveKills: number;  // Kill streak atual
  currentBounty: number;     // Bounty acumulado
}

// Bounty por kill streak
export const KILL_STREAK_BOUNTY = [
  0,    // 0 kills
  0,    // 1 kill
  150,  // 2 kills (Killing Spree)
  300,  // 3 kills (Rampage)
  400,  // 4 kills (Unstoppable)
  500,  // 5 kills (Dominating)
  600,  // 6 kills (Godlike)
  700,  // 7+ kills (Legendary) - cap
];

/**
 * Calcula bounty baseado em kill streak
 */
export function getKillStreakBounty(consecutiveKills: number): number {
  const index = Math.min(consecutiveKills, KILL_STREAK_BOUNTY.length - 1);
  return KILL_STREAK_BOUNTY[index];
}

// ==========================================
// SHUTDOWN SYSTEM
// ==========================================

// Thresholds
export const SHUTDOWN_THRESHOLD = 100;   // Bounty > base + 100 = "Shut Down"
export const MAX_SHUTDOWN_BONUS = 700;   // Cap de shutdown gold
export const MIN_KILL_BOUNTY = 50;       // Floor mínimo de gold

/**
 * Calcula o bounty de shutdown baseado no gold acumulado
 *
 * Taxa de acúmulo:
 * - Kill/Assist gold: 1 bounty per 3 gold (ou 2.5 se "atrás")
 * - CS gold: 1 bounty per 20 gold (ou 5 se "atrás")
 *
 * @param state - Estado do bounty do jogador
 * @param isNegative - Se o jogador está "atrás" em gold
 * @returns Valor total do shutdown
 */
export function calculateShutdownValue(state: BountyState, isNegative: boolean = false): number {
  // Taxa de acúmulo varia se está atrás ou na frente
  const killBountyRate = isNegative ? 2.5 : 3.0;
  const csBountyRate = isNegative ? 5 : 20;

  // Bounty de kills/assists
  const killBounty = state.goldFromKills / killBountyRate;

  // Bounty de CS
  const csBounty = state.goldFromCS / csBountyRate;

  // Total (antes do kill streak)
  const totalBounty = killBounty + csBounty;

  // Adicionar bounty de kill streak
  const streakBounty = getKillStreakBounty(state.consecutiveKills);

  // Cap no máximo
  return Math.min(totalBounty + streakBounty, MAX_SHUTDOWN_BONUS);
}

/**
 * Calcula o gold total que o killer recebe
 */
export function calculateTotalKillGold(
  victimLevel: number,
  victimBounty: BountyState,
  isFirstBlood: boolean = false
): number {
  // Gold base por level
  let gold = getBaseKillGold(victimLevel);

  // Shutdown bonus
  const shutdown = calculateShutdownValue(victimBounty);
  gold += shutdown;

  // First blood
  if (isFirstBlood) {
    gold += FIRST_BLOOD_BONUS;
  }

  return gold;
}

// ==========================================
// ASSIST SYSTEM
// ==========================================

export const ASSIST_CONFIG = {
  timeWindow: 10_000,        // 10 segundos antes da kill
  baseAssistGold: 150,       // Gold base de assist
  assistBountyPercent: 0.5,  // 50% do bounty vai para assists
};

/**
 * Calcula gold de assist
 * Assist bounty = 50% do kill bounty, cap em 50% do gold base
 *
 * @param killBounty - Bounty da kill
 * @param baseKillGold - Gold base da kill (sem bounty)
 * @param numAssisters - Número de jogadores que assistiram
 * @returns Gold por assister
 */
export function calculateAssistGold(
  killBounty: number,
  baseKillGold: number,
  numAssisters: number
): number {
  if (numAssisters <= 0) return 0;

  // Bounty de assist é 50% do kill bounty, mas não mais que 50% do base
  const assistBounty = Math.min(
    killBounty * ASSIST_CONFIG.assistBountyPercent,
    baseKillGold * ASSIST_CONFIG.assistBountyPercent
  );

  // Gold total de assist dividido entre assisters
  return Math.floor((ASSIST_CONFIG.baseAssistGold + assistBounty) / numAssisters);
}

// ==========================================
// GOLD PASSIVO
// ==========================================

// Summoner's Rift
export const SR_PASSIVE_GOLD = {
  startTime: 110_000,   // 1:50 (começar a ganhar gold)
  goldPer10s: 20.4,     // Gold por 10 segundos
  tickInterval: 500,    // Tick a cada 0.5s
};

// ARAM (Howling Abyss)
export const ARAM_PASSIVE_GOLD = {
  startTime: 60_000,    // 1:00
  goldPer10s: 60,       // Muito mais gold passivo
  tickInterval: 500,
};

/**
 * Calcula gold passivo por tick
 */
export function getPassiveGoldPerTick(config: typeof SR_PASSIVE_GOLD): number {
  return (config.goldPer10s / 10_000) * config.tickInterval;
}

/**
 * Calcula gold passivo acumulado desde o início
 */
export function calculatePassiveGoldAccumulated(
  gameTimeMs: number,
  config: typeof SR_PASSIVE_GOLD
): number {
  if (gameTimeMs < config.startTime) return 0;

  const timeSinceStart = gameTimeMs - config.startTime;
  return (config.goldPer10s / 10_000) * timeSinceStart;
}

// ==========================================
// GOLD DE MINIONS
// ==========================================

export const MINION_GOLD = {
  melee: 21,
  caster: 14,
  siege: 60,   // Escala até 87 late game
  super: 60,
};

// Siege minion gold escala com tempo
export function getSiegeMinionGold(gameTimeMs: number): number {
  // Começa em 60, escala até 87
  // Fórmula aproximada: 60 + (minutos / 2)
  const minutes = gameTimeMs / 60_000;
  return Math.min(87, Math.floor(60 + minutes / 2));
}

// ==========================================
// ESTRUTURAS
// ==========================================

export const STRUCTURE_GOLD = {
  tower: {
    outer: 550,      // Global: 250 local + 300 global split
    inner: 550,
    inhibitor: 550,
    nexus: 0,        // Torres do Nexus não dão gold
  },
  inhibitor: 50,     // Gold local apenas
  nexus: 0,          // Fim de jogo
};

/**
 * Calcula gold distribuído pela destruição de torre
 * Gold é dividido entre todos os aliados
 */
export function calculateTowerGoldShare(
  towerType: keyof typeof STRUCTURE_GOLD.tower,
  numAllies: number
): { local: number; global: number } {
  const total = STRUCTURE_GOLD.tower[towerType];

  // Local: quem destruiu recebe ~46%
  // Global: resto dividido entre time
  const localPercent = 0.46;
  const local = Math.floor(total * localPercent);
  const global = Math.floor((total - local) / Math.max(1, numAllies - 1));

  return { local, global };
}
