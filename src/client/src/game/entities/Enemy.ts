import { Entity } from './Entity';
import { COLORS } from '../constants/colors';
import { SIZES, RANGES, TIMING, DAMAGE } from '../constants/timing';

// AI States
export type AIState = 'idle' | 'chase' | 'attack' | 'stunned' | 'returning';

export class Enemy extends Entity {
  // Targeting state
  isHighlighted: boolean = false;
  isTargeted: boolean = false;

  // AI properties
  aiState: AIState = 'idle';
  speed: number = 2;
  detectionRange: number = RANGES.enemyDetection;
  attackRange: number = RANGES.enemyAttack;
  attackCooldown: number = 0;
  attackDamage: number = DAMAGE.enemyMelee;

  // Home position (for returning when player escapes)
  homeX: number;
  homeY: number;

  // Attack animation
  isAttacking: boolean = false;
  attackTimer: number = 0;

  constructor(x: number, y: number, id: string) {
    super({
      id,
      x,
      y,
      width: SIZES.enemy,
      height: SIZES.enemy,
      color: COLORS.enemy,
      hp: 100,
      maxHp: 100,
    });
    this.homeX = x;
    this.homeY = y;
  }

  update(deltaTime: number): void {
    this.updateAnimationTimers(deltaTime);
    this.updateCooldowns(deltaTime);
    this.updateAttackAnimation(deltaTime);
  }

  private updateCooldowns(deltaTime: number): void {
    if (this.attackCooldown > 0) {
      this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
    }
  }

  private updateAttackAnimation(deltaTime: number): void {
    if (this.isAttacking) {
      this.attackTimer -= deltaTime;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
        this.attackTimer = 0;
      }
    }
  }

  // AI Update - called from GameEngine with player position
  updateAI(playerX: number, playerY: number, deltaTime: number): { shouldAttack: boolean } {
    let shouldAttack = false;

    // Can't do anything if stunned
    if (this.isStunned()) {
      this.aiState = 'stunned';
      return { shouldAttack: false };
    }

    const dx = playerX - this.centerX;
    const dy = playerY - this.centerY;
    const distToPlayer = Math.sqrt(dx * dx + dy * dy);

    // Distance to home
    const homeDx = this.homeX - this.x;
    const homeDy = this.homeY - this.y;
    const distToHome = Math.sqrt(homeDx * homeDx + homeDy * homeDy);

    // State machine
    switch (this.aiState) {
      case 'idle':
        // Check if player is in detection range
        if (distToPlayer < this.detectionRange) {
          this.aiState = 'chase';
        }
        break;

      case 'chase':
        // If player escaped, return home
        if (distToPlayer > this.detectionRange * 1.5) {
          this.aiState = 'returning';
          break;
        }

        // If in attack range, attack
        if (distToPlayer < this.attackRange) {
          this.aiState = 'attack';
          break;
        }

        // Move towards player
        if (this.canMove()) {
          this.moveToward(playerX, playerY, deltaTime);
        }
        break;

      case 'attack':
        // If player moved out of range, chase
        if (distToPlayer > this.attackRange * 1.2) {
          this.aiState = 'chase';
          break;
        }

        // Attack if cooldown ready
        if (this.attackCooldown <= 0 && this.canAct()) {
          shouldAttack = true;
          this.performAttack();
        }
        break;

      case 'returning':
        // Return to home position
        if (distToHome < 10) {
          this.aiState = 'idle';
          this.x = this.homeX;
          this.y = this.homeY;
          break;
        }

        // If player comes back in range, chase again
        if (distToPlayer < this.detectionRange * 0.8) {
          this.aiState = 'chase';
          break;
        }

        // Move towards home
        if (this.canMove()) {
          this.moveToward(this.homeX + this.width / 2, this.homeY + this.height / 2, deltaTime);
        }
        break;

      case 'stunned':
        // Check if still stunned
        if (!this.isStunned()) {
          this.aiState = 'chase';
        }
        break;
    }

    return { shouldAttack };
  }

  private moveToward(targetX: number, targetY: number, _deltaTime: number): void {
    const dx = targetX - this.centerX;
    const dy = targetY - this.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
      const speedMultiplier = this.getSpeedMultiplier();
      const actualSpeed = this.speed * speedMultiplier;

      const moveX = (dx / dist) * actualSpeed;
      const moveY = (dy / dist) * actualSpeed;

      // Clamp to arena bounds
      this.x = Math.max(0, Math.min(SIZES.arena.width - this.width, this.x + moveX));
      this.y = Math.max(0, Math.min(SIZES.arena.height - this.height, this.y + moveY));
    }
  }

  private performAttack(): void {
    this.isAttacking = true;
    this.attackTimer = TIMING.attackSwing;
    this.attackCooldown = TIMING.enemyAttackCooldown;
  }

  canAttack(): boolean {
    return this.attackCooldown <= 0 && !this.isAttacking && this.canAct();
  }

  getAttackDamage(): number {
    return this.attackDamage;
  }

  // Set highlight state (when mouse hovers)
  setHighlight(highlighted: boolean): void {
    this.isHighlighted = highlighted;
  }

  // Set target state (when right-clicked)
  setTargeted(targeted: boolean): void {
    this.isTargeted = targeted;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.isDead && this.deathScale <= 0) return;

    ctx.save();

    // Escala de morte
    if (this.isDead) {
      ctx.translate(this.centerX, this.centerY);
      ctx.scale(this.deathScale, this.deathScale);
      ctx.translate(-this.centerX, -this.centerY);
    }

    // Cor com efeito de hit ou CC
    let fillColor = this.color;
    if (this.isHit) {
      ctx.filter = 'brightness(2)';
    }

    // Frozen/Stunned visual effect
    if (this.isStunned()) {
      fillColor = '#88ccff'; // Icy blue when stunned
    } else if (this.hasStatusEffect('slow')) {
      fillColor = '#aaddff'; // Light blue when slowed
    }

    // Target indicator (circle under enemy when targeted)
    if (this.isTargeted && !this.isDead) {
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, this.width / 2 + 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Highlight indicator (glow when mouse hovers)
    if (this.isHighlighted && !this.isDead) {
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 25;
    } else if (this.isStunned()) {
      ctx.shadowColor = '#00aaff';
      ctx.shadowBlur = 20;
    } else {
      ctx.shadowColor = COLORS.enemyGlow;
      ctx.shadowBlur = 15;
    }

    // Attack animation (pulse when attacking)
    let scale = 1;
    if (this.isAttacking) {
      const progress = 1 - (this.attackTimer / TIMING.attackSwing);
      scale = 1 + Math.sin(progress * Math.PI) * 0.15;
    }

    // Corpo do inimigo (quadrado arredondado)
    ctx.fillStyle = fillColor;

    const radius = 10;
    const scaledWidth = this.width * scale;
    const scaledHeight = this.height * scale;
    const offsetX = (scaledWidth - this.width) / 2;
    const offsetY = (scaledHeight - this.height) / 2;

    ctx.beginPath();
    ctx.roundRect(this.x - offsetX, this.y - offsetY, scaledWidth, scaledHeight, radius);
    ctx.fill();

    // Highlight border
    if (this.isHighlighted && !this.isDead) {
      ctx.strokeStyle = '#ffaa00';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.filter = 'none';

    // Barra de vida
    if (!this.isDead) {
      this.renderHealthBar(ctx);
      this.renderShieldBar(ctx);
      this.renderStatusIndicators(ctx);
    }

    // AI state indicator (small icon)
    if (!this.isDead) {
      this.renderAIStateIndicator(ctx);
    }

    ctx.restore();
  }

  private renderAIStateIndicator(ctx: CanvasRenderingContext2D): void {
    let indicator = '';
    let color = '';

    switch (this.aiState) {
      case 'idle':
        indicator = '💤';
        color = '#888888';
        break;
      case 'chase':
        indicator = '👁';
        color = '#ff8800';
        break;
      case 'attack':
        indicator = '⚔';
        color = '#ff0000';
        break;
      case 'stunned':
        indicator = '💫';
        color = '#ffff00';
        break;
      case 'returning':
        indicator = '🏠';
        color = '#00ff00';
        break;
    }

    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.fillText(indicator, this.centerX, this.y + this.height + 15);
  }

  // Verificar se deve ser removido
  shouldRemove(): boolean {
    return this.isDead && this.deathScale <= 0;
  }
}
