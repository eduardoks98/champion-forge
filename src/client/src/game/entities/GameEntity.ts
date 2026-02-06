// ==========================================
// GAME ENTITY - Classe base para todas as entidades
// ==========================================

import { Team, EntityType, Position, distance, distanceSquared, areEnemies } from '../data/gameTypes';
import { StatsComponent } from '../components/StatsComponent';
import { CooldownManager } from '../components/CooldownManager';
import { MovementComponent } from '../components/MovementComponent';
import { TargetingComponent, TargetableEntity } from '../components/TargetingComponent';
import { CombatComponent } from '../components/CombatComponent';

// ==========================================
// ENTITY ID GENERATOR
// ==========================================

let entityIdCounter = 0;

export function generateEntityId(prefix: string = 'entity'): string {
  return `${prefix}_${++entityIdCounter}`;
}

export function resetEntityIdCounter(): void {
  entityIdCounter = 0;
}

// ==========================================
// GAME ENTITY BASE CLASS
// ==========================================

export abstract class GameEntity implements TargetableEntity {
  // Identificação
  readonly id: string;
  readonly team: Team;
  readonly entityType: EntityType;

  // Posição (delegada ao MovementComponent se existir)
  protected _x: number;
  protected _y: number;

  // Dimensões
  width: number;
  height: number;
  hitRadius: number;

  // Estado
  isDead: boolean = false;
  isUntargetable: boolean = false;
  isInvisible: boolean = false;

  // Componentes (opcionais)
  stats?: StatsComponent;
  cooldowns?: CooldownManager;
  movement?: MovementComponent;
  targeting?: TargetingComponent;
  combat?: CombatComponent;

  // Timestamp de criação e morte
  createdAt: number;
  deathTime: number = 0;

  constructor(
    id: string,
    entityType: EntityType,
    team: Team,
    x: number,
    y: number,
    width: number = 32,
    height: number = 32
  ) {
    this.id = id;
    this.entityType = entityType;
    this.team = team;
    this._x = x;
    this._y = y;
    this.width = width;
    this.height = height;
    this.hitRadius = Math.max(width, height) / 2;
    this.createdAt = Date.now();
  }

  // ==========================================
  // POSITION GETTERS/SETTERS
  // ==========================================

  get x(): number {
    return this.movement?.x ?? this._x;
  }

  set x(value: number) {
    if (this.movement) {
      this.movement.x = value;
    }
    this._x = value;
  }

  get y(): number {
    return this.movement?.y ?? this._y;
  }

  set y(value: number) {
    if (this.movement) {
      this.movement.y = value;
    }
    this._y = value;
  }

  get centerX(): number {
    return this.x + this.width / 2;
  }

  get centerY(): number {
    return this.y + this.height / 2;
  }

  get position(): Position {
    return { x: this.x, y: this.y };
  }

  get centerPosition(): Position {
    return { x: this.centerX, y: this.centerY };
  }

  // ==========================================
  // ABSTRACT METHODS
  // ==========================================

  /**
   * Atualiza a entidade
   * @param deltaTime - Tempo desde o último frame em ms
   */
  abstract update(deltaTime: number): void;

  /**
   * Renderiza a entidade
   */
  abstract render(ctx: CanvasRenderingContext2D): void;

  // ==========================================
  // BASE METHODS
  // ==========================================

  /**
   * Calcula distância até outra entidade
   */
  distanceTo(other: GameEntity | Position): number {
    if ('x' in other && 'y' in other) {
      if ('centerX' in other) {
        // GameEntity
        return distance(this.centerPosition, (other as GameEntity).centerPosition);
      }
      // Position
      return distance(this.centerPosition, other as Position);
    }
    return Infinity;
  }

  /**
   * Calcula distância ao quadrado (mais rápido para comparações)
   */
  distanceSquaredTo(other: GameEntity | Position): number {
    if ('x' in other && 'y' in other) {
      if ('centerX' in other) {
        return distanceSquared(this.centerPosition, (other as GameEntity).centerPosition);
      }
      return distanceSquared(this.centerPosition, other as Position);
    }
    return Infinity;
  }

  /**
   * Verifica se está dentro de um range
   */
  isInRange(other: GameEntity | Position, range: number): boolean {
    return this.distanceSquaredTo(other) <= range * range;
  }

  /**
   * Verifica se pode atacar outra entidade
   */
  canAttack(other: GameEntity): boolean {
    if (this.isDead || other.isDead) return false;
    if (!areEnemies(this.team, other.team)) return false;
    if (other.isUntargetable) return false;
    return true;
  }

  /**
   * Verifica se pode ser atacado por outra entidade
   */
  canBeAttackedBy(other: GameEntity): boolean {
    if (this.isDead) return false;
    if (this.isUntargetable) return false;
    if (!areEnemies(this.team, other.team)) return false;
    return true;
  }

  /**
   * Verifica colisão com outra entidade (círculo)
   */
  collidesWith(other: GameEntity): boolean {
    const dist = this.distanceTo(other);
    return dist < this.hitRadius + other.hitRadius;
  }

  /**
   * Verifica colisão com um ponto
   */
  containsPoint(px: number, py: number): boolean {
    const dist = distance(this.centerPosition, { x: px, y: py });
    return dist <= this.hitRadius;
  }

  /**
   * Verifica colisão com um retângulo
   */
  intersectsRect(rx: number, ry: number, rw: number, rh: number): boolean {
    const closestX = Math.max(rx, Math.min(this.centerX, rx + rw));
    const closestY = Math.max(ry, Math.min(this.centerY, ry + rh));
    const dx = this.centerX - closestX;
    const dy = this.centerY - closestY;
    return (dx * dx + dy * dy) < (this.hitRadius * this.hitRadius);
  }

  // ==========================================
  // DAMAGE / HEALTH
  // ==========================================

  /**
   * Recebe dano
   * @returns Dano efetivo causado
   */
  takeDamage(amount: number): number {
    if (this.isDead || !this.stats) return 0;

    const actualDamage = this.stats.takeDamage(amount);

    if (this.stats.isDead()) {
      this.die();
    }

    return actualDamage;
  }

  /**
   * Cura HP
   * @returns Quantidade curada
   */
  heal(amount: number): number {
    if (this.isDead || !this.stats) return 0;
    return this.stats.heal(amount);
  }

  /**
   * Processa morte
   */
  die(): void {
    if (this.isDead) return;

    this.isDead = true;
    this.deathTime = Date.now();

    // Parar movimento
    this.movement?.stop();

    // Limpar alvo
    this.targeting?.clearTarget();

    // Resetar combate
    this.combat?.reset();
  }

  /**
   * Revive a entidade
   */
  revive(): void {
    this.isDead = false;
    this.deathTime = 0;

    // Resetar HP/Mana
    this.stats?.reset();

    // Resetar cooldowns
    this.cooldowns?.resetAll();

    // Resetar combate
    this.combat?.reset();
  }

  // ==========================================
  // MOVEMENT HELPERS
  // ==========================================

  /**
   * Move para uma posição
   */
  moveTo(x: number, y: number): boolean {
    if (!this.movement) return false;
    return this.movement.moveTo(x, y);
  }

  /**
   * Para movimento
   */
  stop(): void {
    this.movement?.stop();
  }

  /**
   * Teleporta para uma posição
   */
  teleport(x: number, y: number): void {
    if (this.movement) {
      this.movement.teleport(x, y);
    } else {
      this._x = x;
      this._y = y;
    }
  }

  // ==========================================
  // SERIALIZATION
  // ==========================================

  /**
   * Retorna dados básicos para TargetableEntity
   */
  toTargetable(): TargetableEntity {
    return {
      id: this.id,
      team: this.team,
      entityType: this.entityType,
      x: this.x,
      y: this.y,
      isDead: this.isDead,
      isUntargetable: this.isUntargetable,
      isInvisible: this.isInvisible,
    };
  }

  /**
   * Retorna informações básicas para debug
   */
  getDebugInfo(): string {
    return `${this.entityType}[${this.id}] pos(${Math.round(this.x)},${Math.round(this.y)}) ${this.isDead ? 'DEAD' : 'alive'}`;
  }
}

// ==========================================
// FACTORY FUNCTION
// ==========================================

export interface EntityConfig {
  id?: string;
  entityType: EntityType;
  team: Team;
  x: number;
  y: number;
  width?: number;
  height?: number;
}
