// ==========================================
// GAME DEFAULTS - Valores padrão centralizados
// ==========================================
// Este arquivo elimina números mágicos (magic numbers) espalhados pelo código.
// Todos os valores padrão devem estar aqui para fácil manutenção.

// ==========================================
// ENTITY DEFAULTS
// ==========================================

export const DEFAULT_ENTITY = {
  HP: 100,
  MAX_HP: 100,
  RADIUS: 20,
  LEVEL: 1,
  ATTACK_DAMAGE: 10,
  ATTACK_RANGE: 60,
  SPEED_MULTIPLIER: 1.0,
} as const;

// ==========================================
// ANIMATION DEFAULTS
// ==========================================

export const DEFAULT_ANIMATION = {
  SPEED: 1,
  INTENSITY: 1,
  SMOOTHING: 5,
  SCALE: 1,
  JOINT_RADIUS: 3,
  START_FRAME: 0,
} as const;

// ==========================================
// SKELETON DEFAULTS
// ==========================================

export const DEFAULT_SKELETON = {
  SCALE: 1,
  START_THICKNESS: 1,
  END_THICKNESS: 0.6,
  TOP_WIDTH_RATIO: 1.5,
  BOTTOM_WIDTH_RATIO: 1,
  OVAL_RATIO_X: 1,
  OVAL_RATIO_Y: 1,
  THICKNESS_MULTIPLIER: 1,
  SPRITE_SCALE: 1,
  STROKE_WIDTH: 1,
  SHADOW_OFFSET_X: 2,
  SHADOW_OFFSET_Y: 4,
} as const;

// ==========================================
// WEAPON DEFAULTS
// ==========================================

export const DEFAULT_WEAPON = {
  RANGE: 60,
  DAMAGE: 0,
  ATTACK_COOLDOWN_MS: 1000,
} as const;

// ==========================================
// CANVAS DEFAULTS
// ==========================================

export const DEFAULT_CANVAS = {
  LINE_WIDTH: 2,
  BORDER_WIDTH: 1,
  GLOW_BLUR: 15,
  LINE_GLOW_BLUR: 10,
  SHADOW_BLUR: 3,
} as const;

// ==========================================
// PARTICLE DEFAULTS
// ==========================================

export const DEFAULT_PARTICLE = {
  COUNT: 10,
  SPREAD: 3,
  SIZE: 5,
  LIFE: 30,
  GRAVITY: 0,
  BURST_COUNT: 2,
} as const;

// ==========================================
// COOLDOWN DEFAULTS
// ==========================================

export const DEFAULT_COOLDOWN = {
  MAX_CHARGES: 1,
  COOLDOWN_PROGRESS: 1,
  REMAINING_COOLDOWN: 0,
} as const;

// ==========================================
// COMBAT DEFAULTS
// ==========================================

export const DEFAULT_COMBAT = {
  CRIT_CHANCE: 0,
  LIFE_STEAL: 0,
  SHIELD_AMOUNT: 0,
  PENETRATION: 0,
} as const;

// ==========================================
// SPATIAL DEFAULTS
// ==========================================

export const DEFAULT_SPATIAL = {
  ENTITY_RADIUS: 20,
  COLLISION_RADIUS: 10,
} as const;
