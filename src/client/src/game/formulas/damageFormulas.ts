// ==========================================
// FÓRMULAS DE DANO - BASEADO NA WIKI OFICIAL DO LOL
// ==========================================

/**
 * Calcula o dano após mitigação por resistência (armor/MR)
 * Fórmula oficial: postMitigationDamage = preMitigationDamage / (1 + resistance / 100)
 *
 * @param rawDamage - Dano bruto antes da mitigação
 * @param resistance - Armor (para dano físico) ou MR (para dano mágico)
 * @returns Dano após mitigação
 */
export function calculateMitigatedDamage(rawDamage: number, resistance: number): number {
  // Resistência negativa aumenta o dano
  if (resistance >= 0) {
    return rawDamage / (1 + resistance / 100);
  } else {
    // Fórmula para resistência negativa: dano * (2 - 100 / (100 - resistance))
    return rawDamage * (2 - 100 / (100 - resistance));
  }
}

/**
 * Calcula a porcentagem de redução de dano baseado na resistência
 * @param resistance - Valor de armor ou MR
 * @returns Porcentagem de redução (0-1)
 */
export function getDamageReductionPercent(resistance: number): number {
  if (resistance >= 0) {
    return resistance / (100 + resistance);
  } else {
    // Resistência negativa = amplificação de dano
    return resistance / (100 - resistance);
  }
}

/**
 * Calcula a vida efetiva contra um tipo de dano
 * Cada 1 ponto de resistência = +1% de vida efetiva
 *
 * @param health - HP atual
 * @param resistance - Armor ou MR
 * @returns Vida efetiva contra esse tipo de dano
 */
export function calculateEffectiveHealth(health: number, resistance: number): number {
  return health * (1 + resistance / 100);
}

// ==========================================
// SISTEMA DE PENETRAÇÃO
// ==========================================

/**
 * Ordem de aplicação de penetração (Wiki oficial):
 * 1. Flat Armor Reduction (ex: Corki E)
 * 2. Percentage Armor Reduction (ex: Black Cleaver stacks)
 * 3. Percentage Armor Penetration (ex: Lord Dominik's Regards)
 * 4. Lethality / Flat Armor Penetration
 */
export interface PenetrationStats {
  flatReduction: number;      // Redução flat (reduz para todos)
  percentReduction: number;   // Redução % (reduz para todos, ex: Black Cleaver)
  percentPenetration: number; // Penetração % (ignora para o atacante)
  lethality: number;          // Lethality (flat pen que escala com level)
}

/**
 * Calcula a armor/MR efetiva após aplicar toda a penetração
 *
 * @param baseResistance - Resistência base do alvo
 * @param penetration - Stats de penetração do atacante
 * @param attackerLevel - Level do atacante (para escalar lethality)
 * @returns Resistência efetiva após penetração
 */
export function calculateEffectiveResistance(
  baseResistance: number,
  penetration: PenetrationStats,
  attackerLevel: number
): number {
  // Lethality escala com level do atacante
  // flatPen = lethality * (0.6 + 0.4 * attackerLevel / 18)
  const flatPen = penetration.lethality * (0.6 + 0.4 * attackerLevel / 18);

  let resistance = baseResistance;

  // 1. Flat Reduction
  resistance -= penetration.flatReduction;

  // 2. Percentage Reduction
  resistance *= (1 - penetration.percentReduction / 100);

  // 3. Percentage Penetration
  resistance *= (1 - penetration.percentPenetration / 100);

  // 4. Lethality (Flat Penetration)
  resistance -= flatPen;

  // Resistência não pode ser negativa após penetração
  return Math.max(0, resistance);
}

/**
 * Calcula dano final aplicando penetração e mitigação
 *
 * @param rawDamage - Dano bruto
 * @param targetResistance - Resistência do alvo
 * @param penetration - Stats de penetração do atacante
 * @param attackerLevel - Level do atacante
 * @returns Dano final após todas as reduções
 */
export function calculateFinalDamage(
  rawDamage: number,
  targetResistance: number,
  penetration: PenetrationStats,
  attackerLevel: number
): number {
  const effectiveResistance = calculateEffectiveResistance(
    targetResistance,
    penetration,
    attackerLevel
  );

  return calculateMitigatedDamage(rawDamage, effectiveResistance);
}

// ==========================================
// DANO DE TORRE
// ==========================================

/**
 * Calcula dano de torre com ramping (warming up)
 * Torres causam +40% por hit consecutivo, até 120% extra (220% total)
 *
 * @param baseDamage - Dano base da torre
 * @param consecutiveHits - Número de hits consecutivos no mesmo alvo
 * @returns Dano da torre
 */
export function calculateTowerDamage(baseDamage: number, consecutiveHits: number): number {
  // +40% por hit, máximo de 3 stacks (120% extra = 220% total)
  const rampMultiplier = Math.min(1 + consecutiveHits * 0.4, 2.2);
  return baseDamage * rampMultiplier;
}

// ==========================================
// DANO DE MINION
// ==========================================

// Minions causam 60% do dano contra champions e estruturas
export const MINION_DAMAGE_VS_CHAMPIONS = 0.6;
export const MINION_DAMAGE_VS_STRUCTURES = 0.6;

/**
 * Calcula dano de minion contra champions ou estruturas
 */
export function calculateMinionDamage(baseDamage: number, targetType: 'champion' | 'structure' | 'minion'): number {
  switch (targetType) {
    case 'champion':
      return baseDamage * MINION_DAMAGE_VS_CHAMPIONS;
    case 'structure':
      return baseDamage * MINION_DAMAGE_VS_STRUCTURES;
    case 'minion':
    default:
      return baseDamage;
  }
}

// ==========================================
// TIPOS DE DANO
// ==========================================

export type DamageType = 'physical' | 'magical' | 'true';

export interface DamageInstance {
  amount: number;
  type: DamageType;
  source: string; // ID da entidade que causou o dano
  isCritical?: boolean;
  penetration?: PenetrationStats;
}

/**
 * Calcula o dano final baseado no tipo
 */
export function applyDamage(
  damage: DamageInstance,
  targetArmor: number,
  targetMR: number,
  attackerLevel: number = 1
): number {
  const defaultPen: PenetrationStats = {
    flatReduction: 0,
    percentReduction: 0,
    percentPenetration: 0,
    lethality: 0,
  };

  const pen = damage.penetration || defaultPen;

  switch (damage.type) {
    case 'physical':
      return calculateFinalDamage(damage.amount, targetArmor, pen, attackerLevel);

    case 'magical':
      return calculateFinalDamage(damage.amount, targetMR, pen, attackerLevel);

    case 'true':
      // True damage ignora todas as resistências
      return damage.amount;

    default:
      return damage.amount;
  }
}
