import { Entity } from './Entity';
import { SIZES, SPEEDS, TIMING, DAMAGE } from '../constants/timing';
import { getGameMap } from '../world/GameMap';
import { getPathfindingGrid, Point } from '../systems/PathfindingGrid';
import { Structure } from './Structure';

export type MinionTeam = 'blue' | 'red';

export class Minion extends Entity {
  team: MinionTeam;
  speed: number = SPEEDS.enemy * 0.8; // Minions um pouco mais lentos
  attackRange: number = 60;
  attackCooldown: number = 0;
  attackDamage: number = DAMAGE.enemyMelee * 0.5; // Metade do dano de um enemy

  // Alvo atual (outro minion ou player)
  currentTarget: Entity | null = null;

  // Attack animation
  isAttacking: boolean = false;
  attackTimer: number = 0;

  // Last hit tracking (para sistema de gold)
  lastDamageSource: 'player' | 'minion' | 'tower' | 'unknown' = 'unknown';

  // Pathfinding - para desviar de obstáculos
  private currentPath: Point[] | null = null;
  private currentPathIndex: number = 0;
  private pathRecalcTimer: number = 0;
  private static readonly PATH_RECALC_INTERVAL = 250; // Recalcula path a cada 250ms (mais responsivo)

  constructor(x: number, y: number, id: string, team: MinionTeam) {
    super({
      id,
      x,
      y,
      width: SIZES.minion,
      height: SIZES.minion,
      hitRadius: SIZES.minion / 2,
      color: team === 'blue' ? '#3498db' : '#e74c3c',
      hp: 50,
      maxHp: 50,
    });
    this.team = team;
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

  /**
   * AI do minion - move em direção ao Nexus inimigo e ataca inimigos no caminho
   * Prioridade de alvos (estilo LoL):
   * 1. Minions inimigos próximos
   * 2. Player inimigo (se muito perto)
   * 3. Estruturas inimigas
   * 4. Se não há alvo, ir para o Nexus inimigo
   */
  updateAI(
    enemyMinions: Minion[],
    enemyPlayer: Entity | null,
    deltaTime: number,
    enemyStructures?: Structure[],
    enemyNexus?: Structure
  ): { shouldAttack: boolean; target: Entity | null } {
    if (this.isDead || this.isStunned()) {
      return { shouldAttack: false, target: null };
    }

    // Encontrar alvo mais próximo usando prioridade
    const target = this.findNearestTarget(enemyMinions, enemyPlayer, enemyStructures);
    this.currentTarget = target;

    if (target) {
      const dist = this.distanceTo(target);

      if (dist <= this.attackRange) {
        // Dentro do range - atacar
        if (this.attackCooldown <= 0) {
          this.performAttack();
          return { shouldAttack: true, target };
        }
      } else {
        // Fora do range - mover em direção ao alvo
        this.moveToward(target.centerX, target.centerY, deltaTime);
      }
    } else {
      // Sem alvo próximo - ir para o Nexus inimigo
      if (enemyNexus && !enemyNexus.isDead) {
        const dist = this.distanceTo(enemyNexus);

        if (dist <= this.attackRange) {
          // Atacar Nexus
          if (this.attackCooldown <= 0) {
            this.performAttack();
            return { shouldAttack: true, target: enemyNexus };
          }
        } else {
          // Mover em direção ao Nexus
          this.moveToward(enemyNexus.centerX, enemyNexus.centerY, deltaTime);
        }
      } else {
        // Fallback: ir para a base inimiga (se não tem Nexus)
        const targetX = this.team === 'blue' ? SIZES.arena.width - 100 : 100;
        const targetY = SIZES.lane.centerY;
        this.moveToward(targetX, targetY, deltaTime);
      }
    }

    return { shouldAttack: false, target: null };
  }

  private findNearestTarget(
    enemyMinions: Minion[],
    enemyPlayer: Entity | null,
    enemyStructures?: Structure[]
  ): Entity | null {
    let nearest: Entity | null = null;
    let nearestDist = Infinity;

    // Prioridade 1: minions inimigos próximos (dentro de 200 unidades)
    for (const minion of enemyMinions) {
      if (minion.isDead) continue;
      const dist = this.distanceTo(minion);
      if (dist < nearestDist && dist < 200) {
        nearestDist = dist;
        nearest = minion;
      }
    }

    // Prioridade 2: player inimigo (se muito perto, 150 unidades)
    if (!nearest && enemyPlayer && !enemyPlayer.isDead) {
      const dist = this.distanceTo(enemyPlayer);
      if (dist < 150) {
        nearest = enemyPlayer;
      }
    }

    // Prioridade 3: estruturas inimigas no range de ataque + margem
    if (!nearest && enemyStructures) {
      for (const structure of enemyStructures) {
        if (structure.isDead) continue;
        const dist = this.distanceTo(structure);
        // Só atacar estrutura se estiver perto (range + 100)
        if (dist < this.attackRange + 100) {
          if (dist < nearestDist) {
            nearestDist = dist;
            nearest = structure;
          }
        }
      }
    }

    return nearest;
  }


  /**
   * Recalcula o path usando A*
   */
  private recalculatePath(targetX: number, targetY: number): void {
    const grid = getPathfindingGrid();
    const path = grid.findPath(
      { x: this.centerX, y: this.centerY },
      { x: targetX, y: targetY }
    );

    if (path && path.length > 1) {
      // Pular o primeiro ponto (posição atual)
      this.currentPath = path.slice(1);
      this.currentPathIndex = 0;
    } else {
      // Se não encontrou path, tentar ir direto
      this.currentPath = null;
      // Debug: log quando pathfinding falha
      if (!path) {
        console.warn(`[Minion ${this.id}] Pathfinding failed from (${Math.round(this.centerX)}, ${Math.round(this.centerY)}) to (${Math.round(targetX)}, ${Math.round(targetY)})`);
      }
    }
  }

  /**
   * Retorna o próximo waypoint do path
   */
  private getNextWaypoint(targetX: number, targetY: number): Point | null {
    if (!this.currentPath || this.currentPath.length === 0) {
      return null;
    }

    // Verificar se chegou no waypoint atual
    const waypoint = this.currentPath[this.currentPathIndex];
    const distToWaypoint = Math.sqrt(
      (this.centerX - waypoint.x) ** 2 + (this.centerY - waypoint.y) ** 2
    );

    // Se chegou no waypoint, avançar para o próximo
    if (distToWaypoint < 20) {
      this.currentPathIndex++;
      if (this.currentPathIndex >= this.currentPath.length) {
        // Chegou no fim do path - voltar para movimento direto
        this.currentPath = null;
        return { x: targetX, y: targetY };
      }
      return this.currentPath[this.currentPathIndex];
    }

    return waypoint;
  }

  /**
   * Move em direção ao alvo SEMPRE usando pathfinding A*
   * Isso evita minions ficarem presos em obstáculos
   */
  private moveToward(targetX: number, targetY: number, deltaTime: number): void {
    const dx = targetX - this.centerX;
    const dy = targetY - this.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) return;

    const speedMultiplier = this.getSpeedMultiplier();
    const actualSpeed = this.speed * speedMultiplier;
    const gameMap = getGameMap();

    // Atualizar timer de recálculo de path
    this.pathRecalcTimer -= deltaTime;

    // SEMPRE usar pathfinding A* (não confiar em detecção de bloqueio)
    // Recalcular path periodicamente ou quando não tem path
    if (!this.currentPath || this.pathRecalcTimer <= 0) {
      this.recalculatePath(targetX, targetY);
      this.pathRecalcTimer = Minion.PATH_RECALC_INTERVAL;
    }

    // Seguir o path atual se existir
    if (this.currentPath && this.currentPath.length > 0) {
      const waypoint = this.getNextWaypoint(targetX, targetY);
      if (waypoint) {
        this.moveTowardPoint(waypoint.x, waypoint.y, actualSpeed, gameMap);
        return;
      }
    }

    // Fallback: movimento direto (só se A* falhou completamente)
    const moveX = (dx / dist) * actualSpeed;
    const moveY = (dy / dist) * actualSpeed;

    const newCenterX = this.centerX + moveX;
    const newCenterY = this.centerY + moveY;

    // Verificar colisão com obstáculos (circular)
    const validPos = gameMap.tryMoveCircle(this.centerX, this.centerY, newCenterX, newCenterY, this.hitRadius);

    // Converter de centro para posição
    this.x = validPos.x - this.width / 2;
    this.y = validPos.y - this.height / 2;
  }

  /**
   * Move em direção a um ponto específico (usando colisão circular)
   */
  private moveTowardPoint(targetX: number, targetY: number, speed: number, gameMap: ReturnType<typeof getGameMap>): void {
    const dx = targetX - this.centerX;
    const dy = targetY - this.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 1) return;

    const moveX = (dx / dist) * speed;
    const moveY = (dy / dist) * speed;

    const newCenterX = this.centerX + moveX;
    const newCenterY = this.centerY + moveY;

    // Verificar colisão com obstáculos (circular)
    const validPos = gameMap.tryMoveCircle(this.centerX, this.centerY, newCenterX, newCenterY, this.hitRadius);

    // Converter de centro para posição
    this.x = validPos.x - this.width / 2;
    this.y = validPos.y - this.height / 2;
  }

  private performAttack(): void {
    this.isAttacking = true;
    this.attackTimer = TIMING.attackSwing * 0.7;
    this.attackCooldown = TIMING.enemyAttackCooldown * 0.8;
  }

  getAttackDamage(): number {
    return this.attackDamage;
  }

  /**
   * Override takeDamage para rastrear fonte de dano
   */
  takeDamageFrom(amount: number, source: 'player' | 'minion' | 'tower'): void {
    this.lastDamageSource = source;
    this.takeDamage(amount);
  }

  /**
   * Verifica se foi last hit pelo player
   */
  wasLastHitByPlayer(): boolean {
    return this.isDead && this.lastDamageSource === 'player';
  }

  /**
   * Retorna o path atual para debug
   */
  getDebugPath(): Point[] | null {
    return this.currentPath;
  }

  /**
   * Renderiza informações de debug (path, range, hitbox)
   */
  renderDebug(ctx: CanvasRenderingContext2D): void {
    if (this.isDead) return;

    // 1. Desenhar path A* (linha verde tracejada)
    if (this.currentPath && this.currentPath.length > 0) {
      ctx.strokeStyle = this.team === 'blue' ? '#00ff00' : '#ff6600';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(this.centerX, this.centerY);
      for (const point of this.currentPath) {
        ctx.lineTo(point.x, point.y);
      }
      ctx.stroke();

      // Waypoints (círculos)
      ctx.setLineDash([]);
      ctx.fillStyle = this.team === 'blue' ? '#00ff00' : '#ff6600';
      for (const point of this.currentPath) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 2. Desenhar range de ataque (círculo vermelho)
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.attackRange, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Linha até o alvo atual (amarela)
    if (this.currentTarget && !this.currentTarget.isDead) {
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(this.centerX, this.centerY);
      ctx.lineTo(this.currentTarget.centerX, this.currentTarget.centerY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
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

    // Cor com efeito de hit
    let fillColor = this.color;
    if (this.isHit) {
      ctx.filter = 'brightness(2)';
    }

    // Corpo do minion (círculo)
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.width / 2, 0, Math.PI * 2);
    ctx.fill();

    // Borda do time
    ctx.strokeStyle = this.team === 'blue' ? '#2980b9' : '#c0392b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Indicador do time (pequeno símbolo)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.team === 'blue' ? 'B' : 'R', this.centerX, this.centerY + 4);

    ctx.filter = 'none';

    // Barra de vida
    if (!this.isDead) {
      this.renderHealthBar(ctx);
    }

    ctx.restore();
  }

  shouldRemove(): boolean {
    return this.isDead && this.deathScale <= 0;
  }
}
