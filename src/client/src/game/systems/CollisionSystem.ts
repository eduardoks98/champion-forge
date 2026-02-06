// ==========================================
// COLLISION SYSTEM
// ==========================================
// Sistema de colisão otimizado usando Spatial Grid
// Suporta:
// - Colisão círculo vs círculo
// - Colisão AABB (retângulo vs retângulo)
// - Separação de entidades (push-back)
// ==========================================

import { SpatialGrid, SpatialEntity } from './SpatialGrid';
import { DEFAULT_SPATIAL } from '../constants/gameDefaults';
import { getEntityRadius, safeGet } from '../constants/SafeAccessor';

/**
 * Entidade com colisão
 */
export interface CollidableEntity extends SpatialEntity {
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
  // Propriedades de colisão
  isStatic?: boolean;      // Não move quando colide
  isTrigger?: boolean;     // Detecta colisão mas não impede movimento
  collisionLayer?: number; // Para filtrar colisões
  collisionMask?: number;  // Com quais layers pode colidir
}

/**
 * Resultado de uma colisão
 */
export interface CollisionResult {
  entityA: CollidableEntity;
  entityB: CollidableEntity;
  overlap: number;         // Quanto estão sobrepostos
  normalX: number;         // Direção de separação (X)
  normalY: number;         // Direção de separação (Y)
}

/**
 * Layers de colisão pré-definidos
 */
export const CollisionLayers = {
  NONE: 0,
  PLAYER: 1 << 0,      // 1
  ENEMY: 1 << 1,       // 2
  PROJECTILE: 1 << 2,  // 4
  OBSTACLE: 1 << 3,    // 8
  PICKUP: 1 << 4,      // 16
  ALL: 0xFFFFFFFF      // Todos
} as const;

/**
 * Sistema de Colisão
 */
export class CollisionSystem {
  private spatialGrid: SpatialGrid<CollidableEntity>;
  private cellSize: number;

  constructor(cellSize: number = 100, worldWidth: number = 2000, worldHeight: number = 2000) {
    this.cellSize = cellSize;
    this.spatialGrid = new SpatialGrid<CollidableEntity>(cellSize, worldWidth, worldHeight);
  }

  /**
   * Adiciona entidade ao sistema de colisão
   */
  addEntity(entity: CollidableEntity): void {
    this.spatialGrid.insert(entity);
  }

  /**
   * Remove entidade do sistema
   */
  removeEntity(entity: CollidableEntity): void {
    this.spatialGrid.remove(entity);
  }

  /**
   * Atualiza posição de uma entidade no grid
   */
  updateEntity(entity: CollidableEntity): void {
    this.spatialGrid.update(entity);
  }

  /**
   * Verifica colisão círculo vs círculo
   */
  circleVsCircle(
    x1: number, y1: number, r1: number,
    x2: number, y2: number, r2: number
  ): { colliding: boolean; overlap: number; normalX: number; normalY: number } {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distSq = dx * dx + dy * dy;
    const minDist = r1 + r2;
    const minDistSq = minDist * minDist;

    if (distSq >= minDistSq) {
      return { colliding: false, overlap: 0, normalX: 0, normalY: 0 };
    }

    const dist = Math.sqrt(distSq);
    const overlap = minDist - dist;

    // Normal de separação
    let normalX = 0;
    let normalY = 0;

    if (dist > 0.0001) {
      normalX = dx / dist;
      normalY = dy / dist;
    } else {
      // Entidades estão exatamente na mesma posição - separar aleatoriamente
      const angle = Math.random() * Math.PI * 2;
      normalX = Math.cos(angle);
      normalY = Math.sin(angle);
    }

    return { colliding: true, overlap, normalX, normalY };
  }

  /**
   * Verifica colisão AABB (retângulo vs retângulo)
   */
  aabbVsAabb(
    x1: number, y1: number, w1: number, h1: number,
    x2: number, y2: number, w2: number, h2: number
  ): { colliding: boolean; overlapX: number; overlapY: number } {
    const left1 = x1;
    const right1 = x1 + w1;
    const top1 = y1;
    const bottom1 = y1 + h1;

    const left2 = x2;
    const right2 = x2 + w2;
    const top2 = y2;
    const bottom2 = y2 + h2;

    // Não colide se separados em qualquer eixo
    if (right1 <= left2 || right2 <= left1 || bottom1 <= top2 || bottom2 <= top1) {
      return { colliding: false, overlapX: 0, overlapY: 0 };
    }

    // Calcular overlap em cada eixo
    const overlapLeft = right1 - left2;
    const overlapRight = right2 - left1;
    const overlapTop = bottom1 - top2;
    const overlapBottom = bottom2 - top1;

    const overlapX = Math.min(overlapLeft, overlapRight);
    const overlapY = Math.min(overlapTop, overlapBottom);

    return { colliding: true, overlapX, overlapY };
  }

  /**
   * Verifica se duas layers podem colidir
   */
  canCollide(entityA: CollidableEntity, entityB: CollidableEntity): boolean {
    const layerA = safeGet(entityA.collisionLayer, CollisionLayers.ALL, 'CollisionSystem.canCollide.layerA');
    const maskA = safeGet(entityA.collisionMask, CollisionLayers.ALL, 'CollisionSystem.canCollide.maskA');
    const layerB = safeGet(entityB.collisionLayer, CollisionLayers.ALL, 'CollisionSystem.canCollide.layerB');
    const maskB = safeGet(entityB.collisionMask, CollisionLayers.ALL, 'CollisionSystem.canCollide.maskB');

    // A pode colidir com B se a layer de B está na mask de A
    // E B pode colidir com A se a layer de A está na mask de B
    return (layerB & maskA) !== 0 && (layerA & maskB) !== 0;
  }

  /**
   * Encontra todas as colisões para uma entidade
   */
  findCollisions(entity: CollidableEntity): CollisionResult[] {
    const results: CollisionResult[] = [];
    const radius = getEntityRadius(entity, DEFAULT_SPATIAL.COLLISION_RADIUS, 'CollisionSystem.findCollisions.entity');

    // Usar centro da entidade para query
    const centerX = entity.x + entity.width / 2;
    const centerY = entity.y + entity.height / 2;

    // Query entidades próximas
    const nearby = this.spatialGrid.queryRadius(centerX, centerY, radius + this.cellSize);

    for (const other of nearby) {
      if (other.id === entity.id) continue;
      if (!this.canCollide(entity, other)) continue;

      const otherRadius = getEntityRadius(other, DEFAULT_SPATIAL.COLLISION_RADIUS, 'CollisionSystem.findCollisions.other');
      const otherCenterX = other.x + other.width / 2;
      const otherCenterY = other.y + other.height / 2;

      const collision = this.circleVsCircle(
        centerX, centerY, radius,
        otherCenterX, otherCenterY, otherRadius
      );

      if (collision.colliding) {
        results.push({
          entityA: entity,
          entityB: other,
          overlap: collision.overlap,
          normalX: collision.normalX,
          normalY: collision.normalY
        });
      }
    }

    return results;
  }

  /**
   * Resolve colisão separando entidades
   * Retorna o deslocamento aplicado à entidade
   */
  resolveCollision(
    entity: CollidableEntity,
    collision: CollisionResult
  ): { dx: number; dy: number } {
    const other = collision.entityA.id === entity.id ? collision.entityB : collision.entityA;

    // Se a outra entidade é trigger, não separar
    if (other.isTrigger) {
      return { dx: 0, dy: 0 };
    }

    // Calcular separação
    let separationRatio = 0.5; // Por padrão, ambos se movem igualmente

    if (entity.isStatic && other.isStatic) {
      // Ambos estáticos - ninguém move
      return { dx: 0, dy: 0 };
    } else if (entity.isStatic) {
      // Esta entidade é estática - só a outra move
      return { dx: 0, dy: 0 };
    } else if (other.isStatic) {
      // A outra é estática - só esta move
      separationRatio = 1.0;
    }

    // Ajustar normal para apontar de other para entity
    let normalX = collision.normalX;
    let normalY = collision.normalY;

    if (collision.entityA.id !== entity.id) {
      normalX = -normalX;
      normalY = -normalY;
    }

    // Calcular deslocamento
    const separation = collision.overlap * separationRatio + 0.1; // +0.1 para garantir separação
    const dx = normalX * separation;
    const dy = normalY * separation;

    return { dx, dy };
  }

  /**
   * Processa todas as colisões e aplica separação
   * Retorna lista de todas as colisões detectadas
   */
  processCollisions(entities: CollidableEntity[]): CollisionResult[] {
    const allCollisions: CollisionResult[] = [];
    const processed = new Set<string>();

    for (const entity of entities) {
      if (entity.isStatic) continue; // Entidades estáticas não precisam processar

      const collisions = this.findCollisions(entity);

      for (const collision of collisions) {
        // Evitar processar a mesma colisão duas vezes
        const pairKey = [entity.id, collision.entityB.id].sort().join('-');
        if (processed.has(pairKey)) continue;
        processed.add(pairKey);

        allCollisions.push(collision);

        // Aplicar separação
        if (!entity.isTrigger && !collision.entityB.isTrigger) {
          const { dx, dy } = this.resolveCollision(entity, collision);
          entity.x += dx;
          entity.y += dy;

          // Atualizar no spatial grid
          this.updateEntity(entity);
        }
      }
    }

    return allCollisions;
  }

  /**
   * Raycast: verifica se há obstáculo entre dois pontos
   */
  raycast(
    startX: number, startY: number,
    endX: number, endY: number,
    excludeId?: string
  ): { hit: boolean; entity?: CollidableEntity; point?: { x: number; y: number } } {
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) {
      return { hit: false };
    }

    const dirX = dx / length;
    const dirY = dy / length;

    // Passo do ray (quanto avançar por iteração)
    const step = this.cellSize / 2;
    const steps = Math.ceil(length / step);

    for (let i = 0; i <= steps; i++) {
      const t = Math.min(i * step, length);
      const x = startX + dirX * t;
      const y = startY + dirY * t;

      // Query entidades nesse ponto
      const nearby = this.spatialGrid.queryRadius(x, y, 5);

      for (const entity of nearby) {
        if (excludeId && entity.id === excludeId) continue;
        if (entity.isTrigger) continue;

        const radius = getEntityRadius(entity, DEFAULT_SPATIAL.COLLISION_RADIUS, 'CollisionSystem.raycast.entity');
        const centerX = entity.x + entity.width / 2;
        const centerY = entity.y + entity.height / 2;

        const distSq = (x - centerX) ** 2 + (y - centerY) ** 2;

        if (distSq <= radius * radius) {
          return { hit: true, entity, point: { x, y } };
        }
      }
    }

    return { hit: false };
  }

  /**
   * Limpa o sistema
   */
  clear(): void {
    this.spatialGrid.clear();
  }

  /**
   * Debug: desenha colisões no canvas
   */
  debugDraw(ctx: CanvasRenderingContext2D, entities: CollidableEntity[]): void {
    ctx.save();

    for (const entity of entities) {
      const radius = getEntityRadius(entity, DEFAULT_SPATIAL.COLLISION_RADIUS, 'CollisionSystem.debugDraw');
      const centerX = entity.x + entity.width / 2;
      const centerY = entity.y + entity.height / 2;

      // Círculo de colisão
      ctx.strokeStyle = entity.isStatic ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 255, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Bounding box
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
      ctx.strokeRect(entity.x, entity.y, entity.width, entity.height);
    }

    ctx.restore();
  }
}

// ==========================================
// SINGLETON GLOBAL
// ==========================================

let globalCollisionSystem: CollisionSystem | null = null;

/**
 * Inicializa o sistema de colisão global
 */
export function initializeCollisionSystem(
  cellSize: number = 100,
  worldWidth: number = 2000,
  worldHeight: number = 2000
): CollisionSystem {
  globalCollisionSystem = new CollisionSystem(cellSize, worldWidth, worldHeight);
  return globalCollisionSystem;
}

/**
 * Retorna o sistema de colisão global
 */
export function getCollisionSystem(): CollisionSystem {
  if (!globalCollisionSystem) {
    globalCollisionSystem = new CollisionSystem();
  }
  return globalCollisionSystem;
}
