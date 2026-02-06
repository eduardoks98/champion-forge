// ==========================================
// STRUCTURE V2 - Usando novos componentes unificados
// ==========================================

import { GameEntity, generateEntityId } from './GameEntity';
import { Team, Position } from '../data/gameTypes';
import { StatsComponent } from '../components/StatsComponent';
import { TargetableEntity, createTowerTargeting } from '../components/TargetingComponent';
import { CombatComponent, CombatTarget } from '../components/CombatComponent';
import { ChampionBaseStats } from '../data/championStats';
import {
  StructureType,
  SR_STRUCTURE_STATS,
  calculateTowerDamageWithRamp,
  getStructureDimensions,
  getStructureColor,
  TOWER_AGGRO_DETECTION_RANGE,
} from '../data/structureStats';

// ==========================================
// STRUCTURE V2
// ==========================================

export class StructureV2 extends GameEntity {
  // Tipo da estrutura
  readonly structureType: StructureType;

  // Laser visual
  private laserTimer: number = 0;
  private laserTarget: Position | null = null;
  private static readonly LASER_DURATION = 200;

  // Aggro detection range (para detectar dano a aliados)
  readonly aggroDetectionRange: number = TOWER_AGGRO_DETECTION_RANGE;

  // Gold reward quando destruída
  readonly goldReward: number;

  // Consecutive hits tracking para damage ramping
  private consecutiveHits: number = 0;
  private lastTargetId: string | null = null;

  constructor(
    x: number,
    y: number,
    team: Team,
    structureType: StructureType,
    gameMode: 'sr' | 'aram' = 'sr'
  ) {
    const structureStats = SR_STRUCTURE_STATS[structureType];
    const dimensions = getStructureDimensions(structureType);
    const id = generateEntityId(`structure_${team}_${structureType}`);

    super(id, 'structure', team, x, y, dimensions.width, dimensions.height);

    this.structureType = structureType;
    this.goldReward = structureStats.goldReward;

    // Inicializar componentes
    this.initializeComponents(structureStats, gameMode);
  }

  private initializeComponents(
    structureStats: typeof SR_STRUCTURE_STATS.nexus,
    _gameMode: 'sr' | 'aram'
  ): void {
    // Stats Component
    const baseStats: ChampionBaseStats = {
      hp: structureStats.hp,
      hpRegen: 0, // Estruturas não regeneram
      mana: 0,
      manaRegen: 0,
      attackDamage: structureStats.attackDamage,
      attackSpeed: structureStats.attackSpeed,
      armor: structureStats.armor,
      magicResist: structureStats.magicResist,
      moveSpeed: 0,
      attackRange: structureStats.attackRange,
      // Estruturas não têm growth
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

    // Torres têm targeting e combat
    if (structureStats.canAttack) {
      // Targeting Component
      this.targeting = createTowerTargeting(this.id, this.team, structureStats.attackRange);

      // Combat Component
      this.combat = new CombatComponent(this.id, this.team, this.stats);
    }
  }

  // ==========================================
  // TOWER ATTACK
  // ==========================================

  /**
   * Tenta atacar alvos no range
   * @returns O alvo que foi atacado, ou null
   */
  tryAttack(
    targets: TargetableEntity[],
    currentTimeMs: number,
    championAggressorId?: string
  ): { target: TargetableEntity; damage: number } | null {
    if (!this.canAttack()) return null;
    if (!this.stats || !this.targeting || !this.combat) return null;

    // Se um champion atacou aliado, forçar aggro para ele
    if (championAggressorId) {
      const aggressor = targets.find(t => t.id === championAggressorId);
      if (aggressor) {
        this.targeting.forceTarget(aggressor, 3000, currentTimeMs);
      }
    }

    // Encontrar alvo
    const target = this.targeting.findTarget(this.centerPosition, targets, currentTimeMs);

    if (!target) {
      this.consecutiveHits = 0;
      this.lastTargetId = null;
      return null;
    }

    // Verificar se pode atacar (cooldown)
    if (!this.combat.canAutoAttack()) {
      return null;
    }

    // Calcular dano com ramping
    if (this.lastTargetId !== target.id) {
      this.consecutiveHits = 0;
      this.lastTargetId = target.id;
    }

    const baseDamage = this.stats.attackDamage;
    const finalDamage = calculateTowerDamageWithRamp(baseDamage, this.consecutiveHits);

    // Registrar ataque
    this.consecutiveHits++;
    this.targeting.onAttackTarget();

    // Criar CombatTarget
    const combatTarget: CombatTarget = {
      id: target.id,
      team: target.team,
      x: target.x,
      y: target.y,
      stats: this.stats, // Placeholder
    };

    // Iniciar ataque
    this.combat.startAutoAttack(combatTarget);

    // Ativar laser visual
    this.laserTarget = { x: target.x, y: target.y };
    this.laserTimer = StructureV2.LASER_DURATION;

    return { target, damage: finalDamage };
  }

  /**
   * Verifica se esta estrutura pode atacar
   */
  canAttack(): boolean {
    if (this.isDead) return false;
    if (!this.stats) return false;

    return this.stats.attackDamage > 0 && this.stats.attackRange > 0;
  }

  /**
   * Verifica se é uma torre
   */
  isTower(): boolean {
    return this.structureType.includes('tower');
  }

  /**
   * Verifica se é o Nexus
   */
  isNexus(): boolean {
    return this.structureType === 'nexus';
  }

  /**
   * Força troca de aggro para um champion específico
   */
  forceAggroToChampion(championId: string, targets: TargetableEntity[], currentTimeMs: number): void {
    if (!this.targeting) return;

    const champion = targets.find(t => t.id === championId);
    if (champion) {
      this.targeting.forceTarget(champion, 3000, currentTimeMs);
    }
  }

  // ==========================================
  // UPDATE
  // ==========================================

  update(deltaTime: number): void {
    if (this.isDead) return;

    // Atualizar combate
    this.combat?.update(deltaTime, this.centerPosition);

    // Atualizar laser visual
    if (this.laserTimer > 0) {
      this.laserTimer -= deltaTime;
      if (this.laserTimer <= 0) {
        this.laserTarget = null;
      }
    }
  }

  // ==========================================
  // RENDER
  // ==========================================

  render(ctx: CanvasRenderingContext2D): void {
    if (this.isDead) return;

    ctx.save();

    // Cor da estrutura
    const color = getStructureColor(this.structureType, this.team);

    // Corpo da estrutura
    ctx.fillStyle = color;

    if (this.isTower()) {
      // Torres são octógonos
      this.renderOctagon(ctx, this.centerX, this.centerY, this.width / 2);
    } else if (this.isNexus()) {
      // Nexus é um losango
      this.renderDiamond(ctx, this.centerX, this.centerY, this.width / 2);
    } else {
      // Inhibitor é um hexágono
      this.renderHexagon(ctx, this.centerX, this.centerY, this.width / 2);
    }

    // Borda
    ctx.strokeStyle = this.team === 'blue' ? '#1e40af' : '#991b1b';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Símbolo central
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = this.isNexus() ? 'bold 20px Arial' : 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (this.isNexus()) {
      ctx.fillText('N', this.centerX, this.centerY);
    } else if (this.isTower()) {
      ctx.fillText('T', this.centerX, this.centerY);
    } else {
      ctx.fillText('I', this.centerX, this.centerY);
    }

    // Renderizar laser
    if (this.laserTarget && this.laserTimer > 0) {
      this.renderLaser(ctx);
    }

    // Barra de vida
    this.renderHealthBar(ctx);

    ctx.restore();
  }

  private renderOctagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number): void {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI / 8) + (i * Math.PI / 4);
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
  }

  private renderDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number): void {
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius);
    ctx.lineTo(cx + radius, cy);
    ctx.lineTo(cx, cy + radius);
    ctx.lineTo(cx - radius, cy);
    ctx.closePath();
    ctx.fill();
  }

  private renderHexagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number): void {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI / 3) - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
  }

  private renderLaser(ctx: CanvasRenderingContext2D): void {
    if (!this.laserTarget) return;

    const intensity = this.laserTimer / StructureV2.LASER_DURATION;
    const laserColor = this.team === 'blue' ? '100, 150, 255' : '255, 100, 150';

    // Glow externo
    ctx.strokeStyle = `rgba(${laserColor}, ${0.3 * intensity})`;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.centerX, this.centerY);
    ctx.lineTo(this.laserTarget.x, this.laserTarget.y);
    ctx.stroke();

    // Laser médio
    ctx.strokeStyle = `rgba(${laserColor}, ${0.6 * intensity})`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(this.centerX, this.centerY);
    ctx.lineTo(this.laserTarget.x, this.laserTarget.y);
    ctx.stroke();

    // Laser central
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.9 * intensity})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.centerX, this.centerY);
    ctx.lineTo(this.laserTarget.x, this.laserTarget.y);
    ctx.stroke();

    // Impacto
    ctx.fillStyle = `rgba(${laserColor}, ${0.5 * intensity})`;
    ctx.beginPath();
    ctx.arc(this.laserTarget.x, this.laserTarget.y, 15 * intensity, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderHealthBar(ctx: CanvasRenderingContext2D): void {
    if (!this.stats) return;

    const barWidth = this.width * 1.5;
    const barHeight = 8;
    const barX = this.centerX - barWidth / 2;
    const barY = this.y - 15;

    // Fundo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Vida
    const healthPercent = this.stats.hpPercent;
    let fillColor = '#2ecc71';
    if (healthPercent < 0.3) fillColor = '#e74c3c';
    else if (healthPercent < 0.6) fillColor = '#f1c40f';

    ctx.fillStyle = fillColor;
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    // Borda
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Divisões (cada 500 HP)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 1;
    const maxHp = this.stats.maxHp;
    const divisions = Math.floor(maxHp / 500);
    for (let i = 1; i < divisions; i++) {
      const divX = barX + (barWidth * i) / divisions;
      ctx.beginPath();
      ctx.moveTo(divX, barY);
      ctx.lineTo(divX, barY + barHeight);
      ctx.stroke();
    }

    // Texto de HP
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(this.stats.currentHp)}/${maxHp}`, this.centerX, barY - 3);
  }

  renderDebug(ctx: CanvasRenderingContext2D): void {
    if (!this.canAttack() || this.isDead) return;

    // Círculo de range de ataque
    const rangeColor = this.team === 'blue' ? '100, 100, 255' : '255, 100, 100';

    ctx.fillStyle = `rgba(${rangeColor}, 0.1)`;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.stats!.attackRange, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(${rangeColor}, 0.5)`;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.stats!.attackRange, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Range de detecção de aggro
    ctx.strokeStyle = `rgba(255, 200, 0, 0.3)`;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 10]);
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.aggroDetectionRange, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // ==========================================
  // HELPERS
  // ==========================================

  shouldRemove(): boolean {
    return this.isDead;
  }

  getAttackDamage(): number {
    return this.stats?.attackDamage ?? 0;
  }

  getGoldReward(): number {
    return this.goldReward;
  }
}
