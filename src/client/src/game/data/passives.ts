// Passivas do Personagem - Sistema de builds sem classes
// Cada jogador equipa 1 passiva única no slot P

import { WeaponType } from './weapons';
import { ScalingStat } from './abilities';

// Categorias de passivas
export type PassiveCategory = 'offensive' | 'defensive' | 'utility' | 'hybrid';

// Tipos de efeito de passiva
export type PassiveEffectType =
  | 'stat_bonus'        // Bonus constante em stat
  | 'on_hit'            // Ativa ao acertar ataque
  | 'on_kill'           // Ativa ao matar inimigo
  | 'on_damage_taken'   // Ativa ao receber dano
  | 'conditional'       // Ativa em condição específica
  | 'aura';             // Efeito de área constante

// Definição de uma passiva
export interface PassiveDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: PassiveCategory;
  effect: {
    type: PassiveEffectType;
    stat?: ScalingStat;
    bonusPercent?: number;     // Ex: 0.3 = +30%
    bonusFlat?: number;        // Ex: 10 = +10
    trigger?: string;          // Ex: 'below_30_hp', 'after_kill', 'in_combat'
    triggerValue?: number;     // Valor do trigger (ex: 30 para below_30_hp)
    cooldown?: number;         // Cooldown interno em ms (se aplicável)
    duration?: number;         // Duração do efeito em ms (se aplicável)
    healPercent?: number;      // % de cura (ex: 0.05 = 5%)
    dodgeChance?: number;      // Chance de esquiva (0-1)
    damageReduction?: number;  // Redução de dano (0-1)
  };
  requiredWeaponTypes?: WeaponType[];  // Algumas passivas só funcionam com certas armas
}

// ======================================================================
// PASSIVAS DO PERSONAGEM - 15 passivas iniciais
// ======================================================================

export const PASSIVES: Record<string, PassiveDefinition> = {
  // ==================== OFFENSIVAS (5) ====================
  berserker: {
    id: 'berserker',
    name: 'Berserker',
    icon: '🔥',
    description: '+30% de dano quando HP está abaixo de 30%',
    category: 'offensive',
    effect: {
      type: 'conditional',
      trigger: 'below_hp_percent',
      triggerValue: 30,
      bonusPercent: 0.3,
    },
  },

  vampiric: {
    id: 'vampiric',
    name: 'Vampirismo',
    icon: '🩸',
    description: 'Cura 5% do dano causado',
    category: 'offensive',
    effect: {
      type: 'on_hit',
      healPercent: 0.05,
    },
  },

  executioner: {
    id: 'executioner',
    name: 'Executor',
    icon: '💀',
    description: '+50% de dano em inimigos com menos de 20% HP',
    category: 'offensive',
    effect: {
      type: 'conditional',
      trigger: 'enemy_below_hp_percent',
      triggerValue: 20,
      bonusPercent: 0.5,
    },
  },

  criticalMastery: {
    id: 'criticalMastery',
    name: 'Maestria Crítica',
    icon: '⚡',
    description: '+15% de chance de crítico e +25% de dano crítico',
    category: 'offensive',
    effect: {
      type: 'stat_bonus',
      bonusPercent: 0.15,  // crit chance
      bonusFlat: 25,       // crit damage bonus
    },
  },

  relentless: {
    id: 'relentless',
    name: 'Implacável',
    icon: '🏃',
    description: '+20% de dano após matar um inimigo (5s)',
    category: 'offensive',
    effect: {
      type: 'on_kill',
      bonusPercent: 0.2,
      duration: 5000,
    },
  },

  // ==================== DEFENSIVAS (5) ====================
  ironWill: {
    id: 'ironWill',
    name: 'Vontade de Ferro',
    icon: '🛡️',
    description: '-15% de dano recebido',
    category: 'defensive',
    effect: {
      type: 'stat_bonus',
      damageReduction: 0.15,
    },
  },

  quickReflexes: {
    id: 'quickReflexes',
    name: 'Reflexos Rápidos',
    icon: '👁️',
    description: '10% de chance de esquivar ataques',
    category: 'defensive',
    effect: {
      type: 'stat_bonus',
      dodgeChance: 0.1,
    },
  },

  lastStand: {
    id: 'lastStand',
    name: 'Última Resistência',
    icon: '💫',
    description: 'Sobrevive a um golpe fatal com 1 HP (1x por partida)',
    category: 'defensive',
    effect: {
      type: 'on_damage_taken',
      trigger: 'fatal_damage',
      cooldown: -1,  // -1 = uma vez por partida
    },
  },

  secondWind: {
    id: 'secondWind',
    name: 'Segundo Fôlego',
    icon: '💨',
    description: 'Regenera 2% HP por segundo quando abaixo de 50% HP',
    category: 'defensive',
    effect: {
      type: 'conditional',
      trigger: 'below_hp_percent',
      triggerValue: 50,
      healPercent: 0.02,
    },
  },

  thorns: {
    id: 'thorns',
    name: 'Espinhos',
    icon: '🌵',
    description: 'Reflete 20% do dano recebido de volta ao atacante',
    category: 'defensive',
    effect: {
      type: 'on_damage_taken',
      bonusPercent: 0.2,
    },
  },

  // ==================== UTILIDADE (3) ====================
  manaFlow: {
    id: 'manaFlow',
    name: 'Fluxo de Mana',
    icon: '💙',
    description: '+30% de regeneração de mana',
    category: 'utility',
    effect: {
      type: 'stat_bonus',
      stat: 'INT',
      bonusPercent: 0.3,
    },
  },

  swiftness: {
    id: 'swiftness',
    name: 'Rapidez',
    icon: '🌪️',
    description: '+15% de velocidade de movimento',
    category: 'utility',
    effect: {
      type: 'stat_bonus',
      stat: 'DEX',
      bonusPercent: 0.15,
    },
  },

  cooldownReduction: {
    id: 'cooldownReduction',
    name: 'Agilidade Mental',
    icon: '⏱️',
    description: '-10% de cooldown em todas as habilidades',
    category: 'utility',
    effect: {
      type: 'stat_bonus',
      bonusPercent: -0.1,  // Negativo porque reduz
    },
  },

  // ==================== HÍBRIDAS (2) - Requerem armas específicas ====================
  blademaster: {
    id: 'blademaster',
    name: 'Mestre das Lâminas',
    icon: '⚔️',
    description: '+10% attack speed, +5% crit (apenas espadas/adagas)',
    category: 'hybrid',
    effect: {
      type: 'stat_bonus',
      bonusPercent: 0.1,
      bonusFlat: 5,
    },
    requiredWeaponTypes: ['sword', 'dagger'],
  },

  arcaneAffinity: {
    id: 'arcaneAffinity',
    name: 'Afinidade Arcana',
    icon: '🔮',
    description: '+20% dano mágico, -10% HP max (apenas cajados)',
    category: 'hybrid',
    effect: {
      type: 'stat_bonus',
      stat: 'INT',
      bonusPercent: 0.2,
      bonusFlat: -10,  // Redução de HP
    },
    requiredWeaponTypes: ['staff'],
  },
};

// ======================================================================
// HELPER FUNCTIONS
// ======================================================================

// Obter passiva pelo ID
export function getPassive(id: string): PassiveDefinition | undefined {
  return PASSIVES[id];
}

// Obter todas as passivas
export function getAllPassives(): PassiveDefinition[] {
  return Object.values(PASSIVES);
}

// Obter passivas por categoria
export function getPassivesByCategory(category: PassiveCategory): PassiveDefinition[] {
  return Object.values(PASSIVES).filter(p => p.category === category);
}

// Verificar se passiva é compatível com arma
export function isPassiveCompatibleWithWeapon(
  passiveId: string,
  weaponType: WeaponType
): boolean {
  const passive = PASSIVES[passiveId];
  if (!passive) return false;

  // Se não tem restrição de arma, é compatível com todas
  if (!passive.requiredWeaponTypes || passive.requiredWeaponTypes.length === 0) {
    return true;
  }

  return passive.requiredWeaponTypes.includes(weaponType);
}

// Obter passivas compatíveis com uma arma
export function getPassivesForWeapon(weaponType: WeaponType): PassiveDefinition[] {
  return Object.values(PASSIVES).filter(p =>
    !p.requiredWeaponTypes ||
    p.requiredWeaponTypes.length === 0 ||
    p.requiredWeaponTypes.includes(weaponType)
  );
}

// Passiva padrão
export const DEFAULT_PASSIVE = 'ironWill';

// Total de passivas
export const TOTAL_PASSIVES = Object.keys(PASSIVES).length;

// Nomes das categorias em português
export const PASSIVE_CATEGORY_NAMES: Record<PassiveCategory, string> = {
  offensive: 'Ofensiva',
  defensive: 'Defensiva',
  utility: 'Utilidade',
  hybrid: 'Híbrida',
};

// Cores por categoria
export const PASSIVE_CATEGORY_COLORS: Record<PassiveCategory, string> = {
  offensive: '#e74c3c',   // Vermelho
  defensive: '#3498db',   // Azul
  utility: '#f39c12',     // Amarelo
  hybrid: '#9b59b6',      // Roxo
};
