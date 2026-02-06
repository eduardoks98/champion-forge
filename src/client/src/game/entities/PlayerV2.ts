// ==========================================
// PLAYER V2 - Usando novos componentes unificados
// ==========================================

import { GameEntity } from './GameEntity';
import { Position } from '../data/gameTypes';
import { StatsComponent } from '../components/StatsComponent';
import { MovementComponent, PathfindingGrid } from '../components/MovementComponent';
import { createChampionTargeting } from '../components/TargetingComponent';
import { CombatComponent, CombatTarget } from '../components/CombatComponent';
import { CooldownManager } from '../components/CooldownManager';
import { DEFAULT_PLAYER_STATS } from '../data/championStats';
import { COLORS } from '../constants/colors';
import { SIZES, SPEEDS, TIMING } from '../constants/timing';
import { getWeapon, calculateWeaponDamage, calculateAttackSpeed, DEFAULT_WEAPON, WeaponDefinition } from '../data/weapons';
import { DEFAULT_WEAPON as DEFAULT_WEAPON_STATS } from '../constants/gameDefaults';

// ==========================================
// INTERFACES
// ==========================================

export interface DashGhost {
  x: number;
  y: number;
  opacity: number;
  scale: number;
  angle: number;
}

export type PlayerAbility = 'fireball' | 'iceSpear' | 'lightning' | 'dash' | 'cleave' | 'frostNova' | 'heal' | 'stun' | 'shield' | 'meteor';

// ==========================================
// PLAYER V2
// ==========================================

export class PlayerV2 extends GameEntity {
  // Movimento
  targetX: number;
  targetY: number;
  isMoving: boolean = false;
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

  // Casting animation
  isCasting: boolean = false;
  castTimer: number = 0;

  // Animation state
  private animationTime: number = 0;
  private walkCycle: number = 0;

  // Visual size
  get visualSize(): number {
    return SIZES.playerVisual;
  }

  constructor(x: number, y: number) {
    super('player', 'champion', 'blue', x, y, SIZES.player, SIZES.player);

    this.targetX = x;
    this.targetY = y;
    this.hitRadius = SIZES.playerVisual / 2;

    // Inicializar componentes
    this.initializeComponents();

    // Cache weapon
    this.cachedWeapon = getWeapon(this.equippedWeaponId);
  }

  private initializeComponents(): void {
    // Stats Component
    this.stats = new StatsComponent({
      baseStats: DEFAULT_PLAYER_STATS,
      level: 1,
      isChampion: true,
    });

    // Movement Component
    this.movement = new MovementComponent(this.x, this.y, SPEEDS.player);

    // Targeting Component
    this.targeting = createChampionTargeting(this.id, this.team, this.stats.attackRange);

    // Combat Component
    this.combat = new CombatComponent(this.id, this.team, this.stats);

    // Cooldown Manager para habilidades
    this.cooldowns = new CooldownManager();
    this.initializeCooldowns();
  }

  private initializeCooldowns(): void {
    if (!this.cooldowns) return;

    // Registrar todas as habilidades usando os valores definidos em TIMING.cooldowns
    this.cooldowns.registerAbility('attack', TIMING.cooldowns.attack);
    this.cooldowns.registerAbility('fireball', TIMING.cooldowns.fireball);
    this.cooldowns.registerAbility('iceSpear', TIMING.cooldowns.iceSpear);
    this.cooldowns.registerAbility('lightning', TIMING.cooldowns.lightning);
    this.cooldowns.registerAbility('dash', TIMING.cooldowns.dash);
    this.cooldowns.registerAbility('cleave', TIMING.cooldowns.cleave);
    this.cooldowns.registerAbility('frostNova', TIMING.cooldowns.frostNova);
    this.cooldowns.registerAbility('heal', TIMING.cooldowns.heal);
    this.cooldowns.registerAbility('stun', TIMING.cooldowns.stun);
    this.cooldowns.registerAbility('shield', TIMING.cooldowns.shield);
    this.cooldowns.registerAbility('meteor', TIMING.cooldowns.meteor);
  }

  // ==========================================
  // PATHFINDING SETUP
  // ==========================================

  setPathfindingGrid(grid: PathfindingGrid): void {
    this.movement?.setPathfindingGrid(grid);
  }

  setMapBounds(minX: number, minY: number, maxX: number, maxY: number): void {
    this.movement?.setMapBounds(minX, minY, maxX, maxY);
  }

  // ==========================================
  // WEAPON SYSTEM
  // ==========================================

  equipWeapon(weaponId: string): void {
    const weapon = getWeapon(weaponId);
    if (weapon) {
      this.equippedWeaponId = weaponId;
      this.cachedWeapon = weapon;
    }
  }

  getEquippedWeapon(): WeaponDefinition | undefined {
    return this.cachedWeapon;
  }

  getAttackDamage(): number {
    if (!this.stats) return 10;
    const baseDamage = this.stats.attackDamage;
    return calculateWeaponDamage(this.equippedWeaponId, baseDamage);
  }

  getAttackSpeed(): number {
    if (!this.stats) return 1;
    return this.stats.attackSpeed;
  }

  getAttackCooldown(): number {
    // Usa o intervalo de ataque baseado na arma
    return calculateAttackSpeed(this.equippedWeaponId);
  }

  getMeleeRange(): number {
    const weapon = this.cachedWeapon;
    return weapon?.range ?? DEFAULT_WEAPON_STATS.RANGE;
  }

  getAttackRange(): number {
    return this.getMeleeRange();
  }

  // ==========================================
  // MOVEMENT
  // ==========================================

  moveToPosition(x: number, y: number): void {
    if (!this.movement) return;
    if (this.isDashing || this.isCasting) return;

    const clampedX = Math.max(0, Math.min(SIZES.arena.width - this.width, x - this.width / 2));
    const clampedY = Math.max(0, Math.min(SIZES.arena.height - this.height, y - this.height / 2));

    this.targetX = clampedX;
    this.targetY = clampedY;

    this.movement.moveTo(clampedX + this.width / 2, clampedY + this.height / 2);
  }

  stopMoving(): void {
    this.movement?.stop();
    this.targetX = this.x;
    this.targetY = this.y;
    this.isMoving = false;
  }

  // ==========================================
  // COMBAT
  // ==========================================

  canAttack(): boolean {
    if (!this.cooldowns) return false;
    return this.cooldowns.isReady('attack') && !this.isAttacking;
  }

  attack(): boolean {
    if (!this.canAttack()) return false;

    this.isAttacking = true;
    this.attackTimer = TIMING.attackSwing;
    this.cooldowns?.startCooldown('attack');
    return true;
  }

  /**
   * Ataca um alvo específico
   */
  attackTarget(target: CombatTarget): boolean {
    if (!this.canAttack() || !this.combat) return false;

    this.attack();
    this.combat.startAutoAttack(target);

    // Atualizar facing
    const dx = target.x - this.centerX;
    const dy = target.y - this.centerY;
    this.facingAngle = Math.atan2(dy, dx);

    return true;
  }

  // ==========================================
  // ABILITIES
  // ==========================================

  canCast(ability: PlayerAbility): boolean {
    if (!this.cooldowns) return false;
    if (this.isDead || this.isCasting) return false;
    return this.cooldowns.isReady(ability);
  }

  useAbility(ability: PlayerAbility): boolean {
    if (!this.canCast(ability)) return false;
    this.cooldowns?.startCooldown(ability);
    return true;
  }

  getCooldownPercent(ability: PlayerAbility): number {
    return this.cooldowns?.getCooldownProgress(ability) ?? 1;
  }

  getCooldownRemaining(ability: PlayerAbility): number {
    return this.cooldowns?.getRemainingCooldown(ability) ?? 0;
  }

  // Dash
  dash(directionX?: number, directionY?: number): boolean {
    if (!this.canCast('dash') || this.isDashing) return false;

    const dirX = directionX ?? Math.cos(this.facingAngle);
    const dirY = directionY ?? Math.sin(this.facingAngle);
    const dashDistance = 150;

    // Criar ghosts
    const ghostCount = 5;
    const startX = this.x;
    const startY = this.y;
    const endX = Math.max(0, Math.min(SIZES.arena.width - this.width, this.x + dirX * dashDistance));
    const endY = Math.max(0, Math.min(SIZES.arena.height - this.height, this.y + dirY * dashDistance));

    for (let i = 0; i < ghostCount; i++) {
      this.dashGhosts.push({
        x: startX + (endX - startX) * (i / ghostCount),
        y: startY + (endY - startY) * (i / ghostCount),
        opacity: 0.5,
        scale: 1,
        angle: this.facingAngle,
      });
    }

    // Teleportar
    this.teleport(endX, endY);
    this.targetX = endX;
    this.targetY = endY;

    this.isDashing = true;
    this.dashTimer = TIMING.dashTrail;
    this.useAbility('dash');
    return true;
  }

  // Cleave
  cleave(): boolean {
    if (!this.canCast('cleave') || this.isCleaving) return false;

    this.isCleaving = true;
    this.cleaveTimer = TIMING.attackSwing;
    this.useAbility('cleave');
    return true;
  }

  getCleaveDamage(): number {
    return this.getAttackDamage() * 1.5;
  }

  // Start casting (for abilities like Meteor)
  startCasting(duration: number): void {
    this.isCasting = true;
    this.castTimer = duration;
  }

  // ==========================================
  // UPDATE
  // ==========================================

  update(deltaTime: number): void {
    if (this.isDead) return;

    // Atualizar cooldowns
    this.cooldowns?.update(deltaTime);

    // Atualizar movimento
    this.movement?.update(deltaTime);

    // Sincronizar posição
    if (this.movement) {
      this._x = this.movement.x;
      this._y = this.movement.y;

      // Atualizar isMoving
      this.isMoving = this.movement.isMoving();

      // Atualizar facing angle baseado na direção do movimento
      if (this.isMoving) {
        const dir = this.movement.getDirection();
        if (dir.x !== 0 || dir.y !== 0) {
          this.facingAngle = Math.atan2(dir.y, dir.x);
        }
      }
    }

    // Atualizar combate
    this.combat?.update(deltaTime, this.centerPosition);

    // Atualizar animações
    this.updateAnimations(deltaTime);
    this.updateAttackAnimation(deltaTime);
    this.updateDashAnimation(deltaTime);
    this.updateCleaveAnimation(deltaTime);
    this.updateCastAnimation(deltaTime);

    // Atualizar stats (regen, etc)
    // StatsComponent não tem update - regen é feito manualmente se necessário
  }

  private updateAnimations(deltaTime: number): void {
    this.animationTime += deltaTime;

    if (this.isMoving) {
      this.walkCycle += deltaTime * 0.02;
    } else {
      this.walkCycle = this.walkCycle % (Math.PI * 2);
      if (this.walkCycle > 0.1) {
        this.walkCycle -= deltaTime * 0.01;
      } else {
        this.walkCycle = 0;
      }
    }
  }

  private updateAttackAnimation(deltaTime: number): void {
    if (this.isAttacking) {
      this.attackTimer -= deltaTime;

      const progress = 1 - (this.attackTimer / TIMING.attackSwing);
      if (progress < 0.5) {
        this.weaponAngle = progress * 2 * (Math.PI / 2);
      } else {
        this.weaponAngle = (1 - progress) * 2 * (Math.PI / 2);
      }

      if (this.attackTimer <= 0) {
        this.isAttacking = false;
        this.weaponAngle = 0;
      }
    }
  }

  private updateDashAnimation(deltaTime: number): void {
    if (this.isDashing) {
      this.dashTimer -= deltaTime;

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

  private updateCleaveAnimation(deltaTime: number): void {
    if (this.isCleaving) {
      this.cleaveTimer -= deltaTime;

      const progress = 1 - (this.cleaveTimer / TIMING.attackSwing);
      this.cleaveAngle = progress * Math.PI;

      if (this.cleaveTimer <= 0) {
        this.isCleaving = false;
        this.cleaveAngle = 0;
      }
    }
  }

  private updateCastAnimation(deltaTime: number): void {
    if (this.isCasting) {
      this.castTimer -= deltaTime;
      if (this.castTimer <= 0) {
        this.isCasting = false;
        this.castTimer = 0;
      }
    }
  }

  // ==========================================
  // RENDER
  // ==========================================

  render(ctx: CanvasRenderingContext2D): void {
    if (this.isDead) return;

    ctx.save();

    // Render dash ghosts
    for (const ghost of this.dashGhosts) {
      ctx.globalAlpha = ghost.opacity;
      ctx.fillStyle = COLORS.player;
      ctx.beginPath();
      ctx.arc(
        ghost.x + this.width / 2,
        ghost.y + this.height / 2,
        (this.visualSize / 2) * ghost.scale,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Player body
    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.visualSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // Outline
    ctx.strokeStyle = '#1a5276';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Direction indicator
    const indicatorLength = this.visualSize / 2 + 10;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.centerX, this.centerY);
    ctx.lineTo(
      this.centerX + Math.cos(this.facingAngle) * indicatorLength,
      this.centerY + Math.sin(this.facingAngle) * indicatorLength
    );
    ctx.stroke();

    // Weapon swing animation
    if (this.isAttacking) {
      ctx.save();
      ctx.translate(this.centerX, this.centerY);
      ctx.rotate(this.facingAngle + this.weaponAngle);

      ctx.fillStyle = '#7f8c8d';
      ctx.fillRect(this.visualSize / 2 - 5, -5, 30, 10);

      ctx.restore();
    }

    // Cleave arc
    if (this.isCleaving) {
      ctx.save();
      ctx.translate(this.centerX, this.centerY);
      ctx.rotate(this.facingAngle - Math.PI / 2);

      ctx.fillStyle = 'rgba(255, 100, 100, 0.3)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 80, -this.cleaveAngle / 2, this.cleaveAngle / 2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    // Casting indicator
    if (this.isCasting) {
      ctx.strokeStyle = '#9b59b6';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, this.visualSize / 2 + 15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Health bar
    this.renderHealthBar(ctx);

    // Mana bar
    this.renderManaBar(ctx);

    ctx.restore();
  }

  private renderHealthBar(ctx: CanvasRenderingContext2D): void {
    if (!this.stats) return;

    const barWidth = this.visualSize * 1.5;
    const barHeight = 6;
    const barX = this.centerX - barWidth / 2;
    const barY = this.y - 15;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Health
    const healthPercent = this.stats.hpPercent;
    let fillColor = '#2ecc71';
    if (healthPercent < 0.3) fillColor = '#e74c3c';
    else if (healthPercent < 0.6) fillColor = '#f1c40f';

    ctx.fillStyle = fillColor;
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    // Border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
  }

  private renderManaBar(ctx: CanvasRenderingContext2D): void {
    if (!this.stats) return;

    const barWidth = this.visualSize * 1.5;
    const barHeight = 4;
    const barX = this.centerX - barWidth / 2;
    const barY = this.y - 8;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Mana
    const manaPercent = this.stats.manaPercent;
    ctx.fillStyle = '#3498db';
    ctx.fillRect(barX, barY, barWidth * manaPercent, barHeight);

    // Border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
  }

  renderDebug(ctx: CanvasRenderingContext2D): void {
    if (this.isDead) return;

    // Attack range
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.getAttackRange(), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Path debug - movement component não expõe path diretamente
  }

  // ==========================================
  // HELPERS
  // ==========================================

  shouldRemove(): boolean {
    return false; // Player nunca é removido
  }

  canAct(): boolean {
    return !this.isDead && !this.isCasting && !this.isDashing;
  }

  canMove(): boolean {
    return this.canAct();
  }

  getPath(): Position[] | null {
    // MovementComponent não expõe path diretamente
    return null;
  }

  isPathBlocked(): boolean {
    // MovementComponent não expõe blocked state diretamente
    return false;
  }
}
