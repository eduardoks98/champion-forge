import { Entity, Vector2 } from './Entity';
import { COLORS } from '../constants/colors';
import { SIZES, SPEEDS, TIMING, DAMAGE, RANGES, STATUS_VALUES } from '../constants/timing';
import { getWeapon, calculateWeaponDamage, calculateAttackSpeed, DEFAULT_WEAPON, WeaponDefinition } from '../data/weapons';

export interface DashGhost {
  x: number;
  y: number;
  opacity: number;
  scale: number;
}

export class Player extends Entity {
  // Movimento
  targetX: number;
  targetY: number;
  isMoving: boolean = false;
  speed: number = SPEEDS.player;
  facingAngle: number = 0;

  // Ataque
  isAttacking: boolean = false;
  attackTimer: number = 0;
  weaponAngle: number = 0;

  // Arma equipada
  equippedWeaponId: string = DEFAULT_WEAPON;
  private cachedWeapon: WeaponDefinition | undefined;

  // Dash
  isDashing: boolean = false;
  dashTimer: number = 0;
  dashGhosts: DashGhost[] = [];

  // Cleave animation
  isCleaving: boolean = false;
  cleaveTimer: number = 0;
  cleaveAngle: number = 0;

  // Casting animation (for abilities like Meteor)
  isCasting: boolean = false;
  castTimer: number = 0;

  // Cooldowns
  cooldowns: {
    attack: number;
    fireball: number;
    iceSpear: number;
    lightning: number;
    dash: number;
    // New abilities
    cleave: number;
    frostNova: number;
    heal: number;
    stun: number;
    shield: number;
    meteor: number;
  } = {
    attack: 0,
    fireball: 0,
    iceSpear: 0,
    lightning: 0,
    dash: 0,
    // New abilities
    cleave: 0,
    frostNova: 0,
    heal: 0,
    stun: 0,
    shield: 0,
    meteor: 0,
  };

  constructor(x: number, y: number) {
    super({
      id: 'player',
      x,
      y,
      width: SIZES.player,
      height: SIZES.player,
      color: COLORS.player,
      hp: 100,
      maxHp: 100,
    });
    this.targetX = x;
    this.targetY = y;
    this.cachedWeapon = getWeapon(this.equippedWeaponId);
  }

  // Equipar uma arma
  equipWeapon(weaponId: string): void {
    const weapon = getWeapon(weaponId);
    if (weapon) {
      this.equippedWeaponId = weaponId;
      this.cachedWeapon = weapon;
    }
  }

  // Obter arma equipada
  getEquippedWeapon(): WeaponDefinition | undefined {
    return this.cachedWeapon;
  }

  update(deltaTime: number): void {
    this.updateAnimationTimers(deltaTime);
    this.updateCooldowns(deltaTime);
    this.updateMovement(deltaTime);
    this.updateAttack(deltaTime);
    this.updateDash(deltaTime);
    this.updateCleave(deltaTime);
    this.updateCast(deltaTime);
  }

  private updateCooldowns(deltaTime: number): void {
    for (const key of Object.keys(this.cooldowns) as (keyof typeof this.cooldowns)[]) {
      if (this.cooldowns[key] > 0) {
        this.cooldowns[key] = Math.max(0, this.cooldowns[key] - deltaTime);
      }
    }
  }

  private updateMovement(_deltaTime: number): void {
    // Can't move while dashing, casting, or stunned
    if (this.isDashing || this.isCasting) return;
    if (!this.canMove()) return;

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
      this.isMoving = true;
      const speedMultiplier = this.getSpeedMultiplier();
      const actualSpeed = this.speed * speedMultiplier;
      const moveX = (dx / dist) * actualSpeed;
      const moveY = (dy / dist) * actualSpeed;
      this.x += moveX;
      this.y += moveY;
      this.facingAngle = Math.atan2(dy, dx);
    } else {
      this.isMoving = false;
    }
  }

  private updateCleave(deltaTime: number): void {
    if (this.isCleaving) {
      this.cleaveTimer -= deltaTime;

      // Cleave animation: sweep 180 degrees
      const progress = 1 - (this.cleaveTimer / TIMING.attackSwing);
      this.cleaveAngle = progress * Math.PI; // 0 to 180 degrees

      if (this.cleaveTimer <= 0) {
        this.isCleaving = false;
        this.cleaveAngle = 0;
      }
    }
  }

  private updateCast(deltaTime: number): void {
    if (this.isCasting) {
      this.castTimer -= deltaTime;
      if (this.castTimer <= 0) {
        this.isCasting = false;
        this.castTimer = 0;
      }
    }
  }

  private updateAttack(deltaTime: number): void {
    if (this.isAttacking) {
      this.attackTimer -= deltaTime;

      // Animação de swing: 0 -> 90 -> 0 graus
      const progress = 1 - (this.attackTimer / TIMING.attackSwing);
      if (progress < 0.5) {
        this.weaponAngle = progress * 2 * (Math.PI / 2); // 0 -> 90°
      } else {
        this.weaponAngle = (1 - progress) * 2 * (Math.PI / 2); // 90° -> 0
      }

      if (this.attackTimer <= 0) {
        this.isAttacking = false;
        this.weaponAngle = 0;
      }
    }
  }

  private updateDash(deltaTime: number): void {
    if (this.isDashing) {
      this.dashTimer -= deltaTime;

      // Atualizar ghosts
      this.dashGhosts = this.dashGhosts.filter(ghost => {
        ghost.opacity -= 0.05;
        ghost.scale -= 0.02;
        return ghost.opacity > 0;
      });

      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.dashGhosts = [];
      }
    }
  }

  // Mover para posição
  moveTo(x: number, y: number): void {
    this.targetX = Math.max(0, Math.min(SIZES.arena.width - this.width, x - this.width / 2));
    this.targetY = Math.max(0, Math.min(SIZES.arena.height - this.height, y - this.height / 2));
  }

  // Parar movimento
  stopMoving(): void {
    this.targetX = this.x;
    this.targetY = this.y;
    this.isMoving = false;
  }

  // Verificar se pode atacar (cooldown zerado e não está atacando)
  canAttack(): boolean {
    return this.cooldowns.attack <= 0 && !this.isAttacking;
  }

  // Obter range de ataque (usado para auto-attack) - usa arma equipada
  getAttackRange(): number {
    return this.getMeleeRange();
  }

  // Ataque melee
  attack(): boolean {
    if (this.cooldowns.attack > 0 || this.isAttacking) return false;

    this.isAttacking = true;
    this.attackTimer = TIMING.attackSwing;
    this.cooldowns.attack = this.getAttackCooldown();
    return true;
  }

  // Dash
  dash(direction?: Vector2): boolean {
    if (this.cooldowns.dash > 0 || this.isDashing) return false;

    const dir = direction || { x: Math.cos(this.facingAngle), y: Math.sin(this.facingAngle) };
    const dashDistance = 150;

    // Criar ghosts
    const ghostCount = 5;
    const startX = this.x;
    const startY = this.y;
    const endX = Math.max(0, Math.min(SIZES.arena.width - this.width, this.x + dir.x * dashDistance));
    const endY = Math.max(0, Math.min(SIZES.arena.height - this.height, this.y + dir.y * dashDistance));

    for (let i = 0; i < ghostCount; i++) {
      this.dashGhosts.push({
        x: startX + (endX - startX) * (i / ghostCount),
        y: startY + (endY - startY) * (i / ghostCount),
        opacity: 0.5,
        scale: 1,
      });
    }

    // Mover instantaneamente
    this.x = endX;
    this.y = endY;
    this.targetX = endX;
    this.targetY = endY;

    this.isDashing = true;
    this.dashTimer = TIMING.dashTrail;
    this.cooldowns.dash = TIMING.cooldowns.dash;
    return true;
  }

  // Verificar se pode usar habilidade
  canCast(ability: keyof typeof this.cooldowns): boolean {
    if (!this.canAct()) return false;
    return this.cooldowns[ability] <= 0;
  }

  // Usar habilidade (retorna cooldown usado)
  useAbility(ability: keyof typeof TIMING.cooldowns): boolean {
    if (!this.canCast(ability)) return false;
    this.cooldowns[ability] = TIMING.cooldowns[ability];
    return true;
  }

  // ==================== NEW ABILITIES ====================

  // Cleave - Melee AoE 180 degrees in front
  cleave(): boolean {
    if (!this.canCast('cleave') || this.isCleaving) return false;

    this.isCleaving = true;
    this.cleaveTimer = TIMING.attackSwing;
    this.cooldowns.cleave = TIMING.cooldowns.cleave;
    return true;
  }

  // Get cleave damage
  getCleaveDamage(): number {
    return DAMAGE.cleave;
  }

  // Get cleave range
  getCleaveRange(): number {
    return RANGES.cleave;
  }

  // Check if enemy is in cleave arc (180 degrees in front)
  isInCleaveArc(enemyX: number, enemyY: number): boolean {
    const dx = enemyX - this.centerX;
    const dy = enemyY - this.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > RANGES.cleave) return false;

    // Check angle - enemy must be within 90 degrees of facing direction
    const angleToEnemy = Math.atan2(dy, dx);
    let angleDiff = Math.abs(angleToEnemy - this.facingAngle);

    // Normalize angle difference
    if (angleDiff > Math.PI) {
      angleDiff = 2 * Math.PI - angleDiff;
    }

    return angleDiff <= Math.PI / 2; // 90 degrees on each side = 180 total
  }

  // Frost Nova - AoE around self
  frostNova(): boolean {
    if (!this.canCast('frostNova')) return false;

    this.cooldowns.frostNova = TIMING.cooldowns.frostNova;
    return true;
  }

  // Get frost nova range
  getFrostNovaRange(): number {
    return RANGES.frostNova;
  }

  // Heal self
  healSelf(): boolean {
    if (!this.canCast('heal')) return false;

    const healAmount = Math.floor(this.maxHp * STATUS_VALUES.healAmount);
    this.heal(healAmount);
    this.cooldowns.heal = TIMING.cooldowns.heal;
    return true;
  }

  // Get heal amount for display
  getHealAmount(): number {
    return Math.floor(this.maxHp * STATUS_VALUES.healAmount);
  }

  // Stun - single target
  castStun(): boolean {
    if (!this.canCast('stun')) return false;

    this.cooldowns.stun = TIMING.cooldowns.stun;
    return true;
  }

  // Get stun range
  getStunRange(): number {
    return RANGES.stun;
  }

  // Shield - self buff
  castShield(): boolean {
    if (!this.canCast('shield')) return false;

    this.cooldowns.shield = TIMING.cooldowns.shield;
    return true;
  }

  // Get shield amount
  getShieldValue(): number {
    return STATUS_VALUES.shieldAmount;
  }

  // Meteor - Ultimate AoE (requires target position)
  castMeteor(): boolean {
    if (!this.canCast('meteor')) return false;

    this.isCasting = true;
    this.castTimer = 500; // 0.5s cast time
    this.cooldowns.meteor = TIMING.cooldowns.meteor;
    return true;
  }

  // Get meteor range
  getMeteorCastRange(): number {
    return RANGES.meteorCast;
  }

  // Get meteor AoE radius
  getMeteorRadius(): number {
    return RANGES.meteor;
  }

  // Get meteor damage
  getMeteorDamage(): number {
    return DAMAGE.meteor;
  }

  // Obter direção do mouse
  getDirectionTo(mouseX: number, mouseY: number): Vector2 {
    const dx = mouseX - this.centerX;
    const dy = mouseY - this.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return { x: 1, y: 0 };
    return { x: dx / dist, y: dy / dist };
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Renderizar dash ghosts
    this.dashGhosts.forEach(ghost => {
      ctx.globalAlpha = ghost.opacity;
      ctx.fillStyle = COLORS.player;
      ctx.beginPath();
      ctx.arc(
        ghost.x + this.width / 2,
        ghost.y + this.height / 2,
        (this.width / 2) * ghost.scale,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });

    ctx.globalAlpha = 1;

    // Cor com efeito de hit ou CC
    let fillColor = this.color;
    if (this.isHit) {
      const hitProgress = this.hitTimer / 200;
      fillColor = hitProgress > 0.5 ? COLORS.playerDamaged : this.color;
    }

    // Visual effect when stunned/slowed
    if (this.isStunned()) {
      fillColor = '#8888ff';
    } else if (this.hasStatusEffect('slow')) {
      fillColor = '#aaccff';
    }

    // Casting glow effect
    if (this.isCasting) {
      ctx.shadowColor = '#ff8800';
      ctx.shadowBlur = 30;
    } else {
      ctx.shadowColor = COLORS.playerGlow;
      ctx.shadowBlur = 20;
    }

    // Corpo do jogador (círculo)
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Cleave arc indicator when cleaving
    if (this.isCleaving) {
      ctx.save();
      ctx.translate(this.centerX, this.centerY);
      ctx.rotate(this.facingAngle - Math.PI / 2);

      ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, RANGES.cleave, -this.cleaveAngle / 2, this.cleaveAngle / 2);
      ctx.closePath();
      ctx.fill();

      // Cleave sweep line
      ctx.strokeStyle = 'rgba(255, 150, 0, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const sweepAngle = -Math.PI / 2 + this.cleaveAngle - Math.PI / 2;
      ctx.moveTo(0, 0);
      ctx.lineTo(
        Math.cos(sweepAngle) * RANGES.cleave,
        Math.sin(sweepAngle) * RANGES.cleave
      );
      ctx.stroke();

      ctx.restore();
    }

    // Arma (não renderiza durante cleave)
    if (!this.isCleaving) {
      ctx.save();
      ctx.translate(this.centerX, this.centerY);
      ctx.rotate(this.facingAngle + this.weaponAngle);

      ctx.fillStyle = COLORS.weapon;
      ctx.shadowColor = COLORS.weaponGlow;
      ctx.shadowBlur = 10;
      ctx.fillRect(
        this.width / 2 - 10,
        -SIZES.weapon.height / 2,
        SIZES.weapon.width,
        SIZES.weapon.height
      );
      ctx.shadowBlur = 0;
      ctx.restore();
    } else {
      // Render weapon during cleave (spinning)
      ctx.save();
      ctx.translate(this.centerX, this.centerY);
      ctx.rotate(this.facingAngle - Math.PI / 2 + this.cleaveAngle);

      ctx.fillStyle = COLORS.weapon;
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 15;
      ctx.fillRect(
        this.width / 2 - 10,
        -SIZES.weapon.height / 2,
        SIZES.weapon.width + 10, // Longer weapon during cleave
        SIZES.weapon.height
      );
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Barra de vida e shield
    this.renderHealthBar(ctx);
    this.renderShieldBar(ctx);
    this.renderStatusIndicators(ctx);

    // Casting bar
    if (this.isCasting) {
      this.renderCastBar(ctx);
    }

    ctx.restore();
  }

  private renderCastBar(ctx: CanvasRenderingContext2D): void {
    const barWidth = this.width;
    const barHeight = 4;
    const barX = this.x;
    const barY = this.y + this.height + 5;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Progress
    const progress = 1 - (this.castTimer / 500);
    ctx.fillStyle = '#ff8800';
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);

    // Border
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
  }

  // Obter dano de ataque melee (usa arma equipada)
  getMeleeDamage(): number {
    if (this.cachedWeapon) {
      // Por agora, usamos STR base de 10 (futuro: sistema de stats)
      const baseStrength = 10;
      return calculateWeaponDamage(this.equippedWeaponId, baseStrength);
    }
    return DAMAGE.melee;
  }

  // Obter range de ataque melee (usa arma equipada)
  getMeleeRange(): number {
    if (this.cachedWeapon) {
      return this.cachedWeapon.range;
    }
    return RANGES.melee;
  }

  // Obter velocidade de ataque em ms (usa arma equipada)
  getAttackCooldown(): number {
    if (this.cachedWeapon) {
      return calculateAttackSpeed(this.equippedWeaponId);
    }
    return TIMING.cooldowns.attack;
  }

  // Obter efeito especial da arma (se houver)
  getWeaponSpecial(): string | undefined {
    return this.cachedWeapon?.special;
  }
}
