// ======================================================================
// ENUMS CENTRALIZADOS - Constantes do jogo Champion Forge
// ======================================================================

// ==================== TIPOS DE ARMA ====================
export enum WeaponTypeEnum {
  SWORD = 'sword',
  AXE = 'axe',
  HAMMER = 'hammer',
  SPEAR = 'spear',
  BOW = 'bow',
  STAFF = 'staff',
  DAGGER = 'dagger',
  SHIELD = 'shield',
}

// ==================== RARIDADES ====================
export enum RarityEnum {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

// ==================== STATS DE SCALING ====================
export enum ScalingStatEnum {
  STR = 'STR',
  DEX = 'DEX',
  INT = 'INT',
  WIS = 'WIS',
  CON = 'CON',
}

// ==================== TIPOS DE HABILIDADE ====================
export enum AbilityTypeEnum {
  DAMAGE = 'damage',
  CC = 'cc',
  MOBILITY = 'mobility',
  SUPPORT = 'support',
  DEFENSE = 'defense',
  ULTIMATE = 'ultimate',
}

// ==================== SUBTIPOS DE HABILIDADE ====================
export enum AbilitySubtypeEnum {
  // Damage
  MELEE = 'melee',
  RANGED = 'ranged',
  PROJECTILE = 'projectile',
  AOE = 'aoe',
  // CC
  HARD_CC = 'hard_cc',
  SOFT_CC = 'soft_cc',
  DISPLACEMENT = 'displacement',
  // Mobility
  DASH = 'dash',
  TELEPORT = 'teleport',
  SPEED = 'speed',
  // Support
  BUFF = 'buff',
  UTILITY = 'utility',
  // Defense
  SHIELD = 'shield',
  HEAL = 'heal',
  IMMUNITY = 'immunity',
  // Ultimate
  DAMAGE_ULT = 'damage_ult',
  UTILITY_ULT = 'utility_ult',
  TRANSFORM = 'transform',
}

// ==================== CATEGORIAS DE HABILIDADE ====================
export enum AbilityCategoryEnum {
  PHYSICAL_MELEE = 'physical_melee',
  PHYSICAL_RANGED = 'physical_ranged',
  MAGIC_FIRE = 'magic_fire',
  MAGIC_ICE = 'magic_ice',
  MAGIC_LIGHTNING = 'magic_lightning',
  HEALING = 'healing',
  DEFENSE = 'defense',
  STEALTH = 'stealth',
  UNIVERSAL = 'universal',
}

// ==================== SLOTS DO LOADOUT ====================
export enum LoadoutSlotEnum {
  Q = 'Q',
  W = 'W',
  E = 'E',
  R = 'R',  // Ultimate only
  D = 'D',
  F = 'F',
  P = 'P',  // Passive only (novo)
}

// ==================== CATEGORIAS DE PASSIVA ====================
export enum PassiveCategoryEnum {
  OFFENSIVE = 'offensive',
  DEFENSIVE = 'defensive',
  UTILITY = 'utility',
  HYBRID = 'hybrid',
}

// ==================== TIPOS DE EFEITO DE PASSIVA ====================
export enum PassiveEffectTypeEnum {
  STAT_BONUS = 'stat_bonus',
  ON_HIT = 'on_hit',
  ON_KILL = 'on_kill',
  ON_DAMAGE_TAKEN = 'on_damage_taken',
  AURA = 'aura',
  CONDITIONAL = 'conditional',
}

// ==================== STATUS EFFECTS ====================
export enum StatusEffectEnum {
  // Debuffs
  BURN = 'burn',
  BLEED = 'bleed',
  POISON = 'poison',
  SLOW = 'slow',
  STUN = 'stun',
  ROOT = 'root',
  FEAR = 'fear',
  SILENCE = 'silence',
  FROZEN = 'frozen',
  AIRBORNE = 'airborne',
  ARMOR_BREAK = 'armorBreak',
  // Buffs
  HASTE = 'haste',
  EMPOWER = 'empower',
  FORTIFY = 'fortify',
  SHIELD = 'shield',
  REGEN = 'regen',
  INVULNERABLE = 'invulnerable',
  IRON_SKIN = 'ironSkin',
  PARRY = 'parry',
  INVISIBLE = 'invisible',
  REFLECT = 'reflect',
  BATTLE_CRY = 'battleCry',
  BERSERK = 'berserk',
  SHADOW_FORM = 'shadowForm',
  PHOENIX = 'phoenix',
  SANCTUARY = 'sanctuary',
}

// ==================== COMO HABILIDADE E APRENDIDA ====================
export enum LearnedFromEnum {
  WEAPON = 'weapon',
  NPC = 'npc',
  QUEST = 'quest',
  STARTER = 'starter',
}

// ==================== HELPER: Nomes em Portugues ====================

export const WEAPON_TYPE_NAMES: Record<WeaponTypeEnum, string> = {
  [WeaponTypeEnum.SWORD]: 'Espada',
  [WeaponTypeEnum.AXE]: 'Machado',
  [WeaponTypeEnum.HAMMER]: 'Martelo',
  [WeaponTypeEnum.SPEAR]: 'Lanca',
  [WeaponTypeEnum.BOW]: 'Arco',
  [WeaponTypeEnum.STAFF]: 'Cajado',
  [WeaponTypeEnum.DAGGER]: 'Adaga',
  [WeaponTypeEnum.SHIELD]: 'Escudo',
};

export const RARITY_NAMES: Record<RarityEnum, string> = {
  [RarityEnum.COMMON]: 'Comum',
  [RarityEnum.UNCOMMON]: 'Incomum',
  [RarityEnum.RARE]: 'Raro',
  [RarityEnum.EPIC]: 'Epico',
  [RarityEnum.LEGENDARY]: 'Lendario',
};

export const ABILITY_TYPE_NAMES: Record<AbilityTypeEnum, string> = {
  [AbilityTypeEnum.DAMAGE]: 'Dano',
  [AbilityTypeEnum.CC]: 'Controle',
  [AbilityTypeEnum.MOBILITY]: 'Mobilidade',
  [AbilityTypeEnum.SUPPORT]: 'Suporte',
  [AbilityTypeEnum.DEFENSE]: 'Defesa',
  [AbilityTypeEnum.ULTIMATE]: 'Ultimate',
};

export const ABILITY_CATEGORY_NAMES: Record<AbilityCategoryEnum, string> = {
  [AbilityCategoryEnum.PHYSICAL_MELEE]: 'Fisico Melee',
  [AbilityCategoryEnum.PHYSICAL_RANGED]: 'Fisico Ranged',
  [AbilityCategoryEnum.MAGIC_FIRE]: 'Magia de Fogo',
  [AbilityCategoryEnum.MAGIC_ICE]: 'Magia de Gelo',
  [AbilityCategoryEnum.MAGIC_LIGHTNING]: 'Magia de Raio',
  [AbilityCategoryEnum.HEALING]: 'Cura',
  [AbilityCategoryEnum.DEFENSE]: 'Defesa',
  [AbilityCategoryEnum.STEALTH]: 'Furtividade',
  [AbilityCategoryEnum.UNIVERSAL]: 'Universal',
};

export const SCALING_STAT_NAMES: Record<ScalingStatEnum, string> = {
  [ScalingStatEnum.STR]: 'Forca',
  [ScalingStatEnum.DEX]: 'Destreza',
  [ScalingStatEnum.INT]: 'Inteligencia',
  [ScalingStatEnum.WIS]: 'Sabedoria',
  [ScalingStatEnum.CON]: 'Constituicao',
};

export const PASSIVE_CATEGORY_NAMES: Record<PassiveCategoryEnum, string> = {
  [PassiveCategoryEnum.OFFENSIVE]: 'Ofensiva',
  [PassiveCategoryEnum.DEFENSIVE]: 'Defensiva',
  [PassiveCategoryEnum.UTILITY]: 'Utilidade',
  [PassiveCategoryEnum.HYBRID]: 'Hibrida',
};

// ==================== CORES ====================

export const RARITY_COLORS: Record<RarityEnum, string> = {
  [RarityEnum.COMMON]: '#9d9d9d',
  [RarityEnum.UNCOMMON]: '#1eff00',
  [RarityEnum.RARE]: '#0070dd',
  [RarityEnum.EPIC]: '#a335ee',
  [RarityEnum.LEGENDARY]: '#ff8000',
};

export const ABILITY_CATEGORY_COLORS: Record<AbilityCategoryEnum, string> = {
  [AbilityCategoryEnum.PHYSICAL_MELEE]: '#cc4444',
  [AbilityCategoryEnum.PHYSICAL_RANGED]: '#27ae60',
  [AbilityCategoryEnum.MAGIC_FIRE]: '#e74c3c',
  [AbilityCategoryEnum.MAGIC_ICE]: '#3498db',
  [AbilityCategoryEnum.MAGIC_LIGHTNING]: '#f1c40f',
  [AbilityCategoryEnum.HEALING]: '#2ecc71',
  [AbilityCategoryEnum.DEFENSE]: '#95a5a6',
  [AbilityCategoryEnum.STEALTH]: '#9b59b6',
  [AbilityCategoryEnum.UNIVERSAL]: '#ecf0f1',
};

export const SCALING_STAT_COLORS: Record<ScalingStatEnum, string> = {
  [ScalingStatEnum.STR]: '#cc4444',
  [ScalingStatEnum.DEX]: '#27ae60',
  [ScalingStatEnum.INT]: '#4488cc',
  [ScalingStatEnum.WIS]: '#f1c40f',
  [ScalingStatEnum.CON]: '#95a5a6',
};

// ==================== ARRAYS DE TODOS OS VALORES ====================

export const ALL_WEAPON_TYPES = Object.values(WeaponTypeEnum);
export const ALL_RARITIES = Object.values(RarityEnum);
export const ALL_SCALING_STATS = Object.values(ScalingStatEnum);
export const ALL_ABILITY_TYPES = Object.values(AbilityTypeEnum);
export const ALL_ABILITY_CATEGORIES = Object.values(AbilityCategoryEnum);
export const ALL_LOADOUT_SLOTS = Object.values(LoadoutSlotEnum);
export const ALL_PASSIVE_CATEGORIES = Object.values(PassiveCategoryEnum);
export const ALL_STATUS_EFFECTS = Object.values(StatusEffectEnum);
