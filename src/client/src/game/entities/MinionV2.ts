// ==========================================
// MINION V2 - Usando novos componentes unificados
// ==========================================

import { GameEntity, generateEntityId } from './GameEntity';
import { Team, Position } from '../data/gameTypes';
import { StatsComponent } from '../components/StatsComponent';
import { MovementComponent, PathfindingGrid } from '../components/MovementComponent';
import { TargetableEntity, createMinionTargeting } from '../components/TargetingComponent';
import { CombatComponent, CombatTarget } from '../components/CombatComponent';
import { MINION_STATS, MinionType, getMinionStatsAtTime } from '../data/minionStats';
import { ChampionBaseStats } from '../data/championStats';
import { SIZES } from '../constants/timing';

// ==========================================
// MINION V2
// ==========================================

export class MinionV2 extends GameEntity {
  // Tipo do minion
  readonly minionType: MinionType;

  // Override para interface TargetableEntity
  get minionTypeForTargeting(): MinionType {
    return this.minionType;
  }

  // Gold/XP reward (para sistema de last hit)
  goldReward: number;
  xpReward: number;

  // Last hit tracking
  lastDamageSource: 'player' | 'minion' | 'tower' | 'unknown' = 'unknown';


  constructor(
    x: number,
    y: number,
    team: Team,
    minionType: MinionType = 'melee',
    gameTimeMs: number = 0
  ) {
    const id = generateEntityId(`minion_${team}_${minionType}`);
    const minionStats = getMinionStatsAtTime(minionType, gameTimeMs);

    super(id, 'minion', team, x, y, SIZES.minion, SIZES.minion);

    this.minionType = minionType;
    this.goldReward = minionStats.goldReward;
    this.xpReward = minionStats.xpReward;

    // Criar componentes
    this.initializeComponents(minionStats);
  }

  private initializeComponents(minionStats: typeof MINION_STATS.melee): void {
    // Stats Component
    const baseStats: ChampionBaseStats = {
      hp: minionStats.hp,
      hpRegen: 0,
      mana: 0,
      manaRegen: 0,
      attackDamage: minionStats.attackDamage,
      attackSpeed: minionStats.attackSpeed,
      armor: minionStats.armor,
      magicResist: minionStats.magicResist,
      moveSpeed: minionStats.moveSpeed,
      attackRange: minionStats.attackRange,
      // Minions não têm growth
      hpPerLevel: 0,
      hpRegenPerLevel: 0,
      manaPerLevel: 0,
      manaRegenPerLevel: 0,
      adPerLevel: 0,
      attackSpeedPerLevel: 0,
      armorPerLevel: 0,
      mrPerLevel: 0,
    };

    this.stats = new StatsComponent({
      baseStats,
      level: 1,
      isChampion: false,
    });

    // Movement Component
    this.movement = new MovementComponent(this.x, this.y, minionStats.moveSpeed);

    // Targeting Component
    this.targeting = createMinionTargeting(this.id, this.team, minionStats.attackRange);

    // Combat Component
    this.combat = new CombatComponent(this.id, this.team, this.stats);
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

  /**
   * Atualiza AI do minion
   * @returns Objeto com informações sobre o que aconteceu
   */
  updateAI(
    enemies: TargetableEntity[],
    nexusPosition: Position | null,
    _deltaTime: number
  ): { shouldAttack: boolean; target: TargetableEntity | null } {
    if (this.isDead || !this.stats || !this.targeting || !this.movement || !this.combat) {
      return { shouldAttack: false, target: null };
    }

    // Encontrar alvo
    const target = this.targeting.findTarget(this.centerPosition, enemies);

    if (target) {
      const dist = this.distanceTo({ x: target.x, y: target.y } as any);

      if (dist <= this.stats.attackRange) {
        // Dentro do range - tentar atacar
        if (this.combat.canAutoAttack()) {
          // Criar CombatTarget a partir do TargetableEntity
          const combatTarget = this.createCombatTarget(target);
          if (combatTarget) {
            this.combat.startAutoAttack(combatTarget);
            return { shouldAttack: true, target };
          }
        }
        // Parar movimento quando em range
        this.movement.stop();
      } else {
        // Fora do range - mover em direção ao alvo
        this.movement.moveTo(target.x, target.y, this.stats.attackRange * 0.8);
      }
    } else if (nexusPosition) {
      // Sem alvo - ir para o Nexus inimigo
      const dist = this.distanceTo(nexusPosition as any);

      if (dist <= this.stats.attackRange) {
        this.movement.stop();
        // Atacar nexus seria tratado separadamente
      } else {
        this.movement.moveTo(nexusPosition.x, nexusPosition.y, this.stats.attackRange * 0.8);
      }
    } else {
      // Fallback: ir para a base inimiga
      const targetX = this.team === 'blue' ? SIZES.arena.width - 100 : 100;
      const targetY = SIZES.lane.centerY;
      this.movement.moveTo(targetX, targetY);
    }

    return { shouldAttack: false, target: null };
  }

  private createCombatTarget(entity: TargetableEntity): CombatTarget | null {
    // Para criar um CombatTarget, precisamos de um StatsComponent
    // Por enquanto, criamos um stub para entidades sem stats
    return {
      id: entity.id,
      team: entity.team,
      x: entity.x,
      y: entity.y,
      stats: this.stats!, // Placeholder - o sistema real precisa acessar stats do alvo
    };
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

    // Atualizar combate
    const attackResult = this.combat?.update(deltaTime, this.centerPosition);
    if (attackResult) {
      // Ataque completou - o dano já foi aplicado pelo CombatComponent
    }

    // Atualizar speed baseado nos stats
    if (this.stats && this.movement) {
      this.movement.setSpeed(this.stats.moveSpeed);
    }
  }

  // ==========================================
  // DAMAGE TRACKING
  // ==========================================

  takeDamageFrom(amount: number, source: 'player' | 'minion' | 'tower'): void {
    this.lastDamageSource = source;
    this.takeDamage(amount);
  }

  wasLastHitByPlayer(): boolean {
    return this.isDead && this.lastDamageSource === 'player';
  }

  // ==========================================
  // RENDER
  // ==========================================

  render(ctx: CanvasRenderingContext2D): void {
    if (this.isDead) return;

    ctx.save();

    // Cor base por time
    const baseColor = this.team === 'blue' ? '#3498db' : '#e74c3c';
    const borderColor = this.team === 'blue' ? '#2980b9' : '#c0392b';

    // Variações por tipo de minion
    let size = this.width / 2;
    if (this.minionType === 'siege') {
      size *= 1.3;
    } else if (this.minionType === 'super') {
      size *= 1.5;
    } else if (this.minionType === 'caster') {
      size *= 0.9;
    }

    // Corpo do minion (círculo)
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, size, 0, Math.PI * 2);
    ctx.fill();

    // Borda
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Indicador de tipo
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '9px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let typeIndicator = 'M';
    switch (this.minionType) {
      case 'melee': typeIndicator = 'M'; break;
      case 'caster': typeIndicator = 'C'; break;
      case 'siege': typeIndicator = 'S'; break;
      case 'super': typeIndicator = '★'; break;
    }
    ctx.fillText(typeIndicator, this.centerX, this.centerY);

    // Barra de vida
    this.renderHealthBar(ctx);

    ctx.restore();
  }

  private renderHealthBar(ctx: CanvasRenderingContext2D): void {
    if (!this.stats) return;

    const barWidth = this.width * 1.2;
    const barHeight = 3;
    const barX = this.centerX - barWidth / 2;
    const barY = this.y - 6;

    // Fundo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Vida
    const healthPercent = this.stats.hpPercent;
    let fillColor = '#2ecc71';
    if (healthPercent < 0.3) fillColor = '#e74c3c';
    else if (healthPercent < 0.6) fillColor = '#f1c40f';

    ctx.fillStyle = fillColor;
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    // Borda
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
  }

  // ==========================================
  // DEBUG
  // ==========================================

  renderDebug(ctx: CanvasRenderingContext2D): void {
    if (this.isDead) return;

    // Desenhar range de ataque
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.stats?.attackRange || 60, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Desenhar alvo atual
    if (this.targeting?.getCurrentTarget()) {
      const target = this.targeting.getCurrentTarget()!;
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this.centerX, this.centerY);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
    }
  }

  // ==========================================
  // HELPERS
  // ==========================================

  shouldRemove(): boolean {
    return this.isDead;
  }

  toTargetable(): TargetableEntity {
    return {
      ...super.toTargetable(),
      minionType: this.minionType,
    };
  }
}
