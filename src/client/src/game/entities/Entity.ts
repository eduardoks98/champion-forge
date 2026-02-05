import { COLORS } from '../constants/colors';
import { StatusEffectSystem, StatusEffectType } from '../systems/StatusEffectSystem';

export interface Vector2 {
  x: number;
  y: number;
}

export interface EntityOptions {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  hp?: number;
  maxHp?: number;
}

export abstract class Entity {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  hp: number;
  maxHp: number;

  // Animation state
  isHit: boolean = false;
  hitTimer: number = 0;
  isDead: boolean = false;
  deathTimer: number = 0;
  deathScale: number = 1;

  // Reference to status effect system (set by GameEngine)
  protected statusEffectSystem?: StatusEffectSystem;

  constructor(options: EntityOptions) {
    this.id = options.id;
    this.x = options.x;
    this.y = options.y;
    this.width = options.width;
    this.height = options.height;
    this.color = options.color;
    this.maxHp = options.maxHp ?? 100;
    this.hp = options.hp ?? this.maxHp;
  }

  abstract update(deltaTime: number): void;
  abstract render(ctx: CanvasRenderingContext2D): void;

  get centerX(): number {
    return this.x + this.width / 2;
  }

  get centerY(): number {
    return this.y + this.height / 2;
  }

  // Distância entre centros de duas entidades
  distanceTo(other: Entity): number {
    const dx = this.centerX - other.centerX;
    const dy = this.centerY - other.centerY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Direção para outra entidade (normalizada)
  directionTo(other: Entity): Vector2 {
    const dx = other.centerX - this.centerX;
    const dy = other.centerY - this.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return { x: 0, y: 0 };
    return { x: dx / dist, y: dy / dist };
  }

  // Receber dano
  takeDamage(amount: number): void {
    this.hp = Math.max(0, this.hp - amount);
    this.isHit = true;
    this.hitTimer = 200; // ms

    if (this.hp <= 0) {
      this.isDead = true;
      this.deathTimer = 300; // ms
    }
  }

  // Curar
  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  // Atualizar timers de animação
  protected updateAnimationTimers(deltaTime: number): void {
    if (this.isHit) {
      this.hitTimer -= deltaTime;
      if (this.hitTimer <= 0) {
        this.isHit = false;
        this.hitTimer = 0;
      }
    }

    if (this.isDead) {
      this.deathTimer -= deltaTime;
      this.deathScale = Math.max(0, this.deathTimer / 300);
    }
  }

  // Renderizar barra de vida
  protected renderHealthBar(ctx: CanvasRenderingContext2D): void {
    const barWidth = this.width;
    const barHeight = 6;
    const barX = this.x;
    const barY = this.y - 12;

    // Background
    ctx.fillStyle = COLORS.healthBar;
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Health fill
    const healthPercent = this.hp / this.maxHp;
    const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    gradient.addColorStop(0, COLORS.healthFill[0]);
    gradient.addColorStop(1, COLORS.healthFill[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
  }

  // Checar colisão circular
  collidesWith(other: Entity): boolean {
    const dist = this.distanceTo(other);
    const minDist = (this.width + other.width) / 2;
    return dist < minDist;
  }

  // Verificar se está fora dos limites
  isOutOfBounds(width: number, height: number): boolean {
    return this.x < -this.width || this.x > width ||
           this.y < -this.height || this.y > height;
  }

  // Set status effect system reference
  setStatusEffectSystem(system: StatusEffectSystem): void {
    this.statusEffectSystem = system;
  }

  // Status effect helpers
  isStunned(): boolean {
    return this.statusEffectSystem?.isStunned(this.id) ?? false;
  }

  isRooted(): boolean {
    return this.statusEffectSystem?.isRooted(this.id) ?? false;
  }

  canMove(): boolean {
    return this.statusEffectSystem?.canMove(this.id) ?? true;
  }

  canAct(): boolean {
    return this.statusEffectSystem?.canAct(this.id) ?? true;
  }

  getSpeedMultiplier(): number {
    return this.statusEffectSystem?.getSpeedMultiplier(this.id) ?? 1.0;
  }

  getShieldAmount(): number {
    return this.statusEffectSystem?.getShieldAmount(this.id) ?? 0;
  }

  hasStatusEffect(type: StatusEffectType): boolean {
    return this.statusEffectSystem?.hasEffect(this.id, type) ?? false;
  }

  // Override takeDamage to account for shields
  takeDamageWithShield(amount: number): number {
    if (this.statusEffectSystem) {
      amount = this.statusEffectSystem.absorbDamage(this.id, amount);
    }

    if (amount > 0) {
      this.takeDamage(amount);
    }

    return amount;
  }

  // Render shield bar if has shield
  protected renderShieldBar(ctx: CanvasRenderingContext2D): void {
    const shieldAmount = this.getShieldAmount();
    if (shieldAmount <= 0) return;

    const barWidth = this.width;
    const barHeight = 4;
    const barX = this.x;
    const barY = this.y - 18; // Above health bar

    // Shield bar (blue/cyan)
    const shieldPercent = Math.min(1, shieldAmount / this.maxHp);
    ctx.fillStyle = 'rgba(0, 200, 255, 0.8)';
    ctx.fillRect(barX, barY, barWidth * shieldPercent, barHeight);

    // Border
    ctx.strokeStyle = 'rgba(100, 220, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth * shieldPercent, barHeight);
  }

  // Render status effect indicators
  protected renderStatusIndicators(ctx: CanvasRenderingContext2D): void {
    if (!this.statusEffectSystem) return;

    const effects = this.statusEffectSystem.getEffects(this.id);
    if (effects.length === 0) return;

    // Render icons above entity
    let offsetX = 0;
    const iconSize = 12;
    const startX = this.centerX - (effects.length * iconSize) / 2;
    const y = this.y - 26;

    for (const effect of effects) {
      let color = '';
      let symbol = '';

      switch (effect.type) {
        case 'stun':
          color = '#ffff00';
          symbol = '★';
          break;
        case 'slow':
          color = '#00aaff';
          symbol = '❄';
          break;
        case 'root':
          color = '#8b4513';
          symbol = '⚓';
          break;
        case 'frozen':
          color = '#88ddff';
          symbol = '❆';
          break;
        case 'burn':
          color = '#ff6600';
          symbol = '🔥';
          break;
        case 'shield':
          // Shield is shown via shield bar, skip icon
          continue;
      }

      ctx.fillStyle = color;
      ctx.font = `${iconSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(symbol, startX + offsetX + iconSize / 2, y);
      offsetX += iconSize + 2;
    }
  }
}
