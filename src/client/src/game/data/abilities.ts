// Tipos de habilidade
export type AbilityType = 'damage' | 'cc' | 'mobility' | 'support' | 'defense' | 'ultimate';

// Subtipo para melhor organizacao
export type AbilitySubtype =
  | 'melee' | 'ranged' | 'projectile' | 'aoe'  // damage
  | 'hard_cc' | 'soft_cc' | 'displacement'      // cc
  | 'dash' | 'teleport' | 'speed'               // mobility
  | 'buff' | 'utility'                          // support
  | 'shield' | 'heal' | 'immunity'              // defense
  | 'damage_ult' | 'utility_ult' | 'transform'; // ultimate

// Tipo de scaling
export type ScalingStat = 'STR' | 'DEX' | 'INT' | 'WIS' | 'CON';

// Categoria de habilidade (define compatibilidade com armas)
export type AbilityCategory =
  | 'physical_melee'     // Habilidades melee fisicas (sword, axe, hammer, dagger)
  | 'physical_ranged'    // Habilidades ranged fisicas (bow, spear)
  | 'magic_fire'         // Magias de fogo (staff)
  | 'magic_ice'          // Magias de gelo (staff)
  | 'magic_lightning'    // Magias de raio (staff)
  | 'healing'            // Habilidades de cura (staff)
  | 'defense'            // Habilidades defensivas (shield, hammer)
  | 'stealth'            // Habilidades furtivas (dagger)
  | 'universal';         // Todas as armas podem usar

// Importar tipo de arma para requiredWeaponTypes
import { WeaponType } from './weapons';

// Definicao completa de uma habilidade
export interface AbilityDefinition {
  id: string;
  name: string;
  icon: string;
  cooldown: number;
  type: AbilityType;
  subtype?: AbilitySubtype;
  category: AbilityCategory;            // NOVO: categoria para validacao de arma
  description: string;
  requiresTarget?: boolean;
  damage?: number;
  range?: number;
  scaling?: ScalingStat;
  manaCost?: number;
  staminaCost?: number;
  statusEffect?: string;
  statusDuration?: number;
  requiredWeaponTypes?: WeaponType[];   // NOVO: armas especificas requeridas (opcional)
  learnedFrom?: 'weapon' | 'npc' | 'quest' | 'starter';  // NOVO: como a habilidade e aprendida
}

// ======================================================================
// ABILITIES REGISTRY - 55+ habilidades
// ======================================================================

export const ABILITIES: Record<string, AbilityDefinition> = {
  // ==================== MOBILIDADE (12) ====================
  dash: {
    id: 'dash',
    name: 'Dash',
    icon: '💨',
    cooldown: 8000,
    type: 'mobility',
    subtype: 'dash',
    category: 'universal',
    description: 'Dash rapido na direcao do mouse (3m)',
    staminaCost: 20,
  },

  roll: {
    id: 'roll',
    name: 'Roll',
    icon: '🔄',
    cooldown: 6000,
    type: 'mobility',
    subtype: 'dash',
    category: 'universal',
    description: 'Rola com i-frames por 0.3s',
    staminaCost: 15,
  },

  sprint: {
    id: 'sprint',
    name: 'Sprint',
    icon: '🏃',
    cooldown: 15000,
    type: 'mobility',
    subtype: 'speed',
    category: 'universal',
    description: '+50% velocidade por 3s',
    staminaCost: 30,
    statusEffect: 'haste',
    statusDuration: 3000,
  },

  quickStep: {
    id: 'quickStep',
    name: 'Quick Step',
    icon: '👟',
    cooldown: 5000,
    type: 'mobility',
    subtype: 'dash',
    category: 'universal',
    description: 'Dash curto (2m), baixo cooldown',
    staminaCost: 10,
  },

  blink: {
    id: 'blink',
    name: 'Blink',
    icon: '✨',
    cooldown: 15000,
    type: 'mobility',
    subtype: 'teleport',
    category: 'universal',
    description: 'Teleporte instantaneo (5m)',
    manaCost: 40,
  },

  shadowStep: {
    id: 'shadowStep',
    name: 'Shadow Step',
    icon: '👤',
    cooldown: 12000,
    type: 'mobility',
    subtype: 'teleport',
    category: 'stealth',
    description: 'Teleporta atras do alvo',
    requiresTarget: true,
    staminaCost: 35,
    range: 400,
  },

  flash: {
    id: 'flash',
    name: 'Flash',
    icon: '⚡',
    cooldown: 25000,
    type: 'mobility',
    subtype: 'teleport',
    category: 'universal',
    description: 'Teleporte longo (7m) + i-frames',
    manaCost: 60,
  },

  charge: {
    id: 'charge',
    name: 'Charge',
    icon: '🐂',
    cooldown: 18000,
    type: 'mobility',
    subtype: 'dash',
    category: 'physical_melee',
    description: 'Dash (6m) + dano no impacto',
    staminaCost: 35,
    damage: 30,
    scaling: 'STR',
  },

  windWalk: {
    id: 'windWalk',
    name: 'Wind Walk',
    icon: '🌬️',
    cooldown: 25000,
    type: 'mobility',
    subtype: 'speed',
    category: 'stealth',
    description: 'Invisivel + 30% speed por 4s',
    staminaCost: 40,
    statusEffect: 'invisible',
    statusDuration: 4000,
  },

  vault: {
    id: 'vault',
    name: 'Vault',
    icon: '🦘',
    cooldown: 10000,
    type: 'mobility',
    subtype: 'dash',
    category: 'universal',
    description: 'Pulo sobre obstaculos com evasion',
    staminaCost: 25,
  },

  grapple: {
    id: 'grapple',
    name: 'Grapple',
    icon: '🪝',
    cooldown: 14000,
    type: 'mobility',
    subtype: 'dash',
    category: 'universal',
    description: 'Puxa voce em direcao ao alvo/parede',
    staminaCost: 30,
    range: 500,
  },

  recall: {
    id: 'recall',
    name: 'Recall',
    icon: '⏪',
    cooldown: 30000,
    type: 'mobility',
    subtype: 'teleport',
    category: 'universal',
    description: 'Retorna para onde estava 3s atras',
  },

  // ==================== DANO FISICO MELEE (10) ====================
  powerStrike: {
    id: 'powerStrike',
    name: 'Power Strike',
    icon: '💥',
    cooldown: 5000,
    type: 'damage',
    subtype: 'melee',
    category: 'physical_melee',
    description: '150% do dano da arma',
    staminaCost: 15,
    damage: 45,
    range: 100,
    scaling: 'STR',
  },

  cleave: {
    id: 'cleave',
    name: 'Cleave',
    icon: '⚔️',
    cooldown: 8000,
    type: 'damage',
    subtype: 'melee',
    category: 'physical_melee',
    description: 'Ataque em arco 180° na frente',
    staminaCost: 25,
    damage: 35,
    range: 120,
    scaling: 'STR',
  },

  whirlwind: {
    id: 'whirlwind',
    name: 'Whirlwind',
    icon: '🌀',
    cooldown: 12000,
    type: 'damage',
    subtype: 'aoe',
    category: 'physical_melee',
    description: 'Spin AoE 360° ao redor',
    staminaCost: 40,
    damage: 50,
    range: 150,
    scaling: 'STR',
  },

  backstab: {
    id: 'backstab',
    name: 'Backstab',
    icon: '🗡️',
    cooldown: 8000,
    type: 'damage',
    subtype: 'melee',
    category: 'stealth',
    description: '+200% dano se atacar pelas costas',
    staminaCost: 25,
    damage: 30,
    range: 80,
    scaling: 'DEX',
    requiredWeaponTypes: ['dagger'],
  },

  thrust: {
    id: 'thrust',
    name: 'Thrust',
    icon: '🔱',
    cooldown: 6000,
    type: 'damage',
    subtype: 'melee',
    category: 'physical_melee',
    description: 'Ataque perfurante em linha',
    staminaCost: 20,
    damage: 35,
    range: 150,
    scaling: 'DEX',
    requiredWeaponTypes: ['spear', 'sword'],
  },

  rend: {
    id: 'rend',
    name: 'Rend',
    icon: '🩸',
    cooldown: 7000,
    type: 'damage',
    subtype: 'melee',
    category: 'physical_melee',
    description: 'Causa bleed por 5s',
    staminaCost: 20,
    damage: 20,
    range: 100,
    scaling: 'STR',
    statusEffect: 'bleed',
    statusDuration: 5000,
  },

  crushingBlow: {
    id: 'crushingBlow',
    name: 'Crushing Blow',
    icon: '🔨',
    cooldown: 12000,
    type: 'damage',
    subtype: 'melee',
    category: 'physical_melee',
    description: 'Dano alto + armor break 4s',
    staminaCost: 35,
    damage: 60,
    range: 100,
    scaling: 'STR',
    statusEffect: 'armorBreak',
    statusDuration: 4000,
    requiredWeaponTypes: ['hammer', 'axe'],
  },

  execute: {
    id: 'execute',
    name: 'Execute',
    icon: '☠️',
    cooldown: 15000,
    type: 'damage',
    subtype: 'melee',
    category: 'physical_melee',
    description: '+100% dano vs inimigos com <30% HP',
    staminaCost: 40,
    damage: 50,
    range: 100,
    scaling: 'STR',
    requiredWeaponTypes: ['axe', 'sword'],
  },

  overheadSlam: {
    id: 'overheadSlam',
    name: 'Overhead Slam',
    icon: '⬇️',
    cooldown: 10000,
    type: 'damage',
    subtype: 'aoe',
    category: 'physical_melee',
    description: 'Dano alto + slow na area',
    staminaCost: 30,
    damage: 55,
    range: 130,
    scaling: 'STR',
    statusEffect: 'slow',
    statusDuration: 2000,
    requiredWeaponTypes: ['hammer', 'axe'],
  },

  riposte: {
    id: 'riposte',
    name: 'Riposte',
    icon: '🤺',
    cooldown: 10000,
    type: 'damage',
    subtype: 'melee',
    category: 'physical_melee',
    description: 'Bloqueia e contra-ataca',
    staminaCost: 20,
    damage: 40,
    range: 100,
    scaling: 'DEX',
    requiredWeaponTypes: ['sword', 'dagger'],
  },

  // ==================== DANO FISICO RANGED (8) ====================
  powerShot: {
    id: 'powerShot',
    name: 'Power Shot',
    icon: '🏹',
    cooldown: 6000,
    type: 'damage',
    subtype: 'ranged',
    category: 'physical_ranged',
    description: 'Flecha com penetracao',
    staminaCost: 20,
    damage: 40,
    range: 500,
    scaling: 'DEX',
    requiredWeaponTypes: ['bow'],
  },

  multiShot: {
    id: 'multiShot',
    name: 'Multi Shot',
    icon: '🎯',
    cooldown: 10000,
    type: 'damage',
    subtype: 'ranged',
    category: 'physical_ranged',
    description: '5 flechas em cone',
    staminaCost: 35,
    damage: 20,
    range: 400,
    scaling: 'DEX',
    requiredWeaponTypes: ['bow'],
  },

  piercingArrow: {
    id: 'piercingArrow',
    name: 'Piercing Arrow',
    icon: '➡️',
    cooldown: 8000,
    type: 'damage',
    subtype: 'projectile',
    category: 'physical_ranged',
    description: 'Atravessa todos os inimigos',
    staminaCost: 25,
    damage: 35,
    range: 600,
    scaling: 'DEX',
    requiredWeaponTypes: ['bow'],
  },

  explosiveShot: {
    id: 'explosiveShot',
    name: 'Explosive Shot',
    icon: '💣',
    cooldown: 12000,
    type: 'damage',
    subtype: 'ranged',
    category: 'physical_ranged',
    description: 'Flecha que explode no impacto',
    staminaCost: 40,
    damage: 45,
    range: 450,
    scaling: 'DEX',
    requiredWeaponTypes: ['bow'],
  },

  poisonArrow: {
    id: 'poisonArrow',
    name: 'Poison Arrow',
    icon: '☣️',
    cooldown: 10000,
    type: 'damage',
    subtype: 'ranged',
    category: 'physical_ranged',
    description: 'Causa poison + slow',
    staminaCost: 30,
    damage: 25,
    range: 500,
    scaling: 'DEX',
    statusEffect: 'poison',
    statusDuration: 5000,
    requiredWeaponTypes: ['bow'],
  },

  rainOfArrows: {
    id: 'rainOfArrows',
    name: 'Rain of Arrows',
    icon: '🌧️',
    cooldown: 18000,
    type: 'damage',
    subtype: 'aoe',
    category: 'physical_ranged',
    description: 'Chuva de flechas em area',
    staminaCost: 50,
    damage: 60,
    range: 400,
    scaling: 'DEX',
    requiredWeaponTypes: ['bow'],
  },

  snipe: {
    id: 'snipe',
    name: 'Snipe',
    icon: '🎯',
    cooldown: 15000,
    type: 'damage',
    subtype: 'ranged',
    category: 'physical_ranged',
    description: 'Carrega 2s = dano dobrado',
    staminaCost: 35,
    damage: 80,
    range: 700,
    scaling: 'DEX',
    requiredWeaponTypes: ['bow'],
  },

  volley: {
    id: 'volley',
    name: 'Volley',
    icon: '🏹',
    cooldown: 8000,
    type: 'damage',
    subtype: 'ranged',
    category: 'physical_ranged',
    description: '3 flechas em paralelo',
    staminaCost: 25,
    damage: 25,
    range: 450,
    scaling: 'DEX',
    requiredWeaponTypes: ['bow'],
  },

  // ==================== DANO MAGICO (12) ====================
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    icon: '🔥',
    cooldown: 1500,
    type: 'damage',
    subtype: 'projectile',
    category: 'magic_fire',
    description: 'Projetil de fogo + burn',
    manaCost: 30,
    damage: 35,
    range: 500,
    scaling: 'INT',
    statusEffect: 'burn',
    statusDuration: 3000,
  },

  flameWave: {
    id: 'flameWave',
    name: 'Flame Wave',
    icon: '🌊',
    cooldown: 12000,
    type: 'damage',
    subtype: 'aoe',
    category: 'magic_fire',
    description: 'Cone de fogo na frente',
    manaCost: 40,
    damage: 45,
    range: 200,
    scaling: 'INT',
  },

  ignite: {
    id: 'ignite',
    name: 'Ignite',
    icon: '🔥',
    cooldown: 6000,
    type: 'damage',
    subtype: 'projectile',
    category: 'magic_fire',
    description: 'DoT forte em alvo unico',
    requiresTarget: true,
    manaCost: 20,
    damage: 15,
    range: 400,
    scaling: 'INT',
    statusEffect: 'burn',
    statusDuration: 5000,
  },

  fireWall: {
    id: 'fireWall',
    name: 'Fire Wall',
    icon: '🧱',
    cooldown: 15000,
    type: 'damage',
    subtype: 'aoe',
    category: 'magic_fire',
    description: 'Linha de fogo no chao',
    manaCost: 50,
    damage: 30,
    range: 300,
    scaling: 'INT',
  },

  iceSpear: {
    id: 'iceSpear',
    name: 'Ice Spear',
    icon: '❄️',
    cooldown: 2000,
    type: 'damage',
    subtype: 'projectile',
    category: 'magic_ice',
    description: 'Lanca de gelo que atravessa',
    manaCost: 25,
    damage: 25,
    range: 500,
    scaling: 'INT',
    statusEffect: 'slow',
    statusDuration: 2000,
  },

  iceBolt: {
    id: 'iceBolt',
    name: 'Ice Bolt',
    icon: '🧊',
    cooldown: 7000,
    type: 'damage',
    subtype: 'projectile',
    category: 'magic_ice',
    description: 'Projetil + slow 40% por 3s',
    manaCost: 25,
    damage: 30,
    range: 450,
    scaling: 'INT',
    statusEffect: 'slow',
    statusDuration: 3000,
  },

  blizzard: {
    id: 'blizzard',
    name: 'Blizzard',
    icon: '🌨️',
    cooldown: 20000,
    type: 'damage',
    subtype: 'aoe',
    category: 'magic_ice',
    description: 'AoE continua de gelo',
    manaCost: 60,
    damage: 50,
    range: 250,
    scaling: 'INT',
    statusEffect: 'frozen',
    statusDuration: 3000,
  },

  shatter: {
    id: 'shatter',
    name: 'Shatter',
    icon: '💎',
    cooldown: 12000,
    type: 'damage',
    subtype: 'aoe',
    category: 'magic_ice',
    description: 'Bonus dano vs frozen',
    manaCost: 40,
    damage: 40,
    range: 200,
    scaling: 'INT',
  },

  lightning: {
    id: 'lightning',
    name: 'Lightning',
    icon: '⚡',
    cooldown: 3000,
    type: 'damage',
    subtype: 'projectile',
    category: 'magic_lightning',
    description: 'Raio instantaneo em alvo',
    requiresTarget: true,
    manaCost: 30,
    damage: 40,
    range: 300,
    scaling: 'INT',
  },

  chainLightning: {
    id: 'chainLightning',
    name: 'Chain Lightning',
    icon: '⛓️',
    cooldown: 8000,
    type: 'damage',
    subtype: 'projectile',
    category: 'magic_lightning',
    description: 'Raio que salta para 3 alvos',
    requiresTarget: true,
    manaCost: 40,
    damage: 30,
    range: 350,
    scaling: 'INT',
  },

  thunderStrike: {
    id: 'thunderStrike',
    name: 'Thunder Strike',
    icon: '🌩️',
    cooldown: 12000,
    type: 'damage',
    subtype: 'aoe',
    category: 'magic_lightning',
    description: 'AoE de raio + stun 0.5s',
    manaCost: 45,
    damage: 50,
    range: 200,
    scaling: 'INT',
    statusEffect: 'stun',
    statusDuration: 500,
  },

  shock: {
    id: 'shock',
    name: 'Shock',
    icon: '💫',
    cooldown: 5000,
    type: 'damage',
    subtype: 'projectile',
    category: 'magic_lightning',
    description: 'Dano baixo, interrompe cast',
    requiresTarget: true,
    manaCost: 15,
    damage: 15,
    range: 400,
    scaling: 'INT',
  },

  // ==================== CROWD CONTROL (10) ====================
  stun: {
    id: 'stun',
    name: 'Stun',
    icon: '💫',
    cooldown: 10000,
    type: 'cc',
    subtype: 'hard_cc',
    category: 'defense',
    description: 'Atordoa por 1.5s',
    requiresTarget: true,
    manaCost: 35,
    damage: 15,
    range: 250,
    statusEffect: 'stun',
    statusDuration: 1500,
  },

  frostNova: {
    id: 'frostNova',
    name: 'Frost Nova',
    icon: '💠',
    cooldown: 8000,
    type: 'cc',
    subtype: 'soft_cc',
    category: 'magic_ice',
    description: 'AoE slow ao redor',
    manaCost: 45,
    damage: 20,
    range: 150,
    statusEffect: 'slow',
    statusDuration: 3000,
  },

  root: {
    id: 'root',
    name: 'Root',
    icon: '🌿',
    cooldown: 12000,
    type: 'cc',
    subtype: 'soft_cc',
    category: 'healing',
    description: 'Prende no lugar por 2s',
    requiresTarget: true,
    manaCost: 35,
    range: 350,
    statusEffect: 'root',
    statusDuration: 2000,
  },

  fear: {
    id: 'fear',
    name: 'Fear',
    icon: '😱',
    cooldown: 18000,
    type: 'cc',
    subtype: 'hard_cc',
    category: 'stealth',
    description: 'Faz inimigo correr em panico',
    requiresTarget: true,
    manaCost: 45,
    range: 300,
    statusEffect: 'fear',
    statusDuration: 2000,
  },

  silence: {
    id: 'silence',
    name: 'Silence',
    icon: '🤫',
    cooldown: 14000,
    type: 'cc',
    subtype: 'soft_cc',
    category: 'universal',
    description: 'Bloqueia skills por 3s',
    requiresTarget: true,
    manaCost: 40,
    range: 350,
    statusEffect: 'silence',
    statusDuration: 3000,
  },

  knockup: {
    id: 'knockup',
    name: 'Knockup',
    icon: '⬆️',
    cooldown: 14000,
    type: 'cc',
    subtype: 'hard_cc',
    category: 'physical_melee',
    description: 'Lanca inimigo no ar 1s',
    staminaCost: 35,
    damage: 25,
    range: 150,
    statusEffect: 'airborne',
    statusDuration: 1000,
    requiredWeaponTypes: ['hammer', 'axe'],
  },

  pull: {
    id: 'pull',
    name: 'Pull',
    icon: '🪝',
    cooldown: 14000,
    type: 'cc',
    subtype: 'displacement',
    category: 'universal',
    description: 'Puxa inimigo para voce',
    requiresTarget: true,
    staminaCost: 35,
    range: 400,
  },

  push: {
    id: 'push',
    name: 'Push',
    icon: '👊',
    cooldown: 12000,
    type: 'cc',
    subtype: 'displacement',
    category: 'defense',
    description: 'Empurra inimigo 5m',
    staminaCost: 30,
    damage: 15,
    range: 150,
  },

  vortex: {
    id: 'vortex',
    name: 'Vortex',
    icon: '🌀',
    cooldown: 18000,
    type: 'cc',
    subtype: 'displacement',
    category: 'magic_lightning',
    description: 'Puxa todos em AoE ao centro',
    manaCost: 50,
    range: 200,
  },

  slow: {
    id: 'slow',
    name: 'Slow',
    icon: '🐌',
    cooldown: 8000,
    type: 'cc',
    subtype: 'soft_cc',
    category: 'universal',
    description: '-50% speed por 4s',
    requiresTarget: true,
    manaCost: 20,
    range: 400,
    statusEffect: 'slow',
    statusDuration: 4000,
  },

  // ==================== DEFENSIVO (8) ====================
  shield: {
    id: 'shield',
    name: 'Shield',
    icon: '🛡️',
    cooldown: 15000,
    type: 'defense',
    subtype: 'shield',
    category: 'defense',
    description: 'Absorve 200 de dano',
    manaCost: 40,
    statusEffect: 'shield',
    statusDuration: 5000,
  },

  barrier: {
    id: 'barrier',
    name: 'Barrier',
    icon: '🔵',
    cooldown: 18000,
    type: 'defense',
    subtype: 'shield',
    category: 'defense',
    description: 'Escudo magico que absorve dano',
    manaCost: 50,
    statusEffect: 'shield',
    statusDuration: 6000,
  },

  reflectShield: {
    id: 'reflectShield',
    name: 'Reflect Shield',
    icon: '🪞',
    cooldown: 25000,
    type: 'defense',
    subtype: 'shield',
    category: 'defense',
    description: 'Reflete projeteis por 3s',
    manaCost: 60,
    statusEffect: 'reflect',
    statusDuration: 3000,
    requiredWeaponTypes: ['shield'],
  },

  heal: {
    id: 'heal',
    name: 'Heal',
    icon: '💚',
    cooldown: 12000,
    type: 'defense',
    subtype: 'heal',
    category: 'healing',
    description: 'Cura 25% do HP maximo',
    manaCost: 40,
  },

  regeneration: {
    id: 'regeneration',
    name: 'Regeneration',
    icon: '💖',
    cooldown: 25000,
    type: 'defense',
    subtype: 'heal',
    category: 'healing',
    description: 'Regen 5%/s por 5s',
    manaCost: 50,
    statusEffect: 'regen',
    statusDuration: 5000,
  },

  invulnerable: {
    id: 'invulnerable',
    name: 'Invulnerable',
    icon: '⭐',
    cooldown: 45000,
    type: 'defense',
    subtype: 'immunity',
    category: 'defense',
    description: 'Imune a dano por 2s',
    manaCost: 80,
    statusEffect: 'invulnerable',
    statusDuration: 2000,
  },

  ironSkin: {
    id: 'ironSkin',
    name: 'Iron Skin',
    icon: '🛡️',
    cooldown: 35000,
    type: 'defense',
    subtype: 'immunity',
    category: 'defense',
    description: 'Reduce 50% do dano por 4s',
    staminaCost: 70,
    statusEffect: 'ironSkin',
    statusDuration: 4000,
  },

  parry: {
    id: 'parry',
    name: 'Parry',
    icon: '🤺',
    cooldown: 8000,
    type: 'defense',
    subtype: 'immunity',
    category: 'physical_melee',
    description: 'Block perfeito, permite counter',
    staminaCost: 15,
    statusEffect: 'parry',
    statusDuration: 500,
    requiredWeaponTypes: ['sword', 'dagger', 'shield'],
  },

  // ==================== SUPORTE (6) ====================
  haste: {
    id: 'haste',
    name: 'Haste',
    icon: '⚡',
    cooldown: 20000,
    type: 'support',
    subtype: 'buff',
    category: 'universal',
    description: '+30% atk speed por 5s',
    manaCost: 40,
    statusEffect: 'haste',
    statusDuration: 5000,
  },

  empower: {
    id: 'empower',
    name: 'Empower',
    icon: '💪',
    cooldown: 25000,
    type: 'support',
    subtype: 'buff',
    category: 'universal',
    description: '+25% dano por 5s',
    manaCost: 50,
    statusEffect: 'empower',
    statusDuration: 5000,
  },

  fortify: {
    id: 'fortify',
    name: 'Fortify',
    icon: '🏰',
    cooldown: 20000,
    type: 'support',
    subtype: 'buff',
    category: 'defense',
    description: '+30% armor por 5s',
    manaCost: 45,
    statusEffect: 'fortify',
    statusDuration: 5000,
  },

  cleanse: {
    id: 'cleanse',
    name: 'Cleanse',
    icon: '✨',
    cooldown: 20000,
    type: 'support',
    subtype: 'utility',
    category: 'universal',
    description: 'Remove todos debuffs',
    manaCost: 45,
  },

  battleCry: {
    id: 'battleCry',
    name: 'Battle Cry',
    icon: '📢',
    cooldown: 30000,
    type: 'support',
    subtype: 'buff',
    category: 'physical_melee',
    description: '+15% all stats AoE 5s',
    staminaCost: 60,
    range: 300,
    statusEffect: 'battleCry',
    statusDuration: 5000,
  },

  groupHeal: {
    id: 'groupHeal',
    name: 'Group Heal',
    icon: '💚',
    cooldown: 25000,
    type: 'support',
    subtype: 'utility',
    category: 'healing',
    description: 'Cura 15% HP de aliados proximos',
    manaCost: 60,
    range: 250,
  },

  // ==================== ULTIMATES (8) ====================
  meteor: {
    id: 'meteor',
    name: 'Meteor',
    icon: '☄️',
    cooldown: 30000,
    type: 'ultimate',
    subtype: 'damage_ult',
    category: 'magic_fire',
    description: 'Invoca meteoro apos 1s',
    manaCost: 100,
    damage: 80,
    range: 200,
    scaling: 'INT',
  },

  deathRay: {
    id: 'deathRay',
    name: 'Death Ray',
    icon: '☠️',
    cooldown: 50000,
    type: 'ultimate',
    subtype: 'damage_ult',
    category: 'magic_lightning',
    description: 'Raio que atravessa tudo',
    manaCost: 80,
    damage: 100,
    range: 800,
    scaling: 'INT',
  },

  bladestorm: {
    id: 'bladestorm',
    name: 'Bladestorm',
    icon: '🌪️',
    cooldown: 55000,
    type: 'ultimate',
    subtype: 'damage_ult',
    category: 'physical_melee',
    description: '5s de spin massivo',
    staminaCost: 90,
    damage: 120,
    range: 200,
    scaling: 'STR',
    requiredWeaponTypes: ['sword', 'axe'],
  },

  timeStop: {
    id: 'timeStop',
    name: 'Time Stop',
    icon: '⏰',
    cooldown: 80000,
    type: 'ultimate',
    subtype: 'utility_ult',
    category: 'magic_ice',
    description: 'Congela inimigos por 3s',
    manaCost: 130,
    range: 400,
    statusEffect: 'frozen',
    statusDuration: 3000,
  },

  berserk: {
    id: 'berserk',
    name: 'Berserk',
    icon: '😤',
    cooldown: 60000,
    type: 'ultimate',
    subtype: 'transform',
    category: 'physical_melee',
    description: '+100% dano, -50% def por 8s',
    staminaCost: 80,
    statusEffect: 'berserk',
    statusDuration: 8000,
    requiredWeaponTypes: ['axe', 'hammer', 'sword'],
  },

  shadowForm: {
    id: 'shadowForm',
    name: 'Shadow Form',
    icon: '👻',
    cooldown: 65000,
    type: 'ultimate',
    subtype: 'transform',
    category: 'stealth',
    description: 'Invisivel + intangivel 5s',
    manaCost: 90,
    statusEffect: 'shadowForm',
    statusDuration: 5000,
    requiredWeaponTypes: ['dagger'],
  },

  phoenix: {
    id: 'phoenix',
    name: 'Phoenix',
    icon: '🔥',
    cooldown: 120000,
    type: 'ultimate',
    subtype: 'utility_ult',
    category: 'magic_fire',
    description: 'Revive com 30% HP ao morrer',
    statusEffect: 'phoenix',
    statusDuration: 30000,
  },

  sanctuary: {
    id: 'sanctuary',
    name: 'Sanctuary',
    icon: '🏛️',
    cooldown: 70000,
    type: 'ultimate',
    subtype: 'utility_ult',
    category: 'healing',
    description: 'Area onde aliados sao imunes',
    manaCost: 110,
    range: 200,
    statusEffect: 'sanctuary',
    statusDuration: 4000,
  },
};

// ======================================================================
// HELPER FUNCTIONS
// ======================================================================

// Obter habilidade pelo ID
export function getAbility(id: string): AbilityDefinition | undefined {
  return ABILITIES[id];
}

// Obter todas as habilidades de um tipo
export function getAbilitiesByType(type: AbilityType): AbilityDefinition[] {
  return Object.values(ABILITIES).filter(ability => ability.type === type);
}

// Obter todas as habilidades de um subtipo
export function getAbilitiesBySubtype(subtype: AbilitySubtype): AbilityDefinition[] {
  return Object.values(ABILITIES).filter(ability => ability.subtype === subtype);
}

// Verificar se habilidade requer target
export function requiresTarget(id: string): boolean {
  return ABILITIES[id]?.requiresTarget ?? false;
}

// Obter todas as habilidades
export function getAllAbilities(): AbilityDefinition[] {
  return Object.values(ABILITIES);
}

// Obter contagem de habilidades por tipo
export function getAbilityCountByType(): Record<AbilityType, number> {
  const counts: Record<AbilityType, number> = {
    damage: 0,
    cc: 0,
    mobility: 0,
    support: 0,
    defense: 0,
    ultimate: 0,
  };

  for (const ability of Object.values(ABILITIES)) {
    counts[ability.type]++;
  }

  return counts;
}

// Total de habilidades
export const TOTAL_ABILITIES = Object.keys(ABILITIES).length;
