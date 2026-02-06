// ==========================================
// TIPOS GLOBAIS DO JOGO
// ==========================================

// ==========================================
// TEAMS
// ==========================================

export type Team = 'blue' | 'red' | 'neutral';

/**
 * Verifica se dois times são inimigos
 */
export function areEnemies(team1: Team, team2: Team): boolean {
  if (team1 === 'neutral' || team2 === 'neutral') return false;
  return team1 !== team2;
}

/**
 * Verifica se dois times são aliados
 */
export function areAllies(team1: Team, team2: Team): boolean {
  if (team1 === 'neutral' || team2 === 'neutral') return false;
  return team1 === team2;
}

/**
 * Retorna o time oposto
 */
export function getOppositeTeam(team: Team): Team {
  if (team === 'blue') return 'red';
  if (team === 'red') return 'blue';
  return 'neutral';
}

// ==========================================
// ENTITY TYPES
// ==========================================

export type EntityType =
  | 'champion'     // Jogador ou AI champion
  | 'minion'       // Minions de lane
  | 'structure'    // Torres, inibidores, nexus
  | 'projectile'   // Projéteis de auto-attack ou habilidades
  | 'pet'          // Pets controláveis (Tibbers, Daisy)
  | 'ward'         // Wards de visão
  | 'jungle_camp'; // Monstros da jungle

// ==========================================
// TARGETING TYPES
// ==========================================

export type TargetType = 'enemy' | 'ally' | 'self' | 'ground' | 'any';

export interface TargetingConfig {
  canTargetChampions: boolean;
  canTargetMinions: boolean;
  canTargetStructures: boolean;
  canTargetPets: boolean;
  canTargetWards: boolean;
  canTargetSelf: boolean;
  canTargetAllies: boolean;
  canTargetEnemies: boolean;
  canTargetGround: boolean;
}

// Configs predefinidas
export const TARGETING_CONFIGS: Record<string, TargetingConfig> = {
  enemyOnly: {
    canTargetChampions: true,
    canTargetMinions: true,
    canTargetStructures: true,
    canTargetPets: true,
    canTargetWards: true,
    canTargetSelf: false,
    canTargetAllies: false,
    canTargetEnemies: true,
    canTargetGround: false,
  },
  allyOnly: {
    canTargetChampions: true,
    canTargetMinions: false,
    canTargetStructures: false,
    canTargetPets: false,
    canTargetWards: false,
    canTargetSelf: false,
    canTargetAllies: true,
    canTargetEnemies: false,
    canTargetGround: false,
  },
  selfOnly: {
    canTargetChampions: false,
    canTargetMinions: false,
    canTargetStructures: false,
    canTargetPets: false,
    canTargetWards: false,
    canTargetSelf: true,
    canTargetAllies: false,
    canTargetEnemies: false,
    canTargetGround: false,
  },
  ground: {
    canTargetChampions: false,
    canTargetMinions: false,
    canTargetStructures: false,
    canTargetPets: false,
    canTargetWards: false,
    canTargetSelf: false,
    canTargetAllies: false,
    canTargetEnemies: false,
    canTargetGround: true,
  },
  any: {
    canTargetChampions: true,
    canTargetMinions: true,
    canTargetStructures: true,
    canTargetPets: true,
    canTargetWards: true,
    canTargetSelf: true,
    canTargetAllies: true,
    canTargetEnemies: true,
    canTargetGround: true,
  },
};

// ==========================================
// DAMAGE TYPES
// ==========================================

export type DamageType = 'physical' | 'magical' | 'true';

// ==========================================
// CROWD CONTROL TYPES
// ==========================================

export type CCType =
  | 'stun'       // Não pode mover nem usar habilidades
  | 'root'       // Não pode mover, pode usar habilidades
  | 'silence'    // Pode mover, não pode usar habilidades
  | 'slow'       // Movimento reduzido
  | 'knockup'    // Stun + deslocamento vertical
  | 'knockback'  // Deslocamento para trás
  | 'pull'       // Deslocamento em direção ao caster
  | 'charm'      // Anda em direção ao caster
  | 'fear'       // Anda em direção oposta ao caster
  | 'taunt'      // Força auto-attack no caster
  | 'blind'      // Auto-attacks erram
  | 'ground'     // Não pode usar dashes/blinks
  | 'disarm'     // Não pode auto-attack
  | 'suppress';  // Stun que não pode ser reduzido por tenacity

// ==========================================
// BUFF/DEBUFF TYPES
// ==========================================

export type BuffType = 'buff' | 'debuff';

export interface StatusEffect {
  id: string;
  type: BuffType;
  name: string;
  duration: number;        // ms
  remainingTime: number;   // ms
  stacks: number;
  maxStacks: number;
  source: string;          // Entity ID que aplicou

  // Efeitos
  ccType?: CCType;
  statModifiers?: Partial<StatModifiers>;
}

export interface StatModifiers {
  // Flat bonuses
  bonusHp: number;
  bonusMana: number;
  bonusAd: number;
  bonusAp: number;
  bonusArmor: number;
  bonusMr: number;
  flatMs: number;

  // Percent bonuses
  percentHp: number;
  percentAd: number;
  percentAp: number;
  percentAs: number;
  percentMs: number;

  // Outros
  lifeSteal: number;
  omnivamp: number;
  critChance: number;
  tenacity: number;
}

// ==========================================
// GAME STATE
// ==========================================

export type GameState = 'loading' | 'playing' | 'paused' | 'victory' | 'defeat';

export interface GameConfig {
  isARAM: boolean;
  mapWidth: number;
  mapHeight: number;
  maxLevel: number;
  respawnEnabled: boolean;
}

// ==========================================
// POSITION / VECTOR
// ==========================================

export interface Position {
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calcula distância entre duas posições
 */
export function distance(p1: Position, p2: Position): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calcula distância ao quadrado (mais rápido, use para comparações)
 */
export function distanceSquared(p1: Position, p2: Position): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return dx * dx + dy * dy;
}

/**
 * Verifica se duas entidades estão em range
 */
export function isInRange(p1: Position, p2: Position, range: number): boolean {
  return distanceSquared(p1, p2) <= range * range;
}

/**
 * Normaliza um vetor
 */
export function normalize(p: Position): Position {
  const len = Math.sqrt(p.x * p.x + p.y * p.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: p.x / len, y: p.y / len };
}

/**
 * Retorna direção de p1 para p2
 */
export function direction(from: Position, to: Position): Position {
  return normalize({ x: to.x - from.x, y: to.y - from.y });
}

/**
 * Move uma posição em uma direção
 */
export function moveTowards(from: Position, to: Position, distance: number): Position {
  const dir = direction(from, to);
  return {
    x: from.x + dir.x * distance,
    y: from.y + dir.y * distance,
  };
}
