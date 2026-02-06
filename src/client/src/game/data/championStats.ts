// ==========================================
// STATS DE CHAMPIONS - BASEADO NA WIKI OFICIAL DO LOL
// ==========================================

// ==========================================
// INTERFACE DE STATS
// ==========================================

export interface ChampionBaseStats {
  // Stats base (level 1)
  hp: number;              // 500-650
  hpRegen: number;         // 3-9 per 5s
  mana: number;            // 250-500 (ou 0 se resourceless)
  manaRegen: number;       // 6-12 per 5s
  attackDamage: number;    // 50-70
  attackSpeed: number;     // 0.625-0.694 (base)
  armor: number;           // 20-45
  magicResist: number;     // 30-32 (melee) ou 30 (ranged)
  moveSpeed: number;       // 325-355
  attackRange: number;     // 125 (melee) ou 500-650 (ranged)

  // Growth per level
  hpPerLevel: number;           // 85-120
  hpRegenPerLevel: number;      // 0.5-1.0
  manaPerLevel: number;         // 30-60
  manaRegenPerLevel: number;    // 0.5-1.0
  adPerLevel: number;           // 2.5-5.0
  attackSpeedPerLevel: number;  // 1.5-4.0%
  armorPerLevel: number;        // 3.5-5.0
  mrPerLevel: number;           // 0.5-2.0

  // Attack speed ratio (maioria é igual ao base)
  attackSpeedRatio?: number;
}

// ==========================================
// STATS PADRÃO PARA O JOGO
// ==========================================

// Stats do jogador padrão (fighter melee genérico)
export const DEFAULT_PLAYER_STATS: ChampionBaseStats = {
  hp: 580,
  hpRegen: 6,
  mana: 300,
  manaRegen: 8,
  attackDamage: 60,
  attackSpeed: 0.658,
  armor: 35,
  magicResist: 32,
  moveSpeed: 345,
  attackRange: 125,

  hpPerLevel: 95,
  hpRegenPerLevel: 0.75,
  manaPerLevel: 40,
  manaRegenPerLevel: 0.7,
  adPerLevel: 3.5,
  attackSpeedPerLevel: 2.5,
  armorPerLevel: 4.2,
  mrPerLevel: 1.5,
};

// Stats de inimigo genérico (menos fortes que player)
export const DEFAULT_ENEMY_STATS: ChampionBaseStats = {
  hp: 520,
  hpRegen: 5,
  mana: 0,
  manaRegen: 0,
  attackDamage: 52,
  attackSpeed: 0.625,
  armor: 28,
  magicResist: 30,
  moveSpeed: 330,
  attackRange: 125,

  hpPerLevel: 85,
  hpRegenPerLevel: 0.5,
  manaPerLevel: 0,
  manaRegenPerLevel: 0,
  adPerLevel: 3,
  attackSpeedPerLevel: 2.0,
  armorPerLevel: 3.5,
  mrPerLevel: 1.0,
};

// ==========================================
// CLASSES DE CHAMPION
// ==========================================

export type ChampionClass =
  | 'fighter'   // Bruisers - melee com dano e tankiness
  | 'tank'      // Tanks - muita vida e resistências
  | 'mage'      // Mages - dano mágico ranged
  | 'marksman'  // ADCs - dano físico ranged
  | 'assassin'  // Assassins - burst damage
  | 'support';  // Supports - utility

// Stats por classe (modificadores sobre o default)
export const CLASS_STAT_MODIFIERS: Record<ChampionClass, Partial<ChampionBaseStats>> = {
  fighter: {
    hp: 600,
    armor: 38,
    attackDamage: 65,
    moveSpeed: 345,
  },
  tank: {
    hp: 650,
    armor: 45,
    magicResist: 36,
    attackDamage: 55,
    hpPerLevel: 110,
    armorPerLevel: 4.5,
  },
  mage: {
    hp: 500,
    mana: 400,
    armor: 22,
    attackDamage: 52,
    attackRange: 550,
    manaPerLevel: 50,
  },
  marksman: {
    hp: 520,
    armor: 24,
    attackDamage: 58,
    attackSpeed: 0.694,
    attackRange: 550,
    attackSpeedPerLevel: 3.5,
  },
  assassin: {
    hp: 550,
    armor: 30,
    attackDamage: 60,
    moveSpeed: 355,
    adPerLevel: 4.0,
  },
  support: {
    hp: 530,
    hpRegen: 7,
    mana: 350,
    manaRegen: 11,
    attackDamage: 48,
    armor: 30,
  },
};

// ==========================================
// FUNÇÕES HELPER
// ==========================================

/**
 * Combina stats base com modificadores de classe
 */
export function getClassStats(baseStats: ChampionBaseStats, championClass: ChampionClass): ChampionBaseStats {
  const modifiers = CLASS_STAT_MODIFIERS[championClass];
  return {
    ...baseStats,
    ...modifiers,
  };
}

/**
 * Cria stats para um champion customizado
 */
export function createChampionStats(
  overrides: Partial<ChampionBaseStats> = {},
  base: ChampionBaseStats = DEFAULT_PLAYER_STATS
): ChampionBaseStats {
  return {
    ...base,
    ...overrides,
  };
}

// ==========================================
// ENTITY STATE INTERFACE
// ==========================================

export interface EntityStats {
  // Stats atuais (com growth aplicado)
  maxHp: number;
  currentHp: number;
  hpRegen: number;

  maxMana: number;
  currentMana: number;
  manaRegen: number;

  attackDamage: number;
  attackSpeed: number;
  armor: number;
  magicResist: number;
  moveSpeed: number;
  attackRange: number;

  // Bônus de itens/buffs
  bonusHp: number;
  bonusMana: number;
  bonusAd: number;
  bonusArmor: number;
  bonusMr: number;
  bonusAs: number;
  bonusMs: number;

  // Stats ofensivas extras
  abilityHaste: number;
  critChance: number;
  critDamage: number;
  lifeSteal: number;
  omnivamp: number;

  // Penetração
  armorPen: number;       // Flat (lethality)
  armorPenPercent: number;
  magicPen: number;       // Flat
  magicPenPercent: number;

  // Defensivo
  tenacity: number;
  slowResist: number;
}

/**
 * Cria stats iniciais para uma entidade
 */
export function createEntityStats(base: ChampionBaseStats, level: number = 1): EntityStats {
  // Importar fórmula de stat growth
  const calculateStat = (baseStat: number, growth: number) => {
    const levelMultiplier = (level - 1) * (0.7025 + 0.0175 * (level - 1));
    return baseStat + growth * levelMultiplier;
  };

  const maxHp = calculateStat(base.hp, base.hpPerLevel);
  const maxMana = calculateStat(base.mana, base.manaPerLevel);

  return {
    maxHp,
    currentHp: maxHp,
    hpRegen: calculateStat(base.hpRegen, base.hpRegenPerLevel),

    maxMana,
    currentMana: maxMana,
    manaRegen: calculateStat(base.manaRegen, base.manaRegenPerLevel),

    attackDamage: calculateStat(base.attackDamage, base.adPerLevel),
    attackSpeed: base.attackSpeed * (1 + calculateStat(0, base.attackSpeedPerLevel) / 100),
    armor: calculateStat(base.armor, base.armorPerLevel),
    magicResist: calculateStat(base.magicResist, base.mrPerLevel),
    moveSpeed: base.moveSpeed,
    attackRange: base.attackRange,

    // Bônus (começa em 0)
    bonusHp: 0,
    bonusMana: 0,
    bonusAd: 0,
    bonusArmor: 0,
    bonusMr: 0,
    bonusAs: 0,
    bonusMs: 0,

    // Stats extras
    abilityHaste: 0,
    critChance: 0,
    critDamage: 175, // 175% por padrão
    lifeSteal: 0,
    omnivamp: 0,

    // Penetração
    armorPen: 0,
    armorPenPercent: 0,
    magicPen: 0,
    magicPenPercent: 0,

    // Defensivo
    tenacity: 0,
    slowResist: 0,
  };
}

/**
 * Recalcula stats quando level up
 */
export function recalculateStatsForLevel(
  currentStats: EntityStats,
  baseStats: ChampionBaseStats,
  newLevel: number
): EntityStats {
  const newBase = createEntityStats(baseStats, newLevel);

  // Manter HP/Mana atual proporcionalmente
  const hpPercent = currentStats.currentHp / currentStats.maxHp;
  const manaPercent = currentStats.maxMana > 0 ? currentStats.currentMana / currentStats.maxMana : 1;

  return {
    ...currentStats,
    maxHp: newBase.maxHp + currentStats.bonusHp,
    currentHp: Math.floor((newBase.maxHp + currentStats.bonusHp) * hpPercent),
    hpRegen: newBase.hpRegen,

    maxMana: newBase.maxMana + currentStats.bonusMana,
    currentMana: Math.floor((newBase.maxMana + currentStats.bonusMana) * manaPercent),
    manaRegen: newBase.manaRegen,

    attackDamage: newBase.attackDamage + currentStats.bonusAd,
    attackSpeed: newBase.attackSpeed * (1 + currentStats.bonusAs / 100),
    armor: newBase.armor + currentStats.bonusArmor,
    magicResist: newBase.magicResist + currentStats.bonusMr,
  };
}
