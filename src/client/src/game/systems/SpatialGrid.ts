// ==========================================
// SPATIAL GRID
// Otimiza colisões de O(n²) para O(n)
// ==========================================

import { DEFAULT_SPATIAL } from '../constants/gameDefaults';

/**
 * Interface para entidades que podem ser inseridas no grid
 */
export interface SpatialEntity {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
}

/**
 * Resultado de query no grid
 */
export interface QueryResult<T extends SpatialEntity> {
  entity: T;
  distanceSquared: number;
}

/**
 * Grid espacial para otimização de colisões
 * Divide o mundo em células e só verifica colisões entre entidades na mesma célula
 */
export class SpatialGrid<T extends SpatialEntity> {
  private cells: Map<string, T[]> = new Map();
  private entityCells: Map<string, string[]> = new Map(); // Mapeia entidade -> células que ocupa
  private cellSize: number;

  /**
   * @param cellSize Tamanho de cada célula (ex: 100 = 100x100 pixels)
   * @param _worldWidth Largura do mundo (reservado para uso futuro)
   * @param _worldHeight Altura do mundo (reservado para uso futuro)
   */
  constructor(cellSize: number = 100, _worldWidth: number = 2000, _worldHeight: number = 2000) {
    this.cellSize = cellSize;
    // worldWidth e worldHeight reservados para expansão futura (chunking, etc)
    void _worldWidth;
    void _worldHeight;
  }

  /**
   * Retorna todas as chaves de células que uma entidade ocupa
   */
  private getEntityCellKeys(entity: T): string[] {
    const keys: string[] = [];
    const radius = entity.radius ?? (Math.max(entity.width ?? 0, entity.height ?? 0) / 2 || DEFAULT_SPATIAL.ENTITY_RADIUS);

    // Calcula bounds da entidade
    const minX = entity.x - radius;
    const maxX = entity.x + radius;
    const minY = entity.y - radius;
    const maxY = entity.y + radius;

    // Encontra todas as células que a entidade toca
    const minCellX = Math.floor(minX / this.cellSize);
    const maxCellX = Math.floor(maxX / this.cellSize);
    const minCellY = Math.floor(minY / this.cellSize);
    const maxCellY = Math.floor(maxY / this.cellSize);

    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        keys.push(`${cx},${cy}`);
      }
    }

    return keys;
  }

  /**
   * Insere uma entidade no grid
   */
  insert(entity: T): void {
    const cellKeys = this.getEntityCellKeys(entity);

    for (const key of cellKeys) {
      if (!this.cells.has(key)) {
        this.cells.set(key, []);
      }
      const cell = this.cells.get(key)!;
      if (!cell.includes(entity)) {
        cell.push(entity);
      }
    }

    this.entityCells.set(entity.id, cellKeys);
  }

  /**
   * Remove uma entidade do grid
   */
  remove(entity: T): void {
    const cellKeys = this.entityCells.get(entity.id);
    if (!cellKeys) return;

    for (const key of cellKeys) {
      const cell = this.cells.get(key);
      if (cell) {
        const index = cell.indexOf(entity);
        if (index !== -1) {
          cell.splice(index, 1);
        }
        // Remove célula vazia para economizar memória
        if (cell.length === 0) {
          this.cells.delete(key);
        }
      }
    }

    this.entityCells.delete(entity.id);
  }

  /**
   * Atualiza a posição de uma entidade no grid
   */
  update(entity: T): void {
    const oldKeys = this.entityCells.get(entity.id) || [];
    const newKeys = this.getEntityCellKeys(entity);

    // Verifica se mudou de célula
    const oldSet = new Set(oldKeys);
    const newSet = new Set(newKeys);

    let changed = oldKeys.length !== newKeys.length;
    if (!changed) {
      for (const key of newKeys) {
        if (!oldSet.has(key)) {
          changed = true;
          break;
        }
      }
    }

    if (changed) {
      // Remove das células antigas
      for (const key of oldKeys) {
        if (!newSet.has(key)) {
          const cell = this.cells.get(key);
          if (cell) {
            const index = cell.indexOf(entity);
            if (index !== -1) {
              cell.splice(index, 1);
            }
            if (cell.length === 0) {
              this.cells.delete(key);
            }
          }
        }
      }

      // Adiciona nas novas células
      for (const key of newKeys) {
        if (!oldSet.has(key)) {
          if (!this.cells.has(key)) {
            this.cells.set(key, []);
          }
          this.cells.get(key)!.push(entity);
        }
      }

      this.entityCells.set(entity.id, newKeys);
    }
  }

  /**
   * Query: encontra entidades próximas a um ponto
   * @param x Posição X
   * @param y Posição Y
   * @param radius Raio de busca
   * @param excludeId ID para excluir dos resultados (geralmente a própria entidade)
   */
  queryRadius(x: number, y: number, radius: number, excludeId?: string): T[] {
    const results: T[] = [];
    const radiusSquared = radius * radius;
    const checked = new Set<string>();

    // Calcula células que o raio toca
    const minCellX = Math.floor((x - radius) / this.cellSize);
    const maxCellX = Math.floor((x + radius) / this.cellSize);
    const minCellY = Math.floor((y - radius) / this.cellSize);
    const maxCellY = Math.floor((y + radius) / this.cellSize);

    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        const key = `${cx},${cy}`;
        const cell = this.cells.get(key);
        if (!cell) continue;

        for (const entity of cell) {
          if (checked.has(entity.id)) continue;
          if (excludeId && entity.id === excludeId) continue;

          checked.add(entity.id);

          const dx = entity.x - x;
          const dy = entity.y - y;
          const distSq = dx * dx + dy * dy;

          if (distSq <= radiusSquared) {
            results.push(entity);
          }
        }
      }
    }

    return results;
  }

  /**
   * Query: encontra entidades em uma área retangular
   */
  queryRect(x: number, y: number, width: number, height: number, excludeId?: string): T[] {
    const results: T[] = [];
    const checked = new Set<string>();

    const minCellX = Math.floor(x / this.cellSize);
    const maxCellX = Math.floor((x + width) / this.cellSize);
    const minCellY = Math.floor(y / this.cellSize);
    const maxCellY = Math.floor((y + height) / this.cellSize);

    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        const key = `${cx},${cy}`;
        const cell = this.cells.get(key);
        if (!cell) continue;

        for (const entity of cell) {
          if (checked.has(entity.id)) continue;
          if (excludeId && entity.id === excludeId) continue;

          checked.add(entity.id);

          // Verifica se está dentro do retângulo
          if (entity.x >= x && entity.x <= x + width &&
              entity.y >= y && entity.y <= y + height) {
            results.push(entity);
          }
        }
      }
    }

    return results;
  }

  /**
   * Encontra entidades próximas a uma entidade específica
   */
  getNearby(entity: T, radius?: number): T[] {
    const searchRadius = radius || this.cellSize;
    return this.queryRadius(entity.x, entity.y, searchRadius, entity.id);
  }

  /**
   * Encontra a entidade mais próxima
   */
  findNearest(x: number, y: number, maxRadius: number, excludeId?: string): T | null {
    const candidates = this.queryRadius(x, y, maxRadius, excludeId);
    if (candidates.length === 0) return null;

    let nearest: T | null = null;
    let nearestDistSq = Infinity;

    for (const entity of candidates) {
      const dx = entity.x - x;
      const dy = entity.y - y;
      const distSq = dx * dx + dy * dy;

      if (distSq < nearestDistSq) {
        nearestDistSq = distSq;
        nearest = entity;
      }
    }

    return nearest;
  }

  /**
   * Verifica colisão entre duas entidades (círculo vs círculo)
   */
  checkCollision(a: T, b: T): boolean {
    const radiusA = a.radius ?? (Math.max(a.width ?? 0, a.height ?? 0) / 2 || DEFAULT_SPATIAL.COLLISION_RADIUS);
    const radiusB = b.radius ?? (Math.max(b.width ?? 0, b.height ?? 0) / 2 || DEFAULT_SPATIAL.COLLISION_RADIUS);
    const minDist = radiusA + radiusB;

    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distSq = dx * dx + dy * dy;

    return distSq <= minDist * minDist;
  }

  /**
   * Encontra todas as colisões para uma entidade
   */
  findCollisions(entity: T): T[] {
    const nearby = this.getNearby(entity);
    return nearby.filter(other => this.checkCollision(entity, other));
  }

  /**
   * Limpa todo o grid
   */
  clear(): void {
    this.cells.clear();
    this.entityCells.clear();
  }

  /**
   * Estatísticas do grid
   */
  getStats(): { cells: number; entities: number; avgPerCell: number } {
    let totalEntities = 0;
    for (const cell of this.cells.values()) {
      totalEntities += cell.length;
    }

    return {
      cells: this.cells.size,
      entities: this.entityCells.size,
      avgPerCell: this.cells.size > 0 ? totalEntities / this.cells.size : 0
    };
  }

  /**
   * Debug: desenha o grid no canvas
   */
  debugDraw(ctx: CanvasRenderingContext2D, offsetX: number = 0, offsetY: number = 0): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';

    for (const [key, entities] of this.cells.entries()) {
      const [cx, cy] = key.split(',').map(Number);
      const x = cx * this.cellSize - offsetX;
      const y = cy * this.cellSize - offsetY;

      // Desenha a célula
      ctx.strokeRect(x, y, this.cellSize, this.cellSize);

      // Mostra quantidade de entidades
      if (entities.length > 0) {
        ctx.fillText(`${entities.length}`, x + 2, y + 12);
      }
    }

    ctx.restore();
  }
}

// ==========================================
// GRID GLOBAL PARA INIMIGOS
// ==========================================

let enemyGrid: SpatialGrid<SpatialEntity> | null = null;

/**
 * Inicializa o grid de inimigos
 */
export function initializeEnemyGrid(cellSize: number = 100, worldWidth: number = 2000, worldHeight: number = 2000): SpatialGrid<SpatialEntity> {
  enemyGrid = new SpatialGrid(cellSize, worldWidth, worldHeight);
  console.log('[SpatialGrid] Enemy grid initialized:', { cellSize, worldWidth, worldHeight });
  return enemyGrid;
}

/**
 * Retorna o grid de inimigos
 */
export function getEnemyGrid(): SpatialGrid<SpatialEntity> {
  if (!enemyGrid) {
    enemyGrid = new SpatialGrid(100, 2000, 2000);
  }
  return enemyGrid;
}
