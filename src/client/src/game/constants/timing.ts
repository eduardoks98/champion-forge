// Duração de animações em milissegundos
export const TIMING = {
  // Ataques
  attackSwing: 300,
  attackThrust: 250,

  // Projéteis
  fireballPulse: 200,
  lightningFlash: 100,

  // Efeitos
  dashTrail: 300,
  aoeExpand: 500,
  hitFlash: 200,
  deathShrink: 300,
  damageFloat: 800,
  ccIndicator: 1000,

  // Cooldowns (em ms)
  cooldowns: {
    attack: 500,
    fireball: 1500,
    iceSpear: 2000,
    lightning: 3000,
    dash: 4000,
    // New abilities
    cleave: 1000,      // Melee AoE
    frostNova: 8000,   // AoE slow
    heal: 12000,       // Self heal
    stun: 10000,       // Single target stun
    shield: 15000,     // Absorb damage
    meteor: 30000,     // Ultimate
  },

  // Status effect durations (em ms)
  statusDurations: {
    slow: 3000,        // 3 seconds
    stun: 1500,        // 1.5 seconds
    root: 2000,        // 2 seconds
    frozen: 2500,      // 2.5 seconds (from Frost Nova)
    shield: 5000,      // 5 seconds
    burn: 3000,        // 3 seconds
  },

  // Partículas
  particleLife: 30, // frames

  // Game loop
  targetFPS: 60,
  tickRate: 16.67, // 1000ms / 60fps

  // Enemy AI
  enemyAttackCooldown: 1500,
} as const;

// Velocidades
export const SPEEDS = {
  player: 4,
  playerDash: 15,
  fireball: 8,
  iceSpear: 10,
  particle: {
    min: 2,
    max: 5,
  },
} as const;

// Tamanhos
export const SIZES = {
  player: 60,
  enemy: 50,
  projectile: 15,
  particle: {
    spark: 4,
    blood: 6,
  },
  weapon: {
    width: 40,
    height: 8,
  },
  arena: {
    width: 800,
    height: 500,
  },
} as const;

// Dano
export const DAMAGE = {
  melee: 25,
  fireball: 35,
  iceSpear: 25,
  lightning: 40,
  // New abilities
  cleave: 30,         // Melee AoE
  frostNova: 20,      // AoE (lower damage, has CC)
  stun: 15,           // Single target (low damage, has CC)
  meteor: 80,         // Ultimate
  enemyMelee: 15,     // Enemy attack damage
} as const;

// Ranges
export const RANGES = {
  melee: 100,
  lightning: 300,
  // New abilities
  cleave: 120,        // Slightly larger than melee
  frostNova: 150,     // AoE radius around player
  stun: 250,          // Target-required
  meteor: 200,        // AoE radius
  meteorCast: 400,    // Cast range
  // Enemy
  enemyDetection: 350,
  enemyAttack: 80,
} as const;

// Status effect values
export const STATUS_VALUES = {
  slowAmount: 0.5,      // 50% slow
  shieldAmount: 50,     // Shield absorbs 50 damage
  healAmount: 0.25,     // 25% of max HP
} as const;
