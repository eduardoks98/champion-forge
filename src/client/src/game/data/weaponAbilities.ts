// ======================================================================
// WEAPON ABILITIES - Passivas e Ativas das Armas
// Cada arma tem:
// - passive: Efeito automático que funciona sempre que a arma está equipada
// - active: Habilidade especial da arma, ativada com tecla "1"
// ======================================================================

import { ScalingStat } from './abilities';

// Tipos de efeito passivo da arma
export type WeaponPassiveType =
  | 'stat_bonus'      // Bonus constante em stat
  | 'on_hit'          // Efeito ao acertar ataque básico
  | 'on_crit'         // Efeito ao acertar crítico
  | 'damage_bonus';   // Bonus de dano percentual

// Definição de passiva da arma (sempre ativa, automática)
export interface WeaponPassive {
  type: WeaponPassiveType;
  description: string;
  effect: {
    stat?: ScalingStat;
    bonusPercent?: number;      // Ex: 0.1 = +10%
    bonusFlat?: number;         // Ex: 5 = +5 de dano
    statusEffect?: string;      // Ex: 'burn'
    statusChance?: number;      // Ex: 0.2 = 20%
    statusDuration?: number;    // ms
  };
}

// Definição de habilidade ativa da arma (tecla "1")
export interface WeaponActive {
  id: string;
  name: string;
  icon: string;
  description: string;
  cooldown: number;             // ms
  damage?: number;
  damageScaling?: ScalingStat;
  range?: number;
  manaCost?: number;
  staminaCost?: number;
  animation?: 'slash' | 'thrust' | 'spin' | 'projectile' | 'smash' | 'block';
  statusEffect?: string;
  statusDuration?: number;
}

// ======================================================================
// WEAPON ABILITIES REGISTRY - Passivas e Ativas por arma
// ======================================================================

export const WEAPON_ABILITIES: Record<string, {
  passive: WeaponPassive;
  active: WeaponActive;
}> = {
  // ==================== ESPADAS ====================
  shortSword: {
    passive: {
      type: 'stat_bonus',
      description: '+5% de velocidade de ataque',
      effect: {
        bonusPercent: 0.05,
      },
    },
    active: {
      id: 'quick_slash',
      name: 'Corte Rápido',
      icon: '⚔️',
      description: 'Ataque rápido que causa 120% do dano da arma',
      cooldown: 6000,
      damage: 36,  // 120% de 30
      damageScaling: 'STR',
      range: 100,
      staminaCost: 15,
      animation: 'slash',
    },
  },

  longsword: {
    passive: {
      type: 'on_hit',
      description: '10% de chance de causar sangramento por 3s',
      effect: {
        statusEffect: 'bleed',
        statusChance: 0.1,
        statusDuration: 3000,
      },
    },
    active: {
      id: 'mortal_strike',
      name: 'Golpe Mortal',
      icon: '⚔️',
      description: 'Golpe poderoso que reduz cura do alvo em 50% por 5s',
      cooldown: 12000,
      damage: 68,  // 150% de 45
      damageScaling: 'STR',
      range: 140,
      staminaCost: 30,
      animation: 'slash',
      statusEffect: 'healingReduction',
      statusDuration: 5000,
    },
  },

  claymore: {
    passive: {
      type: 'damage_bonus',
      description: '+15% de dano contra inimigos com escudo/armadura',
      effect: {
        bonusPercent: 0.15,
      },
    },
    active: {
      id: 'mighty_swing',
      name: 'Golpe Poderoso',
      icon: '⚔️',
      description: 'Golpe em área que atinge todos os inimigos à frente',
      cooldown: 15000,
      damage: 98,  // 150% de 65
      damageScaling: 'STR',
      range: 180,
      staminaCost: 45,
      animation: 'slash',
    },
  },

  flameblade: {
    passive: {
      type: 'on_hit',
      description: '30% de chance de causar queimadura por 3s',
      effect: {
        statusEffect: 'burn',
        statusChance: 0.3,
        statusDuration: 3000,
        bonusPercent: 0.1,  // +10% dano de fogo
      },
    },
    active: {
      id: 'fire_slash',
      name: 'Corte Flamejante',
      icon: '🔥',
      description: 'Golpe flamejante que causa dano em área e queima',
      cooldown: 10000,
      damage: 80,
      damageScaling: 'STR',
      range: 150,
      staminaCost: 35,
      animation: 'slash',
      statusEffect: 'burn',
      statusDuration: 4000,
    },
  },

  // ==================== MACHADOS ====================
  hatchet: {
    passive: {
      type: 'on_crit',
      description: 'Críticos causam +20% de dano',
      effect: {
        bonusPercent: 0.2,
      },
    },
    active: {
      id: 'throwing_axe',
      name: 'Arremesso de Machado',
      icon: '🪓',
      description: 'Arremessa o machado causando dano à distância',
      cooldown: 8000,
      damage: 60,
      damageScaling: 'STR',
      range: 300,
      staminaCost: 25,
      animation: 'projectile',
    },
  },

  battleAxe: {
    passive: {
      type: 'on_hit',
      description: 'Ataques reduzem armadura do inimigo em 5% (acumula até 25%)',
      effect: {
        statusEffect: 'armorBreak',
        statusChance: 1.0,
        statusDuration: 5000,
        bonusFlat: 5,
      },
    },
    active: {
      id: 'raging_blow',
      name: 'Golpe Furioso',
      icon: '🪓',
      description: 'Golpe devastador que ignora 30% da armadura',
      cooldown: 14000,
      damage: 90,
      damageScaling: 'STR',
      range: 130,
      staminaCost: 40,
      animation: 'smash',
    },
  },

  greatAxe: {
    passive: {
      type: 'damage_bonus',
      description: '+25% de dano em ataques lentos',
      effect: {
        bonusPercent: 0.25,
      },
    },
    active: {
      id: 'execute_strike',
      name: 'Execução',
      icon: '🪓',
      description: 'Golpe que causa +100% de dano em inimigos abaixo de 30% HP',
      cooldown: 20000,
      damage: 120,
      damageScaling: 'STR',
      range: 150,
      staminaCost: 50,
      animation: 'smash',
    },
  },

  // ==================== MARTELOS ====================
  mace: {
    passive: {
      type: 'on_hit',
      description: '15% de chance de atordoar por 0.5s',
      effect: {
        statusEffect: 'stun',
        statusChance: 0.15,
        statusDuration: 500,
      },
    },
    active: {
      id: 'skull_bash',
      name: 'Golpe no Crânio',
      icon: '🔨',
      description: 'Golpe que causa dano extra e atordoa por 1s',
      cooldown: 10000,
      damage: 75,
      damageScaling: 'STR',
      range: 110,
      staminaCost: 30,
      animation: 'smash',
      statusEffect: 'stun',
      statusDuration: 1000,
    },
  },

  warHammer: {
    passive: {
      type: 'on_hit',
      description: '25% de chance de atordoar por 0.8s',
      effect: {
        statusEffect: 'stun',
        statusChance: 0.25,
        statusDuration: 800,
      },
    },
    active: {
      id: 'ground_slam',
      name: 'Martelada no Chão',
      icon: '🔨',
      description: 'Martela o chão causando dano em área e derrubando inimigos',
      cooldown: 18000,
      damage: 112,
      damageScaling: 'STR',
      range: 180,
      staminaCost: 55,
      animation: 'smash',
      statusEffect: 'knockdown',
      statusDuration: 1500,
    },
  },

  // ==================== LANÇAS ====================
  spear: {
    passive: {
      type: 'stat_bonus',
      description: '+10% de alcance em todos os ataques',
      effect: {
        bonusPercent: 0.1,
      },
    },
    active: {
      id: 'piercing_thrust',
      name: 'Estocada Perfurante',
      icon: '🔱',
      description: 'Estocada que atravessa múltiplos inimigos em linha',
      cooldown: 8000,
      damage: 52,
      damageScaling: 'DEX',
      range: 200,
      staminaCost: 25,
      animation: 'thrust',
    },
  },

  pike: {
    passive: {
      type: 'damage_bonus',
      description: '+20% de dano contra inimigos que avançam em sua direção',
      effect: {
        bonusPercent: 0.2,
      },
    },
    active: {
      id: 'impale',
      name: 'Empalar',
      icon: '🔱',
      description: 'Empala o inimigo, causando dano e imobilizando por 1s',
      cooldown: 14000,
      damage: 75,
      damageScaling: 'DEX',
      range: 240,
      staminaCost: 40,
      animation: 'thrust',
      statusEffect: 'root',
      statusDuration: 1000,
    },
  },

  // ==================== ARCOS ====================
  shortBow: {
    passive: {
      type: 'stat_bonus',
      description: '+15% de velocidade de ataque',
      effect: {
        bonusPercent: 0.15,
      },
    },
    active: {
      id: 'rapid_fire',
      name: 'Tiro Rápido',
      icon: '🏹',
      description: 'Dispara 3 flechas rapidamente',
      cooldown: 8000,
      damage: 25,  // por flecha
      damageScaling: 'DEX',
      range: 400,
      staminaCost: 25,
      animation: 'projectile',
    },
  },

  longBow: {
    passive: {
      type: 'damage_bonus',
      description: '+20% de dano em ataques à distância máxima',
      effect: {
        bonusPercent: 0.2,
      },
    },
    active: {
      id: 'precision_shot',
      name: 'Tiro de Precisão',
      icon: '🏹',
      description: 'Tiro carregado que causa dano crítico garantido',
      cooldown: 15000,
      damage: 90,
      damageScaling: 'DEX',
      range: 600,
      staminaCost: 40,
      animation: 'projectile',
    },
  },

  // ==================== CAJADOS ====================
  woodenStaff: {
    passive: {
      type: 'stat_bonus',
      description: '+10% de regeneração de mana',
      effect: {
        stat: 'INT',
        bonusPercent: 0.1,
      },
    },
    active: {
      id: 'arcane_bolt',
      name: 'Projétil Arcano',
      icon: '🪄',
      description: 'Dispara um projétil mágico que causa dano',
      cooldown: 5000,
      damage: 30,
      damageScaling: 'INT',
      range: 350,
      manaCost: 20,
      animation: 'projectile',
    },
  },

  fireStaff: {
    passive: {
      type: 'damage_bonus',
      description: '+25% de dano de fogo em todas as magias',
      effect: {
        bonusPercent: 0.25,
      },
    },
    active: {
      id: 'inferno_burst',
      name: 'Explosão Infernal',
      icon: '🔥',
      description: 'Cria uma explosão de fogo ao redor, causando dano em área',
      cooldown: 15000,
      damage: 55,
      damageScaling: 'INT',
      range: 150,
      manaCost: 45,
      animation: 'projectile',
      statusEffect: 'burn',
      statusDuration: 4000,
    },
  },

  // ==================== ADAGAS ====================
  dagger: {
    passive: {
      type: 'on_crit',
      description: 'Críticos causam sangramento por 3s',
      effect: {
        statusEffect: 'bleed',
        statusChance: 1.0,
        statusDuration: 3000,
      },
    },
    active: {
      id: 'quick_stab',
      name: 'Facada Rápida',
      icon: '🗡️',
      description: 'Série de 3 facadas rápidas',
      cooldown: 6000,
      damage: 20,  // por facada
      damageScaling: 'DEX',
      range: 70,
      staminaCost: 20,
      animation: 'thrust',
    },
  },

  assassinBlade: {
    passive: {
      type: 'damage_bonus',
      description: '+50% de dano crítico',
      effect: {
        bonusPercent: 0.5,
      },
    },
    active: {
      id: 'shadow_strike',
      name: 'Golpe das Sombras',
      icon: '🗡️',
      description: 'Teleporta atrás do inimigo e aplica golpe crítico',
      cooldown: 12000,
      damage: 60,
      damageScaling: 'DEX',
      range: 300,
      staminaCost: 35,
      animation: 'thrust',
    },
  },

  // ==================== ESCUDOS ====================
  roundShield: {
    passive: {
      type: 'stat_bonus',
      description: '+20% de resistência a dano enquanto bloqueando',
      effect: {
        bonusPercent: 0.2,
      },
    },
    active: {
      id: 'shield_bash',
      name: 'Golpe de Escudo',
      icon: '🛡️',
      description: 'Golpeia com o escudo, causando dano e atordoando',
      cooldown: 10000,
      damage: 30,
      damageScaling: 'CON',
      range: 80,
      staminaCost: 25,
      animation: 'block',
      statusEffect: 'stun',
      statusDuration: 1000,
    },
  },
};

// ======================================================================
// HELPER FUNCTIONS
// ======================================================================

// Obter passiva da arma
export function getWeaponPassive(weaponId: string): WeaponPassive | undefined {
  return WEAPON_ABILITIES[weaponId]?.passive;
}

// Obter habilidade ativa da arma
export function getWeaponActive(weaponId: string): WeaponActive | undefined {
  return WEAPON_ABILITIES[weaponId]?.active;
}

// Verificar se arma tem habilidade ativa
export function hasWeaponActive(weaponId: string): boolean {
  return !!WEAPON_ABILITIES[weaponId]?.active;
}

// Obter todas as habilidades ativas de armas
export function getAllWeaponActives(): WeaponActive[] {
  return Object.values(WEAPON_ABILITIES).map(wa => wa.active);
}

// Obter todas as passivas de armas
export function getAllWeaponPassives(): { weaponId: string; passive: WeaponPassive }[] {
  return Object.entries(WEAPON_ABILITIES).map(([weaponId, wa]) => ({
    weaponId,
    passive: wa.passive,
  }));
}
