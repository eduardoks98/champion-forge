// ==========================================
// SYSTEMS - Barrel export
// ==========================================

// Rendering systems
export { ParticleSystem } from './ParticleSystem';
export { DamageNumberSystem } from './DamageNumberSystem';
export { EffectSystem } from './EffectSystem';

// Status/Combat systems
export { StatusEffectSystem } from './StatusEffectSystem';

// Spatial/Physics systems
export { SpatialGrid } from './SpatialGrid';
export type { SpatialEntity } from './SpatialGrid';
export { ViewportCulling } from './ViewportCulling';
export { CollisionSystem, initializeCollisionSystem, CollisionLayers } from './CollisionSystem';
export { PathfindingGrid, initializePathfindingGrid, getPathfindingGrid } from './PathfindingGrid';
export type { Point } from './PathfindingGrid';

// Object pooling
export { initializePools, getPoolStats } from './ObjectPool';

// Wave/Minion system
export { WaveSystem } from './WaveSystem';

// Player systems
export { PlayerProgressionSystem, initializeProgressionSystem } from './PlayerProgressionSystem';

// New component-based systems (LoL mechanics)
export { GoldSystem, initializeGoldSystem, getGoldSystem } from './GoldSystem';
export type { PlayerGoldState, GoldEvent } from './GoldSystem';
export { ExperienceSystem, initializeExperienceSystem, getExperienceSystem } from './ExperienceSystem';
export type { PlayerXpState, XpEvent } from './ExperienceSystem';
export { RespawnSystem, initializeRespawnSystem, getRespawnSystem } from './RespawnSystem';
export type { PlayerRespawnState, RespawnEvent } from './RespawnSystem';

// Build system
export { BuildSystem } from './BuildSystem';

// V2 systems (usando novos componentes)
export { WaveSystemV2, initializeWaveSystemV2, getWaveSystemV2 } from './WaveSystemV2';
export type { WaveSystemConfig } from './WaveSystemV2';
export { DamageSystem, initializeDamageSystem, getDamageSystem } from './DamageSystem';
export type { DamageSource, DamageTarget, DamageInstance, DamageResult } from './DamageSystem';
