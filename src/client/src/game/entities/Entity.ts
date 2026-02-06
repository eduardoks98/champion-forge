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
  hitRadius?: number; // Raio para colisão de hits (circular)
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

  // Raio para colisão de hits (circular) - usado para combate
  hitRadius: number;

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
    // hitRadius padrão = metade do menor lado (aproximação circular)
    this.hitRadius = options.hitRadius ?? Math.min(options.width, options.height) / 2;
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

  // Renderizar barra de vida - Estilo LoL (fina, sutil)
  protected renderHealthBar(ctx: CanvasRenderingContext2D): void {
    const barWidth = this.width * 1.2; // Um pouco maior que a entidade
    const barHeight = 4; // Mais fina
    const barX = this.centerX - barWidth / 2;
    const barY = this.y - 8;

    // Fundo escuro semi-transparente
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Cor da vida baseada na porcentagem
    const healthPercent = this.hp / this.maxHp;
    let fillColor: string;

    if (healthPercent > 0.6) {
      // Verde - vida alta
      fillColor = '#2ecc71';
    } else if (healthPercent > 0.3) {
      // Amarelo - vida média
      fillColor = '#f1c40f';
    } else {
      // Vermelho - vida baixa
      fillColor = '#e74c3c';
    }

    // Vida atual
    ctx.fillStyle = fillColor;
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    // Borda fina e sutil
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Pequenas divisões (estilo LoL - cada divisão = 10% da vida)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 10; i++) {
      const divX = barX + (barWidth * i) / 10;
      ctx.beginPath();
      ctx.moveTo(divX, barY);
      ctx.lineTo(divX, barY + barHeight);
      ctx.stroke();
    }
  }

  // Checar colisão circular (usa hitRadius)
  collidesWith(other: Entity): boolean {
    const dist = this.distanceTo(other);
    return dist < (this.hitRadius + other.hitRadius);
  }

  // Colisão circular para hits/combate
  circleCollidesWith(other: Entity): boolean {
    const dx = this.centerX - other.centerX;
    const dy = this.centerY - other.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < (this.hitRadius + other.hitRadius);
  }

  // Verificar se ponto está dentro do raio de hit
  isPointInHitRadius(x: number, y: number): boolean {
    const dx = this.centerX - x;
    const dy = this.centerY - y;
    return Math.sqrt(dx * dx + dy * dy) < this.hitRadius;
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

  // Render shield bar if has shield - Estilo LoL
  protected renderShieldBar(ctx: CanvasRenderingContext2D): void {
    const shieldAmount = this.getShieldAmount();
    if (shieldAmount <= 0) return;

    const barWidth = this.width * 1.2;
    const barHeight = 3; // Mais fina que a barra de vida
    const barX = this.centerX - barWidth / 2;
    const barY = this.y - 13; // Acima da barra de vida

    // Shield bar (branco/ciano - estilo LoL)
    const shieldPercent = Math.min(1, shieldAmount / this.maxHp);

    // Fundo sutil
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(barX, barY, barWidth * shieldPercent, barHeight);

    // Shield fill (branco com brilho ciano)
    ctx.fillStyle = 'rgba(200, 230, 255, 0.9)';
    ctx.fillRect(barX, barY, barWidth * shieldPercent, barHeight);

    // Borda ciano sutil
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth * shieldPercent, barHeight);
  }

  // Render status effect indicators - Estilo LoL
  protected renderStatusIndicators(ctx: CanvasRenderingContext2D): void {
    if (!this.statusEffectSystem) return;

    const effects = this.statusEffectSystem.getEffects(this.id);
    if (effects.length === 0) return;

    // Render icons above entity (ajustado para novas barras)
    let offsetX = 0;
    const iconSize = 10; // Menor para ser mais sutil
    const startX = this.centerX - (effects.length * iconSize) / 2;
    const y = this.y - 18; // Acima das barras

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
