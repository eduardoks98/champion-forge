// ==========================================
// MOVEMENT COMPONENT - Pathfinding unificado para todas as entidades
// ==========================================

import { Position, distance, direction, moveTowards } from '../data/gameTypes';

// ==========================================
// PATHFINDING INTERFACE
// ==========================================

export interface PathNode {
  x: number;
  y: number;
}

export interface PathfindingGrid {
  findPath(startX: number, startY: number, endX: number, endY: number): PathNode[] | null;
  isWalkable(x: number, y: number): boolean;
}

// ==========================================
// MOVEMENT STATE
// ==========================================

export type MovementState =
  | 'idle'          // Parado
  | 'moving'        // Movendo para destino
  | 'following'     // Seguindo um alvo
  | 'pathing'       // Seguindo path calculado
  | 'dashing'       // Em dash (não pode ser interrompido)
  | 'knocked';      // Sendo empurrado

export interface MovementTarget {
  type: 'position' | 'entity';
  position?: Position;
  entityId?: string;
  stopDistance?: number; // Distância para parar antes do alvo
}

// ==========================================
// MOVEMENT COMPONENT
// ==========================================

export class MovementComponent {
  // Posição atual
  x: number;
  y: number;

  // Referência para grid de pathfinding
  private pathfindingGrid: PathfindingGrid | null = null;

  // Estado de movimento
  private state: MovementState = 'idle';
  private target: MovementTarget | null = null;

  // Path atual
  private currentPath: PathNode[] = [];
  private pathIndex: number = 0;

  // Velocidade
  private baseSpeed: number = 300;
  private speedMultiplier: number = 1;

  // Dash
  private dashVelocity: { x: number; y: number } = { x: 0, y: 0 };
  private dashDuration: number = 0;
  private dashElapsed: number = 0;

  // Knockback
  private knockbackVelocity: { x: number; y: number } = { x: 0, y: 0 };
  private knockbackDuration: number = 0;
  private knockbackElapsed: number = 0;

  // Callbacks
  private onArrival: (() => void) | null = null;
  private onPathBlocked: (() => void) | null = null;

  // Bounds do mapa
  private mapBounds: { minX: number; minY: number; maxX: number; maxY: number } | null = null;

  constructor(x: number, y: number, speed: number = 300) {
    this.x = x;
    this.y = y;
    this.baseSpeed = speed;
  }

  // ==========================================
  // SETUP
  // ==========================================

  setPathfindingGrid(grid: PathfindingGrid): void {
    this.pathfindingGrid = grid;
  }

  setMapBounds(minX: number, minY: number, maxX: number, maxY: number): void {
    this.mapBounds = { minX, minY, maxX, maxY };
  }

  setSpeed(speed: number): void {
    this.baseSpeed = speed;
  }

  setSpeedMultiplier(multiplier: number): void {
    this.speedMultiplier = multiplier;
  }

  // ==========================================
  // MOVEMENT COMMANDS
  // ==========================================

  /**
   * Move para uma posição usando pathfinding
   */
  moveTo(targetX: number, targetY: number, stopDistance: number = 0): boolean {
    // Se está em dash ou knockback, não pode mover
    if (this.state === 'dashing' || this.state === 'knocked') {
      return false;
    }

    this.target = {
      type: 'position',
      position: { x: targetX, y: targetY },
      stopDistance,
    };

    // Tentar calcular path
    if (this.pathfindingGrid) {
      const path = this.pathfindingGrid.findPath(this.x, this.y, targetX, targetY);
      if (path && path.length > 0) {
        this.currentPath = path;
        this.pathIndex = 0;
        this.state = 'pathing';
        return true;
      }
    }

    // Fallback: mover diretamente
    this.state = 'moving';
    return true;
  }

  /**
   * Segue uma entidade
   */
  followEntity(
    entityId: string,
    getEntityPosition: () => Position | null,
    stopDistance: number = 50
  ): boolean {
    if (this.state === 'dashing' || this.state === 'knocked') {
      return false;
    }

    const pos = getEntityPosition();
    if (!pos) return false;

    this.target = {
      type: 'entity',
      entityId,
      position: pos,
      stopDistance,
    };

    this.state = 'following';
    return true;
  }

  /**
   * Para movimento
   */
  stop(): void {
    if (this.state === 'dashing' || this.state === 'knocked') return;

    this.state = 'idle';
    this.target = null;
    this.currentPath = [];
    this.pathIndex = 0;
  }

  /**
   * Executa dash em uma direção
   */
  dash(
    directionX: number,
    directionY: number,
    distance: number,
    durationMs: number
  ): void {
    const speed = distance / (durationMs / 1000);
    const len = Math.sqrt(directionX * directionX + directionY * directionY);

    if (len > 0) {
      this.dashVelocity = {
        x: (directionX / len) * speed,
        y: (directionY / len) * speed,
      };
    }

    this.dashDuration = durationMs;
    this.dashElapsed = 0;
    this.state = 'dashing';
  }

  /**
   * Dash em direção a um ponto
   */
  dashTowards(targetX: number, targetY: number, distance: number, durationMs: number): void {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    this.dash(dx, dy, distance, durationMs);
  }

  /**
   * Aplica knockback
   */
  knockback(
    fromX: number,
    fromY: number,
    distance: number,
    durationMs: number
  ): void {
    const dx = this.x - fromX;
    const dy = this.y - fromY;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len > 0) {
      const speed = distance / (durationMs / 1000);
      this.knockbackVelocity = {
        x: (dx / len) * speed,
        y: (dy / len) * speed,
      };
    }

    this.knockbackDuration = durationMs;
    this.knockbackElapsed = 0;
    this.state = 'knocked';
  }

  // ==========================================
  // UPDATE
  // ==========================================

  /**
   * Atualiza movimento
   * @returns true se ainda está se movendo
   */
  update(deltaTimeMs: number, getEntityPosition?: (id: string) => Position | null): boolean {
    const deltaSeconds = deltaTimeMs / 1000;

    switch (this.state) {
      case 'idle':
        return false;

      case 'dashing':
        return this.updateDash(deltaTimeMs);

      case 'knocked':
        return this.updateKnockback(deltaTimeMs);

      case 'pathing':
        return this.updatePathing(deltaSeconds);

      case 'following':
        return this.updateFollowing(deltaSeconds, getEntityPosition);

      case 'moving':
        return this.updateDirectMove(deltaSeconds);

      default:
        return false;
    }
  }

  private updateDash(deltaTimeMs: number): boolean {
    this.dashElapsed += deltaTimeMs;

    if (this.dashElapsed >= this.dashDuration) {
      this.state = 'idle';
      this.dashVelocity = { x: 0, y: 0 };
      return false;
    }

    const deltaSeconds = deltaTimeMs / 1000;
    let newX = this.x + this.dashVelocity.x * deltaSeconds;
    let newY = this.y + this.dashVelocity.y * deltaSeconds;

    // Clamp to bounds
    if (this.mapBounds) {
      newX = Math.max(this.mapBounds.minX, Math.min(this.mapBounds.maxX, newX));
      newY = Math.max(this.mapBounds.minY, Math.min(this.mapBounds.maxY, newY));
    }

    // Check walkability
    if (this.pathfindingGrid && !this.pathfindingGrid.isWalkable(newX, newY)) {
      this.state = 'idle';
      return false;
    }

    this.x = newX;
    this.y = newY;
    return true;
  }

  private updateKnockback(deltaTimeMs: number): boolean {
    this.knockbackElapsed += deltaTimeMs;

    if (this.knockbackElapsed >= this.knockbackDuration) {
      this.state = 'idle';
      this.knockbackVelocity = { x: 0, y: 0 };
      return false;
    }

    const deltaSeconds = deltaTimeMs / 1000;
    let newX = this.x + this.knockbackVelocity.x * deltaSeconds;
    let newY = this.y + this.knockbackVelocity.y * deltaSeconds;

    // Clamp to bounds
    if (this.mapBounds) {
      newX = Math.max(this.mapBounds.minX, Math.min(this.mapBounds.maxX, newX));
      newY = Math.max(this.mapBounds.minY, Math.min(this.mapBounds.maxY, newY));
    }

    this.x = newX;
    this.y = newY;
    return true;
  }

  private updatePathing(deltaSeconds: number): boolean {
    if (this.currentPath.length === 0 || this.pathIndex >= this.currentPath.length) {
      this.state = 'idle';
      this.onArrival?.();
      return false;
    }

    const targetNode = this.currentPath[this.pathIndex];
    const dist = distance({ x: this.x, y: this.y }, targetNode);
    const moveSpeed = this.baseSpeed * this.speedMultiplier;
    const moveDistance = moveSpeed * deltaSeconds;

    if (dist <= moveDistance) {
      // Chegou no node, ir para próximo
      this.x = targetNode.x;
      this.y = targetNode.y;
      this.pathIndex++;

      if (this.pathIndex >= this.currentPath.length) {
        this.state = 'idle';
        this.onArrival?.();
        return false;
      }
    } else {
      // Mover em direção ao node
      const newPos = moveTowards({ x: this.x, y: this.y }, targetNode, moveDistance);
      this.x = newPos.x;
      this.y = newPos.y;
    }

    return true;
  }

  private updateFollowing(
    deltaSeconds: number,
    getEntityPosition?: (id: string) => Position | null
  ): boolean {
    if (!this.target || this.target.type !== 'entity' || !getEntityPosition) {
      this.state = 'idle';
      return false;
    }

    // Atualizar posição do alvo
    const targetPos = getEntityPosition(this.target.entityId!);
    if (!targetPos) {
      this.state = 'idle';
      return false;
    }

    this.target.position = targetPos;

    const dist = distance({ x: this.x, y: this.y }, targetPos);
    const stopDist = this.target.stopDistance || 0;

    if (dist <= stopDist) {
      // Já está perto o suficiente
      return false;
    }

    // Mover em direção ao alvo
    const moveSpeed = this.baseSpeed * this.speedMultiplier;
    const moveDistance = moveSpeed * deltaSeconds;

    const newPos = moveTowards({ x: this.x, y: this.y }, targetPos, Math.min(moveDistance, dist - stopDist));

    // Check walkability
    if (this.pathfindingGrid && !this.pathfindingGrid.isWalkable(newPos.x, newPos.y)) {
      // Tentar recalcular path
      this.onPathBlocked?.();
      return false;
    }

    this.x = newPos.x;
    this.y = newPos.y;
    return true;
  }

  private updateDirectMove(deltaSeconds: number): boolean {
    if (!this.target || !this.target.position) {
      this.state = 'idle';
      return false;
    }

    const targetPos = this.target.position;
    const dist = distance({ x: this.x, y: this.y }, targetPos);
    const stopDist = this.target.stopDistance || 0;

    if (dist <= stopDist) {
      this.state = 'idle';
      this.onArrival?.();
      return false;
    }

    const moveSpeed = this.baseSpeed * this.speedMultiplier;
    const moveDistance = moveSpeed * deltaSeconds;

    const newPos = moveTowards({ x: this.x, y: this.y }, targetPos, Math.min(moveDistance, dist - stopDist));

    // Check walkability
    if (this.pathfindingGrid && !this.pathfindingGrid.isWalkable(newPos.x, newPos.y)) {
      this.onPathBlocked?.();
      return false;
    }

    // Clamp to bounds
    if (this.mapBounds) {
      newPos.x = Math.max(this.mapBounds.minX, Math.min(this.mapBounds.maxX, newPos.x));
      newPos.y = Math.max(this.mapBounds.minY, Math.min(this.mapBounds.maxY, newPos.y));
    }

    this.x = newPos.x;
    this.y = newPos.y;

    // Check if arrived
    if (distance({ x: this.x, y: this.y }, targetPos) <= stopDist) {
      this.state = 'idle';
      this.onArrival?.();
      return false;
    }

    return true;
  }

  // ==========================================
  // QUERIES
  // ==========================================

  getState(): MovementState {
    return this.state;
  }

  isMoving(): boolean {
    return this.state !== 'idle';
  }

  isDashing(): boolean {
    return this.state === 'dashing';
  }

  isKnocked(): boolean {
    return this.state === 'knocked';
  }

  canMove(): boolean {
    return this.state !== 'dashing' && this.state !== 'knocked';
  }

  getPosition(): Position {
    return { x: this.x, y: this.y };
  }

  getTargetPosition(): Position | null {
    return this.target?.position || null;
  }

  getCurrentSpeed(): number {
    return this.baseSpeed * this.speedMultiplier;
  }

  getDirection(): Position {
    if (!this.target?.position) {
      return { x: 0, y: 0 };
    }
    return direction({ x: this.x, y: this.y }, this.target.position);
  }

  // ==========================================
  // CALLBACKS
  // ==========================================

  setOnArrival(callback: () => void): void {
    this.onArrival = callback;
  }

  setOnPathBlocked(callback: () => void): void {
    this.onPathBlocked = callback;
  }

  // ==========================================
  // TELEPORT
  // ==========================================

  /**
   * Teleporta para uma posição (ignora pathfinding)
   */
  teleport(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.stop();
  }

  /**
   * Seta posição sem parar movimento
   */
  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }
}
