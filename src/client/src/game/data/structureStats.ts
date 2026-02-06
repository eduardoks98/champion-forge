// ==========================================
// STATS DE ESTRUTURAS - BASEADO NA WIKI OFICIAL DO LOL
// ==========================================

// ==========================================
// TIPOS DE ESTRUTURA
// ==========================================

export type StructureType = 'outer_tower' | 'inner_tower' | 'inhibitor_tower' | 'nexus_tower' | 'inhibitor' | 'nexus';

// ==========================================
// INTERFACE DE STATS
// ==========================================

export interface StructureBaseStats {
  hp: number;
  armor: number;
  magicResist: number;
  attackDamage: number;
  attackSpeed: number;  // Ataques por segundo (0.833 = 1.2s entre ataques)
  attackRange: number;
  goldReward: number;
  canAttack: boolean;
}

// ==========================================
// STATS SUMMONER'S RIFT
// ==========================================

export const SR_STRUCTURE_STATS: Record<StructureType, StructureBaseStats> = {
  outer_tower: {
    hp: 5000,
    armor: 40,
    magicResist: 40,
    attackDamage: 152,
    attackSpeed: 0.833,
    attackRange: 750,
    goldReward: 550,
    canAttack: true,
  },
  inner_tower: {
    hp: 3500,
    armor: 55,
    magicResist: 55,
    attackDamage: 170,
    attackSpeed: 0.833,
    attackRange: 750,
    goldReward: 550,
    canAttack: true,
  },
  inhibitor_tower: {
    hp: 3300,
    armor: 70,
    magicResist: 70,
    attackDamage: 180,
    attackSpeed: 0.833,
    attackRange: 750,
    goldReward: 550,
    canAttack: true,
  },
  nexus_tower: {
    hp: 2700,
    armor: 70,
    magicResist: 70,
    attackDamage: 150,
    attackSpeed: 0.833,
    attackRange: 750,
    goldReward: 0, // Torres do Nexus não dão gold
    canAttack: true,
  },
  inhibitor: {
    hp: 4000,
    armor: 20,
    magicResist: 20,
    attackDamage: 0,
    attackSpeed: 0,
    attackRange: 0,
    goldReward: 50,
    canAttack: false,
  },
  nexus: {
    hp: 5500,
    armor: 20,
    magicResist: 20,
    attackDamage: 0,
    attackSpeed: 0,
    attackRange: 0,
    goldReward: 0, // Fim de jogo
    canAttack: false,
  },
};

// ==========================================
// STATS HOWLING ABYSS (ARAM)
// ==========================================

// ARAM tem torres que escalam com número de inimigos
export const ARAM_STRUCTURE_STATS: Record<StructureType, StructureBaseStats> = {
  outer_tower: {
    hp: 1300, // + 250 por champion inimigo
    armor: 60, // escala 60-81 com tempo
    magicResist: 60,
    attackDamage: 185, // escala 185-293
    attackSpeed: 0.833,
    attackRange: 750,
    goldReward: 550,
    canAttack: true,
  },
  inner_tower: {
    hp: 2600, // + 250 por champion
    armor: 62,
    magicResist: 62,
    attackDamage: 195,
    attackSpeed: 0.833,
    attackRange: 750,
    goldReward: 550,
    canAttack: true,
  },
  inhibitor_tower: {
    hp: 3900, // + 250 por champion
    armor: 63,
    magicResist: 63,
    attackDamage: 205,
    attackSpeed: 0.833,
    attackRange: 750,
    goldReward: 550,
    canAttack: true,
  },
  nexus_tower: {
    hp: 1800, // + 250 por champion
    armor: 60,
    magicResist: 60,
    attackDamage: 195,
    attackSpeed: 0.833,
    attackRange: 750,
    goldReward: 0,
    canAttack: true,
  },
  inhibitor: {
    hp: 3500,
    armor: 20,
    magicResist: 20,
    attackDamage: 0,
    attackSpeed: 0,
    attackRange: 0,
    goldReward: 50,
    canAttack: false,
  },
  nexus: {
    hp: 5500,
    armor: 20,
    magicResist: 20,
    attackDamage: 0,
    attackSpeed: 0,
    attackRange: 0,
    goldReward: 0,
    canAttack: false,
  },
};

// ==========================================
// TOWER TARGETING SYSTEM
// ==========================================

// Prioridade de alvos (menor número = maior prioridade)
export enum TowerTargetPriority {
  PET = 1,           // Tibbers, Daisy, Voidlings
  SIEGE_MINION = 2,  // Cannon minion
  SUPER_MINION = 3,
  MELEE_MINION = 4,
  CASTER_MINION = 5,
  CHAMPION = 6,      // MENOR prioridade
}

// Ranges especiais
export const TOWER_AGGRO_DETECTION_RANGE = 1400; // Range para detectar dano a aliados
export const TOWER_ATTACK_RANGE = 750;

// ==========================================
// TOWER DAMAGE RAMPING
// ==========================================

export const TOWER_DAMAGE_RAMP = {
  multiplierPerHit: 0.4, // +40% por hit consecutivo
  maxMultiplier: 2.2,    // 220% total (3 stacks)
};

/**
 * Calcula dano de torre com ramping
 */
export function calculateTowerDamageWithRamp(baseDamage: number, consecutiveHits: number): number {
  const multiplier = Math.min(
    1 + consecutiveHits * TOWER_DAMAGE_RAMP.multiplierPerHit,
    TOWER_DAMAGE_RAMP.maxMultiplier
  );
  return baseDamage * multiplier;
}

// ==========================================
// TOWER STATS SCALING
// ==========================================

export interface TowerScaling {
  armorPerMinute: number;
  mrPerMinute: number;
  damagePerMinute: number;
  maxScalingMinutes: number;
}

export const ARAM_TOWER_SCALING: TowerScaling = {
  armorPerMinute: 1.4,   // 60 -> 81 em 15 minutos
  mrPerMinute: 1.4,
  damagePerMinute: 7.2,  // 185 -> 293 em 15 minutos
  maxScalingMinutes: 15,
};

/**
 * Calcula stats de torre ARAM com scaling de tempo
 */
export function getARAMTowerStats(
  type: StructureType,
  gameTimeMs: number,
  enemyChampions: number
): StructureBaseStats {
  const base = { ...ARAM_STRUCTURE_STATS[type] };

  // HP adicional por champion inimigo
  if (type.includes('tower')) {
    base.hp += 250 * enemyChampions;
  }

  // Scaling por tempo (primeiros 15 minutos)
  const minutes = Math.min(ARAM_TOWER_SCALING.maxScalingMinutes, gameTimeMs / 60_000);

  if (base.canAttack) {
    base.armor += Math.floor(ARAM_TOWER_SCALING.armorPerMinute * minutes);
    base.magicResist += Math.floor(ARAM_TOWER_SCALING.mrPerMinute * minutes);
    base.attackDamage += Math.floor(ARAM_TOWER_SCALING.damagePerMinute * minutes);
  }

  return base;
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Retorna tempo de ataque em ms
 */
export function getTowerAttackInterval(type: StructureType): number {
  const stats = SR_STRUCTURE_STATS[type];
  if (!stats.canAttack || stats.attackSpeed === 0) return Infinity;
  return 1000 / stats.attackSpeed;
}

/**
 * Verifica se é uma torre (pode atacar)
 */
export function isTower(type: StructureType): boolean {
  return type.includes('tower');
}

/**
 * Retorna cor da estrutura para debug
 */
export function getStructureColor(type: StructureType, team: 'blue' | 'red' | 'neutral'): string {
  const baseColors = {
    blue: {
      outer_tower: '#3b82f6',
      inner_tower: '#2563eb',
      inhibitor_tower: '#1d4ed8',
      nexus_tower: '#1e40af',
      inhibitor: '#60a5fa',
      nexus: '#93c5fd',
    },
    red: {
      outer_tower: '#ef4444',
      inner_tower: '#dc2626',
      inhibitor_tower: '#b91c1c',
      nexus_tower: '#991b1b',
      inhibitor: '#f87171',
      nexus: '#fca5a5',
    },
    neutral: {
      outer_tower: '#888888',
      inner_tower: '#777777',
      inhibitor_tower: '#666666',
      nexus_tower: '#555555',
      inhibitor: '#999999',
      nexus: '#aaaaaa',
    },
  };

  return baseColors[team][type];
}

/**
 * Retorna dimensões da estrutura
 */
export function getStructureDimensions(type: StructureType): { width: number; height: number } {
  if (type.includes('tower')) {
    return { width: 80, height: 80 };
  }
  if (type === 'inhibitor') {
    return { width: 70, height: 70 };
  }
  if (type === 'nexus') {
    return { width: 100, height: 100 };
  }
  return { width: 60, height: 60 };
}
