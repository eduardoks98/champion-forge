// ==========================================
// ENTITIES - Barrel export
// ==========================================

// Base
export { GameEntity, generateEntityId, resetEntityIdCounter } from './GameEntity';
export type { EntityConfig } from './GameEntity';

// Legacy entities (ainda em uso no GameEngine)
export { Entity } from './Entity';
export { Player } from './Player';
export { Enemy } from './Enemy';
export { Minion } from './Minion';
export type { MinionTeam } from './Minion';
export { Structure } from './Structure';
export type { StructureType, StructureTeam } from './Structure';
export { Projectile } from './Projectile';
export type { ProjectileType } from './Projectile';

// V2 entities (usando novos componentes)
export { MinionV2 } from './MinionV2';
export { EnemyV2 } from './EnemyV2';
export type { AIState } from './EnemyV2';
export { StructureV2 } from './StructureV2';
export { PlayerV2 } from './PlayerV2';
export type { DashGhost, PlayerAbility } from './PlayerV2';
