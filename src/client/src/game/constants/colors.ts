// Paleta de cores do Champion Forge
export const COLORS = {
  // Background
  background: '#1a1a2e',
  backgroundGradient: ['#1a1a2e', '#16213e', '#0f3460'],
  arena: '#2a2a4a',
  arenaBorder: '#4a4a6a',

  // Player
  player: '#3498db',
  playerGlow: 'rgba(52, 152, 219, 0.5)',
  playerDamaged: '#e74c3c',

  // Enemy
  enemy: '#e74c3c',
  enemyGlow: 'rgba(231, 76, 60, 0.5)',

  // Weapons
  weapon: '#e67e22',
  weaponGlow: 'rgba(230, 126, 34, 0.5)',

  // Projectiles
  fireball: ['#ff6b00', '#ff0000'],
  ice: ['#00d9ff', '#0066ff'],
  lightning: ['#fff', '#ffff00'],

  // Effects
  spark: '#f39c12',
  blood: '#e74c3c',
  heal: '#2ecc71',

  // UI
  healthBar: '#333',
  healthFill: ['#27ae60', '#2ecc71'],
  manaFill: ['#3498db', '#2980b9'],

  // Damage numbers
  damagePhysical: '#fff',
  damageMagic: '#9b59b6',
  damageCrit: '#e74c3c',
  damageHeal: '#2ecc71',

  // CC indicators
  stun: '#f1c40f',
  slow: '#3498db',
  root: '#27ae60',
} as const;
