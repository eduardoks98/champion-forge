// Tipos de arma
export type WeaponType = 'sword' | 'axe' | 'hammer' | 'spear' | 'bow' | 'staff' | 'dagger' | 'shield';

// Raridade
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// Tipo de scaling
export type ScalingStat = 'STR' | 'DEX' | 'INT' | 'WIS' | 'CON';

// Definicao de uma arma
export interface WeaponDefinition {
  id: string;
  name: string;
  type: WeaponType;
  icon: string;
  damage: number;
  speed: number;        // 0.5 = lento, 1.0 = normal, 1.5 = rapido
  range: number;        // px
  scaling: ScalingStat;
  scalingValue: number; // multiplicador (1.0 = 100%)
  rarity: Rarity;
  special?: string;     // efeito especial
  description: string;
}

// Cores por raridade
export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#9d9d9d',
  uncommon: '#1eff00',
  rare: '#0070dd',
  epic: '#a335ee',
  legendary: '#ff8000',
};

// Bonus por raridade
export const RARITY_BONUS: Record<Rarity, number> = {
  common: 1.0,
  uncommon: 1.1,
  rare: 1.25,
  epic: 1.4,
  legendary: 1.6,
};

// ======================================================================
// WEAPONS REGISTRY - 18 armas
// ======================================================================

export const WEAPONS: Record<string, WeaponDefinition> = {
  // ==================== ESPADAS (4) ====================
  shortSword: {
    id: 'shortSword',
    name: 'Short Sword',
    type: 'sword',
    icon: '⚔️',
    damage: 30,
    speed: 1.2,
    range: 100,
    scaling: 'STR',
    scalingValue: 0.8,
    rarity: 'common',
    description: 'Espada curta e rapida. Ideal para iniciantes.',
  },

  longsword: {
    id: 'longsword',
    name: 'Longsword',
    type: 'sword',
    icon: '🗡️',
    damage: 45,
    speed: 1.0,
    range: 140,
    scaling: 'STR',
    scalingValue: 1.0,
    rarity: 'uncommon',
    description: 'Espada longa equilibrada. Dano e alcance medios.',
  },

  claymore: {
    id: 'claymore',
    name: 'Claymore',
    type: 'sword',
    icon: '⚔️',
    damage: 65,
    speed: 0.7,
    range: 160,
    scaling: 'STR',
    scalingValue: 1.2,
    rarity: 'rare',
    description: 'Espada de duas maos. Alto dano, baixa velocidade.',
  },

  flameblade: {
    id: 'flameblade',
    name: 'Flameblade',
    type: 'sword',
    icon: '🔥',
    damage: 55,
    speed: 0.9,
    range: 140,
    scaling: 'STR',
    scalingValue: 1.0,
    rarity: 'epic',
    special: 'burn',
    description: 'Espada flamejante. Causa burn em acertos.',
  },

  // ==================== MACHADOS (3) ====================
  hatchet: {
    id: 'hatchet',
    name: 'Hatchet',
    type: 'axe',
    icon: '🪓',
    damage: 40,
    speed: 1.0,
    range: 90,
    scaling: 'STR',
    scalingValue: 0.9,
    rarity: 'common',
    description: 'Machadinha leve. Bom para ataques rapidos.',
  },

  battleAxe: {
    id: 'battleAxe',
    name: 'Battle Axe',
    type: 'axe',
    icon: '🪓',
    damage: 60,
    speed: 0.7,
    range: 120,
    scaling: 'STR',
    scalingValue: 1.15,
    rarity: 'uncommon',
    special: 'armorBreak',
    description: 'Machado de batalha. Quebra armadura inimiga.',
  },

  greatAxe: {
    id: 'greatAxe',
    name: 'Great Axe',
    type: 'axe',
    icon: '🪓',
    damage: 80,
    speed: 0.5,
    range: 140,
    scaling: 'STR',
    scalingValue: 1.3,
    rarity: 'rare',
    description: 'Machado gigante. Maximo dano, minima velocidade.',
  },

  // ==================== MARTELOS (2) ====================
  mace: {
    id: 'mace',
    name: 'Mace',
    type: 'hammer',
    icon: '🔨',
    damage: 50,
    speed: 0.8,
    range: 100,
    scaling: 'STR',
    scalingValue: 1.0,
    rarity: 'common',
    description: 'Maca basica. Causa dano de impacto.',
  },

  warHammer: {
    id: 'warHammer',
    name: 'War Hammer',
    type: 'hammer',
    icon: '🔨',
    damage: 75,
    speed: 0.5,
    range: 130,
    scaling: 'STR',
    scalingValue: 1.2,
    rarity: 'rare',
    special: 'stun',
    description: 'Martelo de guerra. Chance de atordoar.',
  },

  // ==================== LANCAS (2) ====================
  spear: {
    id: 'spear',
    name: 'Spear',
    type: 'spear',
    icon: '🔱',
    damage: 35,
    speed: 1.1,
    range: 180,
    scaling: 'DEX',
    scalingValue: 0.9,
    rarity: 'common',
    description: 'Lanca basica. Longo alcance.',
  },

  pike: {
    id: 'pike',
    name: 'Pike',
    type: 'spear',
    icon: '🔱',
    damage: 50,
    speed: 0.9,
    range: 220,
    scaling: 'DEX',
    scalingValue: 1.1,
    rarity: 'uncommon',
    description: 'Pique longo. Maximo alcance melee.',
  },

  // ==================== ARCOS (2) ====================
  shortBow: {
    id: 'shortBow',
    name: 'Short Bow',
    type: 'bow',
    icon: '🏹',
    damage: 25,
    speed: 1.3,
    range: 400,
    scaling: 'DEX',
    scalingValue: 0.9,
    rarity: 'common',
    description: 'Arco curto. Rapido mas fraco.',
  },

  longBow: {
    id: 'longBow',
    name: 'Long Bow',
    type: 'bow',
    icon: '🏹',
    damage: 45,
    speed: 0.8,
    range: 550,
    scaling: 'DEX',
    scalingValue: 1.1,
    rarity: 'uncommon',
    description: 'Arco longo. Maior dano e alcance.',
  },

  // ==================== CAJADOS (2) ====================
  woodenStaff: {
    id: 'woodenStaff',
    name: 'Wooden Staff',
    type: 'staff',
    icon: '🪄',
    damage: 20,
    speed: 1.0,
    range: 350,
    scaling: 'INT',
    scalingValue: 1.0,
    rarity: 'common',
    description: 'Cajado de madeira. Basico para magos.',
  },

  fireStaff: {
    id: 'fireStaff',
    name: 'Fire Staff',
    type: 'staff',
    icon: '🔥',
    damage: 35,
    speed: 0.9,
    range: 400,
    scaling: 'INT',
    scalingValue: 1.2,
    rarity: 'rare',
    special: 'burn',
    description: 'Cajado de fogo. Amplifica magias de fogo.',
  },

  // ==================== ADAGAS (2) ====================
  dagger: {
    id: 'dagger',
    name: 'Dagger',
    type: 'dagger',
    icon: '🗡️',
    damage: 18,
    speed: 1.8,
    range: 70,
    scaling: 'DEX',
    scalingValue: 0.8,
    rarity: 'common',
    description: 'Adaga simples. Muito rapida, baixo dano.',
  },

  assassinBlade: {
    id: 'assassinBlade',
    name: 'Assassin Blade',
    type: 'dagger',
    icon: '🗡️',
    damage: 30,
    speed: 1.5,
    range: 80,
    scaling: 'DEX',
    scalingValue: 1.0,
    rarity: 'epic',
    special: 'critBonus',
    description: 'Lamina de assassino. +50% dano critico.',
  },

  // ==================== ESCUDOS (1) ====================
  roundShield: {
    id: 'roundShield',
    name: 'Round Shield',
    type: 'shield',
    icon: '🛡️',
    damage: 15,
    speed: 0.6,
    range: 80,
    scaling: 'CON',
    scalingValue: 0.5,
    rarity: 'uncommon',
    special: 'block',
    description: 'Escudo redondo. Bloqueia 60% do dano frontal.',
  },
};

// ======================================================================
// HELPER FUNCTIONS
// ======================================================================

// Obter arma pelo ID
export function getWeapon(id: string): WeaponDefinition | undefined {
  return WEAPONS[id];
}

// Obter todas as armas de um tipo
export function getWeaponsByType(type: WeaponType): WeaponDefinition[] {
  return Object.values(WEAPONS).filter(weapon => weapon.type === type);
}

// Obter todas as armas de uma raridade
export function getWeaponsByRarity(rarity: Rarity): WeaponDefinition[] {
  return Object.values(WEAPONS).filter(weapon => weapon.rarity === rarity);
}

// Obter todas as armas
export function getAllWeapons(): WeaponDefinition[] {
  return Object.values(WEAPONS);
}

// Calcular dano base com scaling
export function calculateWeaponDamage(weaponId: string, statValue: number): number {
  const weapon = WEAPONS[weaponId];
  if (!weapon) return 0;

  const baseDamage = weapon.damage;
  const scalingBonus = statValue * weapon.scalingValue * 0.1; // 10% do stat * scaling
  const rarityMultiplier = RARITY_BONUS[weapon.rarity];

  return Math.floor((baseDamage + scalingBonus) * rarityMultiplier);
}

// Calcular attack speed
export function calculateAttackSpeed(weaponId: string): number {
  const weapon = WEAPONS[weaponId];
  if (!weapon) return 1000; // 1 ataque por segundo

  // speed 1.0 = 1000ms, speed 0.5 = 2000ms, speed 1.5 = 666ms
  return Math.floor(1000 / weapon.speed);
}

// Arma padrao
export const DEFAULT_WEAPON = 'shortSword';

// Total de armas
export const TOTAL_WEAPONS = Object.keys(WEAPONS).length;

// Tipos de arma disponiveis
export const WEAPON_TYPES: WeaponType[] = ['sword', 'axe', 'hammer', 'spear', 'bow', 'staff', 'dagger', 'shield'];

// Nomes dos tipos em portugues
export const WEAPON_TYPE_NAMES: Record<WeaponType, string> = {
  sword: 'Espada',
  axe: 'Machado',
  hammer: 'Martelo',
  spear: 'Lanca',
  bow: 'Arco',
  staff: 'Cajado',
  dagger: 'Adaga',
  shield: 'Escudo',
};
