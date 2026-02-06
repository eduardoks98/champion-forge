// ==========================================
// STATS DE MINIONS - BASEADO NA WIKI OFICIAL DO LOL
// ==========================================

// ==========================================
// TIPOS DE MINION
// ==========================================

export type MinionType = 'melee' | 'caster' | 'siege' | 'super';

// ==========================================
// INTERFACE DE STATS
// ==========================================

export interface MinionBaseStats {
  hp: number;
  attackDamage: number;
  armor: number;
  magicResist: number;
  attackSpeed: number;  // Ataques por segundo
  attackRange: number;
  moveSpeed: number;
  goldReward: number;
  xpReward: number;
}

// ==========================================
// STATS OFICIAIS
// ==========================================

export const MINION_STATS: Record<MinionType, MinionBaseStats> = {
  melee: {
    hp: 477,
    attackDamage: 12,
    armor: 0,
    magicResist: 0,
    attackSpeed: 1.25,
    attackRange: 110,
    moveSpeed: 325,
    goldReward: 21,
    xpReward: 60,
  },
  caster: {
    hp: 296,
    attackDamage: 23,
    armor: 0,
    magicResist: 0,
    attackSpeed: 0.67,
    attackRange: 550,
    moveSpeed: 325,
    goldReward: 14,
    xpReward: 30,
  },
  siege: {
    hp: 900,
    attackDamage: 40,
    armor: 30,
    magicResist: 50,
    attackSpeed: 1.0,
    attackRange: 300,
    moveSpeed: 325,
    goldReward: 60,
    xpReward: 75,
  },
  super: {
    hp: 1500,
    attackDamage: 180,
    armor: 30,
    magicResist: -30, // Vulnerável a magia!
    attackSpeed: 0.85,
    attackRange: 170,
    moveSpeed: 325,
    goldReward: 60,
    xpReward: 90,
  },
};

// ==========================================
// SCALING POR TEMPO
// ==========================================

// Minions ficam mais fortes a cada 90 segundos (upgrade)
// Começa em 0:30

export const MINION_SCALING = {
  upgradeInterval: 90_000,  // 90 segundos
  startTime: 30_000,        // 0:30

  // Por upgrade
  hpBonus: 21,
  adBonus: 1,
};

/**
 * Calcula stats de minion com scaling por tempo
 */
export function getMinionStatsAtTime(type: MinionType, gameTimeMs: number): MinionBaseStats {
  const base = { ...MINION_STATS[type] };

  // Calcular número de upgrades
  const timeSinceStart = Math.max(0, gameTimeMs - MINION_SCALING.startTime);
  const upgradeCount = Math.floor(timeSinceStart / MINION_SCALING.upgradeInterval);

  // Aplicar scaling
  base.hp += MINION_SCALING.hpBonus * upgradeCount;
  base.attackDamage += MINION_SCALING.adBonus * upgradeCount;

  // Siege gold escala
  if (type === 'siege') {
    const minutes = gameTimeMs / 60_000;
    base.goldReward = Math.min(87, Math.floor(60 + minutes / 2));
  }

  return base;
}

// ==========================================
// DANO VS CHAMPIONS/ESTRUTURAS
// ==========================================

// Minions causam 60% do dano contra champions e estruturas
export const MINION_DAMAGE_REDUCTION = {
  vsChampion: 0.6,
  vsStructure: 0.6,
  vsMinion: 1.0,
};

// ==========================================
// WAVE COMPOSITION
// ==========================================

export interface WaveComposition {
  melee: number;
  caster: number;
  siege: boolean;
  super: boolean;
}

// ARAM Wave Config
export const ARAM_WAVE_CONFIG = {
  firstWaveTime: 50_000,      // 0:50
  waveIntervalStart: 25_000,  // 25s no início
  waveIntervalEnd: 13_000,    // Acelera para 13s late game
  accelerationStart: 15 * 60_000, // 15 minutos

  composition: {
    melee: 3,
    caster: 3,
    siegeEveryNWaves: 3,
    // Após 25min: siege toda wave
    siegeEveryWaveAfter: 25 * 60_000,
  },
};

// Summoner's Rift Wave Config
export const SR_WAVE_CONFIG = {
  firstWaveTime: 65_000,  // 1:05
  waveInterval: 30_000,   // 30s fixo

  composition: {
    melee: 3,
    caster: 3,
    siegeEveryNWaves: 3,
    // Após 15min: siege a cada 2 waves
    // Após 25min: siege toda wave
    siegeEvery2WavesAfter: 15 * 60_000,
    siegeEveryWaveAfter: 25 * 60_000,
  },
};

/**
 * Determina composição de wave baseado no tempo e número da wave
 */
export function getWaveComposition(
  waveNumber: number,
  gameTimeMs: number,
  isARAM: boolean = false
): WaveComposition {
  const config = isARAM ? ARAM_WAVE_CONFIG : SR_WAVE_CONFIG;

  // Sempre 3 melee + 3 caster
  const composition: WaveComposition = {
    melee: config.composition.melee,
    caster: config.composition.caster,
    siege: false,
    super: false, // Super minions aparecem quando inibidor é destruído
  };

  // Determinar se tem siege
  if (gameTimeMs >= config.composition.siegeEveryWaveAfter) {
    // Após 25 min: siege toda wave
    composition.siege = true;
  } else if (!isARAM && gameTimeMs >= (SR_WAVE_CONFIG.composition.siegeEvery2WavesAfter)) {
    // SR: após 15min, siege a cada 2 waves
    composition.siege = waveNumber % 2 === 0;
  } else {
    // Normal: siege a cada 3 waves
    composition.siege = waveNumber % config.composition.siegeEveryNWaves === 0;
  }

  return composition;
}

/**
 * Calcula intervalo entre waves (ARAM acelera com tempo)
 */
export function getWaveInterval(gameTimeMs: number, isARAM: boolean = false): number {
  if (!isARAM) {
    return SR_WAVE_CONFIG.waveInterval;
  }

  // ARAM: acelera de 25s para 13s
  const config = ARAM_WAVE_CONFIG;

  if (gameTimeMs < config.accelerationStart) {
    return config.waveIntervalStart;
  }

  // Interpolar entre start e end
  const timeSinceAccel = gameTimeMs - config.accelerationStart;
  const accelDuration = 10 * 60_000; // 10 minutos para chegar ao mínimo

  const progress = Math.min(1, timeSinceAccel / accelDuration);
  const interval = config.waveIntervalStart - (config.waveIntervalStart - config.waveIntervalEnd) * progress;

  return Math.floor(interval);
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Retorna tempo de ataque em ms
 */
export function getMinionAttackInterval(type: MinionType): number {
  return 1000 / MINION_STATS[type].attackSpeed;
}

/**
 * Verifica se é minion de range
 */
export function isRangedMinion(type: MinionType): boolean {
  return type === 'caster' || type === 'siege';
}

/**
 * Retorna cor do minion para debug
 */
export function getMinionColor(type: MinionType, team: 'blue' | 'red'): string {
  const baseColors = {
    blue: {
      melee: '#4a90d9',
      caster: '#6db3f2',
      siege: '#2563eb',
      super: '#1d4ed8',
    },
    red: {
      melee: '#d94a4a',
      caster: '#f26d6d',
      siege: '#dc2626',
      super: '#b91c1c',
    },
  };

  return baseColors[team][type];
}
