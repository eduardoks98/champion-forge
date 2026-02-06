// ==========================================
// FÓRMULAS DE STATS - BASEADO NA WIKI OFICIAL DO LOL
// ==========================================

/**
 * Fórmula oficial de crescimento de stats por level
 * stat = base + bonus + growth * (level - 1) * (0.7025 + 0.0175 * (level - 1))
 *
 * @param baseStat - Stat base no level 1
 * @param growthPerLevel - Crescimento por level
 * @param level - Level atual (1-18)
 * @param bonusFromItems - Bônus de itens/buffs
 * @returns Stat final
 */
export function calculateStatAtLevel(
  baseStat: number,
  growthPerLevel: number,
  level: number,
  bonusFromItems: number = 0
): number {
  const clampedLevel = Math.max(1, Math.min(18, level));
  const levelMultiplier = (clampedLevel - 1) * (0.7025 + 0.0175 * (clampedLevel - 1));
  return baseStat + bonusFromItems + (growthPerLevel * levelMultiplier);
}

/**
 * Calcula o ganho incremental de stat por level up
 * statIncrease = growth * (0.65 + 0.035 * currentLevel)
 *
 * @param growthPerLevel - Crescimento por level
 * @param currentLevel - Level atual antes do level up
 * @returns Quantidade de stat ganha
 */
export function calculateStatGainOnLevelUp(growthPerLevel: number, currentLevel: number): number {
  return growthPerLevel * (0.65 + 0.035 * currentLevel);
}

// ==========================================
// ATTACK SPEED
// ==========================================

// Caps oficiais de Attack Speed
export const MIN_ATTACK_SPEED = 0.2;
export const MAX_ATTACK_SPEED = 2.5;

/**
 * Calcula Attack Speed total
 * Fórmula: totalAS = baseAS * (1 + bonusAS%)
 *
 * Para champions com attack speed ratio diferente:
 * totalAS = baseAS + (bonusAS% + growthAS) * attackSpeedRatio
 *
 * @param baseAS - Attack Speed base (level 1)
 * @param bonusASPercent - Bônus de AS% de itens/abilities
 * @param asRatio - Attack Speed Ratio (maioria = baseAS)
 * @returns Attack Speed final (clampado)
 */
export function calculateAttackSpeed(
  baseAS: number,
  bonusASPercent: number,
  asRatio: number = baseAS
): number {
  const totalAS = baseAS + (bonusASPercent / 100) * asRatio;
  return Math.max(MIN_ATTACK_SPEED, Math.min(MAX_ATTACK_SPEED, totalAS));
}

/**
 * Calcula o intervalo entre ataques em milissegundos
 */
export function getAttackIntervalMs(attackSpeed: number): number {
  return 1000 / attackSpeed;
}

/**
 * Calcula o bônus de AS% por level
 * Usa a mesma fórmula de crescimento de stats
 */
export function calculateASBonusFromLevel(asPerLevel: number, level: number): number {
  const levelMultiplier = (level - 1) * (0.7025 + 0.0175 * (level - 1));
  return asPerLevel * levelMultiplier;
}

// ==========================================
// MOVEMENT SPEED
// ==========================================

/**
 * Calcula Movement Speed final com soft caps
 * Fórmula base: finalMS = (baseMS + flatBonus) * (1 + sumOfPercentBonuses) * (1 - highestSlow)
 *
 * Soft caps:
 * - > 490: excesso é reduzido a 50%
 * - > 415: excesso é reduzido a 80%
 * - < 220: reduzido a 50% + 110
 *
 * @param rawMS - Movement Speed antes dos soft caps
 * @returns Movement Speed final
 */
export function calculateMoveSpeed(rawMS: number): number {
  // Soft cap superior
  if (rawMS > 490) {
    return (rawMS - 490) * 0.5 + (490 - 415) * 0.8 + 415;
  } else if (rawMS > 415) {
    return (rawMS - 415) * 0.8 + 415;
  }

  // Soft cap inferior (minimum MS)
  if (rawMS < 220) {
    return rawMS * 0.5 + 110;
  }

  return rawMS;
}

/**
 * Calcula MS com slows aplicados
 * IMPORTANTE: Slows NÃO stackam - apenas o maior é aplicado!
 *
 * @param baseMS - MS base do champion
 * @param flatBonuses - Soma de todos os bônus flat
 * @param percentBonuses - Soma de todos os bônus %
 * @param highestSlowPercent - O maior slow aplicado (0-100)
 * @param slowResistPercent - Resistência a slow (0-100)
 * @returns MS final após soft caps
 */
export function calculateFinalMoveSpeed(
  baseMS: number,
  flatBonuses: number,
  percentBonuses: number,
  highestSlowPercent: number = 0,
  slowResistPercent: number = 0
): number {
  // Slow resist reduz multiplicativamente
  // Ex: 40% slow com 50% resist = 40% * (1 - 0.5) = 20% slow
  const effectiveSlow = highestSlowPercent * (1 - slowResistPercent / 100);

  // Fórmula base
  const rawMS = (baseMS + flatBonuses) * (1 + percentBonuses / 100) * (1 - effectiveSlow / 100);

  // Aplicar soft caps
  return calculateMoveSpeed(rawMS);
}

// ==========================================
// ABILITY HASTE / COOLDOWN REDUCTION
// ==========================================

/**
 * Calcula CDR a partir de Ability Haste
 * Fórmula: CDR% = haste / (haste + 100)
 *
 * Exemplos:
 * - 0 Haste = 0% CDR
 * - 50 Haste = 33.3% CDR
 * - 100 Haste = 50% CDR
 * - 150 Haste = 60% CDR
 *
 * @param abilityHaste - Valor de Ability Haste
 * @returns CDR como decimal (0-1)
 */
export function hasteToCDR(abilityHaste: number): number {
  return abilityHaste / (abilityHaste + 100);
}

/**
 * Calcula cooldown final de uma habilidade
 *
 * @param baseCooldown - Cooldown base em segundos
 * @param abilityHaste - Valor de Ability Haste
 * @returns Cooldown final em segundos
 */
export function calculateCooldown(baseCooldown: number, abilityHaste: number): number {
  const cdr = hasteToCDR(abilityHaste);
  return baseCooldown * (1 - cdr);
}

/**
 * Calcula cooldown final em milissegundos
 */
export function calculateCooldownMs(baseCooldownMs: number, abilityHaste: number): number {
  const cdr = hasteToCDR(abilityHaste);
  return baseCooldownMs * (1 - cdr);
}

// ==========================================
// HEALTH REGEN
// ==========================================

/**
 * Calcula HP regenerado por tick
 * HP regen é mostrado como "per 5 seconds" no jogo
 *
 * @param hpRegenPer5s - HP regen por 5 segundos
 * @param deltaTimeMs - Tempo desde último tick em ms
 * @returns HP a regenerar
 */
export function calculateHpRegen(hpRegenPer5s: number, deltaTimeMs: number): number {
  return (hpRegenPer5s / 5000) * deltaTimeMs;
}

/**
 * Calcula Mana regenerado por tick
 */
export function calculateManaRegen(manaRegenPer5s: number, deltaTimeMs: number): number {
  return (manaRegenPer5s / 5000) * deltaTimeMs;
}

// ==========================================
// CRITICAL STRIKE
// ==========================================

/**
 * Calcula dano crítico
 * Por padrão, crítico = 175% do dano base
 *
 * @param baseDamage - Dano base do ataque
 * @param critMultiplier - Multiplicador de crítico (padrão 1.75)
 * @returns Dano crítico
 */
export function calculateCritDamage(baseDamage: number, critMultiplier: number = 1.75): number {
  return baseDamage * critMultiplier;
}

/**
 * Determina se um ataque é crítico
 *
 * @param critChance - Chance de crítico (0-100)
 * @returns true se for crítico
 */
export function rollCritical(critChance: number): boolean {
  return Math.random() * 100 < critChance;
}

// ==========================================
// LIFE STEAL / OMNIVAMP
// ==========================================

/**
 * Calcula cura por life steal
 *
 * @param damageDealt - Dano causado
 * @param lifeStealPercent - % de life steal
 * @returns HP curado
 */
export function calculateLifeSteal(damageDealt: number, lifeStealPercent: number): number {
  return damageDealt * (lifeStealPercent / 100);
}

/**
 * Calcula cura por omnivamp (funciona com todo tipo de dano)
 * Habilidades AoE têm eficiência reduzida (33%)
 *
 * @param damageDealt - Dano causado
 * @param omnivampPercent - % de omnivamp
 * @param isAoE - Se o dano é de área
 * @returns HP curado
 */
export function calculateOmnivamp(
  damageDealt: number,
  omnivampPercent: number,
  isAoE: boolean = false
): number {
  const effectivePercent = isAoE ? omnivampPercent * 0.33 : omnivampPercent;
  return damageDealt * (effectivePercent / 100);
}

// ==========================================
// TENACITY (CROWD CONTROL REDUCTION)
// ==========================================

/**
 * Calcula duração de CC após tenacity
 *
 * @param baseDuration - Duração base do CC em ms
 * @param tenacityPercent - % de tenacity
 * @returns Duração final do CC
 */
export function calculateCCDuration(baseDuration: number, tenacityPercent: number): number {
  return baseDuration * (1 - tenacityPercent / 100);
}
