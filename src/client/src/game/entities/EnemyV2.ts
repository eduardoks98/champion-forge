// ==========================================
// ENEMY V2 - Usando novos componentes unificados
// ==========================================

import { GameEntity, generateEntityId } from './GameEntity';
import { StatsComponent } from '../components/StatsComponent';
import { MovementComponent, PathfindingGrid } from '../components/MovementComponent';
import { createChampionTargeting } from '../components/TargetingComponent';
import { CombatComponent } from '../components/CombatComponent';
import { DEFAULT_ENEMY_STATS } from '../data/championStats';
import { COLORS } from '../constants/colors';
import { SIZES, SPEEDS, RANGES, TIMING } from '../constants/timing';
import { DEFAULT_ENTITY } from '../constants/gameDefaults';

// ==========================================
// AI STATES
// ==========================================

export type AIState = 'idle' | 'chase' | 'attack' | 'stunned' | 'returning';

// ==========================================
// ENEMY V2
// ==========================================

export class EnemyV2 extends GameEntity {
  // AI State
  aiState: AIState = 'idle';

  // Home position (para retornar quando player foge)
  homeX: number;
  homeY: number;

  // Targeting state
  isHighlighted: boolean = false;
  isTargeted: boolean = false;

  // Detection/Attack ranges
  detectionRange: number = RANGES.enemyDetection;

  // Attack animation
  isAttacking: boolean = false;
  attackTimer: number = 0;

  // AI Throttling para performance
  private aiFrameCounter: number = 0;
  private static readonly AI_UPDATE_INTERVAL = 3;
  private lastAIResult: { shouldAttack: boolean } = { shouldAttack: false };

  // Separation steering - referência global aos outros inimigos
  private static allEnemies: EnemyV2[] = [];

  constructor(x: number, y: number, id?: string) {
    const entityId = id || generateEntityId('enemy');

    super(entityId, 'champion', 'red', x, y, SIZES.enemy, SIZES.enemy);

    this.homeX = x;
    this.homeY = y;

    // Inicializar componentes
    this.initializeComponents();

    // Registrar na lista global
    EnemyV2.registerEnemy(this);
  }

  private initializeComponents(): void {
    // Stats Component
    this.stats = new StatsComponent({
      baseStats: DEFAULT_ENEMY_STATS,
      level: 1,
      isChampion: true,
    });

    // Movement Component
    this.movement = new MovementComponent(this.x, this.y, SPEEDS.enemy);

    // Targeting Component
    this.targeting = createChampionTargeting(this.id, this.team, RANGES.enemyAttack);

    // Combat Component
    this.combat = new CombatComponent(this.id, this.team, this.stats);
  }

  // ==========================================
  // STATIC ENEMY MANAGEMENT
  // ==========================================

  static registerEnemy(enemy: EnemyV2): void {
    EnemyV2.allEnemies.push(enemy);
  }

  static unregisterEnemy(enemy: EnemyV2): void {
    const index = EnemyV2.allEnemies.indexOf(enemy);
    if (index !== -1) {
      EnemyV2.allEnemies.splice(index, 1);
    }
  }

  static clearAllEnemies(): void {
    EnemyV2.allEnemies = [];
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
  // AI UPDATE
  // ==========================================

  updateAI(playerX: number, playerY: number, deltaTime: number): { shouldAttack: boolean } {
    // Throttle AI updates
    this.aiFrameCounter++;
    const idHash = this.id.charCodeAt(this.id.length - 1) || 0;
    if (this.aiFrameCounter % EnemyV2.AI_UPDATE_INTERVAL !== (idHash % EnemyV2.AI_UPDATE_INTERVAL)) {
      return this.lastAIResult;
    }

    if (!this.stats || !this.movement || !this.combat || !this.targeting) {
      return { shouldAttack: false };
    }

    let shouldAttack = false;

    // Não pode fazer nada se stunned
    if (this.isStunned()) {
      this.aiState = 'stunned';
      this.lastAIResult = { shouldAttack: false };
      return this.lastAIResult;
    }

    const dx = playerX - this.centerX;
    const dy = playerY - this.centerY;
    const distToPlayer = Math.sqrt(dx * dx + dy * dy);

    const homeDx = this.homeX - this.x;
    const homeDy = this.homeY - this.y;
    const distToHome = Math.sqrt(homeDx * homeDx + homeDy * homeDy);

    // State machine
    switch (this.aiState) {
      case 'idle':
        if (distToPlayer < this.detectionRange) {
          this.aiState = 'chase';
        }
        break;

      case 'chase':
        if (distToPlayer > this.detectionRange * 1.5) {
          this.aiState = 'returning';
          break;
        }

        if (distToPlayer < this.stats.attackRange) {
          this.aiState = 'attack';
          break;
        }

        // Mover em direção ao player
        this.moveTowardWithSeparation(playerX, playerY, deltaTime);
        break;

      case 'attack':
        if (distToPlayer > this.stats.attackRange * 1.2) {
          this.aiState = 'chase';
          break;
        }

        // Atacar se cooldown pronto
        if (this.combat.canAutoAttack()) {
          shouldAttack = true;
          this.performAttack();
        }
        break;

      case 'returning':
        if (distToHome < 10) {
          this.aiState = 'idle';
          this.x = this.homeX;
          this.y = this.homeY;
          break;
        }

        if (distToPlayer < this.detectionRange * 0.8) {
          this.aiState = 'chase';
          break;
        }

        this.moveTowardWithSeparation(this.homeX + this.width / 2, this.homeY + this.height / 2, deltaTime);
        break;

      case 'stunned':
        if (!this.isStunned()) {
          this.aiState = 'chase';
        }
        break;
    }

    this.lastAIResult = { shouldAttack };
    return this.lastAIResult;
  }

  private moveTowardWithSeparation(targetX: number, targetY: number, _deltaTime: number): void {
    if (!this.movement || !this.stats) return;

    const dx = targetX - this.centerX;
    const dy = targetY - this.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Distância mínima do alvo
    const minDist = 50;

    if (dist <= minDist) {
      // Só aplicar separação
      const separation = this.calculateSeparation();
      if (separation.x !== 0 || separation.y !== 0) {
        this.x = Math.max(0, Math.min(SIZES.arena.width - this.width, this.x + separation.x));
        this.y = Math.max(0, Math.min(SIZES.arena.height - this.height, this.y + separation.y));
      }
      return;
    }

    // Mover em direção ao alvo usando MovementComponent
    this.movement.moveTo(targetX, targetY, minDist);
  }

  private calculateSeparation(): { x: number; y: number } {
    let separationX = 0;
    let separationY = 0;

    const separationRadius = 45;
    const minDistance = 38;

    for (const other of EnemyV2.allEnemies) {
      if (other.id === this.id || other.isDead) continue;

      const dx = this.centerX - other.centerX;
      const dy = this.centerY - other.centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < separationRadius && dist > 0) {
        const strength = Math.min(1.5, (separationRadius - dist) / (separationRadius - minDistance + 1));
        separationX += (dx / dist) * strength;
        separationY += (dy / dist) * strength;
      }
    }

    const magnitude = Math.sqrt(separationX * separationX + separationY * separationY);
    if (magnitude > 0) {
      const force = 1.5;
      return {
        x: (separationX / magnitude) * force,
        y: (separationY / magnitude) * force
      };
    }

    return { x: 0, y: 0 };
  }

  private performAttack(): void {
    this.isAttacking = true;
    this.attackTimer = TIMING.attackSwing;
  }

  // ==========================================
  // UPDATE
  // ==========================================

  update(deltaTime: number): void {
    if (this.isDead) return;

    // Atualizar movimento
    this.movement?.update(deltaTime);

    // Sincronizar posição
    if (this.movement) {
      this._x = this.movement.x;
      this._y = this.movement.y;
    }

    // Atualizar animação de ataque
    if (this.isAttacking) {
      this.attackTimer -= deltaTime;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
        this.attackTimer = 0;
      }
    }

    // Atualizar combate
    this.combat?.update(deltaTime, this.centerPosition);

    // Atualizar speed
    if (this.stats && this.movement) {
      this.movement.setSpeed(this.stats.moveSpeed);
    }
  }

  // ==========================================
  // TARGETING HELPERS
  // ==========================================

  setHighlight(highlighted: boolean): void {
    this.isHighlighted = highlighted;
  }

  setTargeted(targeted: boolean): void {
    this.isTargeted = targeted;
  }

  canAttack(): boolean {
    return this.combat?.canAutoAttack() ?? false;
  }

  getAttackDamage(): number {
    return this.stats?.attackDamage ?? DEFAULT_ENTITY.ATTACK_DAMAGE;
  }

  // ==========================================
  // STATUS HELPERS (compatibilidade com Entity antiga)
  // ==========================================

  isStunned(): boolean {
    // TODO: Integrar com StatusEffectSystem
    return false;
  }

  // ==========================================
  // RENDER
  // ==========================================

  render(ctx: CanvasRenderingContext2D): void {
    if (this.isDead) return;

    ctx.save();

    let fillColor = COLORS.enemy;

    // Target indicator
    if (this.isTargeted) {
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, this.width / 2 + 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Attack animation (pulse)
    let scale = 1;
    if (this.isAttacking) {
      const progress = 1 - (this.attackTimer / TIMING.attackSwing);
      scale = 1 + Math.sin(progress * Math.PI) * 0.15;
    }

    // Corpo do inimigo
    ctx.fillStyle = fillColor;

    const radius = 10;
    const scaledWidth = this.width * scale;
    const scaledHeight = this.height * scale;
    const offsetX = (scaledWidth - this.width) / 2;
    const offsetY = (scaledHeight - this.height) / 2;

    ctx.beginPath();
    ctx.roundRect(this.x - offsetX, this.y - offsetY, scaledWidth, scaledHeight, radius);
    ctx.fill();

    // Outline
    ctx.strokeStyle = this.isHighlighted ? '#ffaa00' : '#5c1a1a';
    ctx.lineWidth = this.isHighlighted ? 3 : 2;
    ctx.stroke();

    // Barra de vida
    this.renderHealthBar(ctx);

    // AI state indicator
    this.renderAIStateIndicator(ctx);

    ctx.restore();
  }

  private renderHealthBar(ctx: CanvasRenderingContext2D): void {
    if (!this.stats) return;

    const barWidth = this.width * 1.2;
    const barHeight = 4;
    const barX = this.centerX - barWidth / 2;
    const barY = this.y - 8;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const healthPercent = this.stats.hpPercent;
    let fillColor = '#2ecc71';
    if (healthPercent < 0.3) fillColor = '#e74c3c';
    else if (healthPercent < 0.6) fillColor = '#f1c40f';

    ctx.fillStyle = fillColor;
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
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

  // ==========================================
  // CLEANUP
  // ==========================================

  die(): void {
    super.die();
    EnemyV2.unregisterEnemy(this);
  }

  shouldRemove(): boolean {
    return this.isDead;
  }
}
