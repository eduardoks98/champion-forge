import { Entity } from './Entity';
import { COLORS } from '../constants/colors';
import { SIZES, SPEEDS, RANGES, TIMING, DAMAGE } from '../constants/timing';
import { getGameMap } from '../world/GameMap';
import { getPathfindingGrid, Point } from '../systems/PathfindingGrid';

// AI States
export type AIState = 'idle' | 'chase' | 'attack' | 'stunned' | 'returning';

export class Enemy extends Entity {
  // Targeting state
  isHighlighted: boolean = false;
  isTargeted: boolean = false;

  // AI properties
  aiState: AIState = 'idle';
  speed: number = SPEEDS.enemy; // Usando constante de velocidade
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

  // AI Throttling - para performance com 500+ inimigos
  private aiFrameCounter: number = 0;
  private static readonly AI_UPDATE_INTERVAL = 3; // Atualiza AI a cada 3 frames
  private lastAIResult: { shouldAttack: boolean } = { shouldAttack: false };

  // Separation steering - referência aos outros inimigos
  private static allEnemies: Enemy[] = [];

  // Pathfinding - para desviar de obstáculos
  private currentPath: Point[] | null = null;
  private currentPathIndex: number = 0;
  private pathRecalcTimer: number = 0;
  private static readonly PATH_RECALC_INTERVAL = 500; // Recalcula path a cada 500ms
  private debugPath: Point[] | null = null; // Cópia do path para debug (persiste durante navegação)

  // Registra este inimigo na lista global
  static registerEnemy(enemy: Enemy): void {
    Enemy.allEnemies.push(enemy);
  }

  // Remove este inimigo da lista global
  static unregisterEnemy(enemy: Enemy): void {
    const index = Enemy.allEnemies.indexOf(enemy);
    if (index !== -1) {
      Enemy.allEnemies.splice(index, 1);
    }
  }

  // Limpa todos os inimigos registrados
  static clearAllEnemies(): void {
    Enemy.allEnemies = [];
  }

  constructor(x: number, y: number, id: string) {
    super({
      id,
      x,
      y,
      width: SIZES.enemy,            // 35 - hitbox de movimento
      height: SIZES.enemy,           // 35 - hitbox de movimento
      hitRadius: SIZES.enemy / 2,    // 17.5 - hitbox de combate (circular)
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
  // OTIMIZADO: Throttled para rodar a cada N frames (distribui carga)
  updateAI(playerX: number, playerY: number, deltaTime: number): { shouldAttack: boolean } {
    this.aiFrameCounter++;

    // Distribui updates entre frames usando hash do ID
    // Isso faz diferentes inimigos atualizarem em frames diferentes
    const idHash = this.id.charCodeAt(this.id.length - 1) || 0;
    if (this.aiFrameCounter % Enemy.AI_UPDATE_INTERVAL !== (idHash % Enemy.AI_UPDATE_INTERVAL)) {
      return this.lastAIResult; // Retorna resultado anterior
    }

    let shouldAttack = false;

    // Can't do anything if stunned
    if (this.isStunned()) {
      this.aiState = 'stunned';
      this.lastAIResult = { shouldAttack: false };
      return this.lastAIResult;
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

    this.lastAIResult = { shouldAttack };
    return this.lastAIResult;
  }

  private moveToward(targetX: number, targetY: number, deltaTime: number): void {
    const dx = targetX - this.centerX;
    const dy = targetY - this.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Distância mínima do player (player radius 30 + enemy radius 17.5 + margem)
    const minPlayerDist = 50;

    // Se já está muito perto do player, não se aproximar mais
    if (dist <= minPlayerDist) {
      // Aplicar apenas separação de outros inimigos (para não empilhar)
      this.currentPath = null; // Limpar path quando chegou
      const separation = this.calculateSeparation();
      if (separation.x !== 0 || separation.y !== 0) {
        this.x = Math.max(0, Math.min(SIZES.arena.width - this.width, this.x + separation.x));
        this.y = Math.max(0, Math.min(SIZES.arena.height - this.height, this.y + separation.y));
      }
      return;
    }

    const speedMultiplier = this.getSpeedMultiplier();
    const actualSpeed = this.speed * speedMultiplier;
    const gameMap = getGameMap();

    // Verificar se há caminho direto para o alvo
    const directPathBlocked = this.isPathBlocked(targetX, targetY);

    // Atualizar timer de recálculo de path
    this.pathRecalcTimer -= deltaTime;

    // Usar pathfinding se o caminho direto está bloqueado
    if (directPathBlocked) {
      // Recalcular path periodicamente
      if (!this.currentPath || this.pathRecalcTimer <= 0) {
        this.recalculatePath(targetX, targetY);
        this.pathRecalcTimer = Enemy.PATH_RECALC_INTERVAL;
      }

      // Seguir o path atual
      if (this.currentPath && this.currentPath.length > 0) {
        const waypoint = this.getNextWaypoint(targetX, targetY);
        if (waypoint) {
          this.moveTowardPoint(waypoint.x, waypoint.y, actualSpeed, gameMap);
          return;
        }
      }
    } else {
      // Caminho direto está livre - limpar pathfinding e ir direto
      this.currentPath = null;
      this.debugPath = null; // Limpar debug quando não usa mais A*
    }

    // Movimento direto (sem pathfinding ou como fallback)
    let moveX = (dx / dist) * actualSpeed;
    let moveY = (dy / dist) * actualSpeed;

    // Aplicar separation steering (evitar outros inimigos)
    const separation = this.calculateSeparation();
    moveX += separation.x;
    moveY += separation.y;

    // Calcular nova posição (usando centro)
    let newCenterX = this.centerX + moveX;
    let newCenterY = this.centerY + moveY;

    // Verificar se a nova posição ficaria muito perto do player
    const newDistToPlayer = Math.sqrt((newCenterX - targetX) ** 2 + (newCenterY - targetY) ** 2);

    if (newDistToPlayer < minPlayerDist) {
      // Ajustar para ficar na distância mínima
      const dirX = dx / dist;
      const dirY = dy / dist;
      newCenterX = targetX - dirX * minPlayerDist;
      newCenterY = targetY - dirY * minPlayerDist;
    }

    // Verificar colisão com obstáculos (circular)
    const validPos = gameMap.tryMoveCircle(this.centerX, this.centerY, newCenterX, newCenterY, this.hitRadius);

    // Converter de centro para posição
    this.x = validPos.x - this.width / 2;
    this.y = validPos.y - this.height / 2;
  }

  /**
   * Verifica se há obstáculo entre a posição atual e o alvo (usando colisão circular)
   */
  private isPathBlocked(targetX: number, targetY: number): boolean {
    const gameMap = getGameMap();
    const steps = 5; // Verificar 5 pontos no caminho

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const checkX = this.centerX + (targetX - this.centerX) * t;
      const checkY = this.centerY + (targetY - this.centerY) * t;

      if (!gameMap.isWalkableCircle(checkX, checkY, this.hitRadius)) {
        return true;
      }
    }

    return false;
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
      this.debugPath = [...path]; // Cópia completa para debug (persiste)
      this.currentPathIndex = 0;
    } else {
      this.currentPath = null;
      this.debugPath = null;
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
   * Move em direção a um ponto específico (usando colisão circular)
   */
  private moveTowardPoint(targetX: number, targetY: number, speed: number, gameMap: ReturnType<typeof getGameMap>): void {
    const dx = targetX - this.centerX;
    const dy = targetY - this.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 1) return;

    let moveX = (dx / dist) * speed;
    let moveY = (dy / dist) * speed;

    // Aplicar separation steering
    const separation = this.calculateSeparation();
    moveX += separation.x;
    moveY += separation.y;

    const newCenterX = this.centerX + moveX;
    const newCenterY = this.centerY + moveY;

    // Verificar colisão com obstáculos (circular)
    const validPos = gameMap.tryMoveCircle(this.centerX, this.centerY, newCenterX, newCenterY, this.hitRadius);

    // Converter de centro para posição
    this.x = validPos.x - this.width / 2;
    this.y = validPos.y - this.height / 2;
  }

  // Calcula força de separação para evitar outros inimigos
  // FORÇA AUMENTADA para funcionar como colisão real mas suave
  private calculateSeparation(): { x: number; y: number } {
    let separationX = 0;
    let separationY = 0;
    let count = 0;

    const separationRadius = 45; // Tamanho do inimigo (35) + margem (10)
    const minDistance = 38;      // Distância mínima entre centros

    for (const other of Enemy.allEnemies) {
      if (other.id === this.id || other.isDead) continue;

      const dx = this.centerX - other.centerX;
      const dy = this.centerY - other.centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < separationRadius && dist > 0) {
        // Força mais forte quanto mais perto
        // Se dist < minDistance, força máxima
        const strength = Math.min(1.5, (separationRadius - dist) / (separationRadius - minDistance + 1));
        separationX += (dx / dist) * strength;
        separationY += (dy / dist) * strength;
        count++;
      }
    }

    if (count > 0) {
      const magnitude = Math.sqrt(separationX * separationX + separationY * separationY);
      if (magnitude > 0) {
        // FORÇA FORTE: 1.5 = igual à velocidade do inimigo
        // Isso efetivamente impede sobreposição
        const force = 1.5;
        return {
          x: (separationX / magnitude) * force,
          y: (separationY / magnitude) * force
        };
      }
    }

    return { x: 0, y: 0 };
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

  // Retorna o path atual (navegação)
  getPath(): Point[] | null {
    return this.currentPath;
  }

  // Retorna o path para debug (persiste durante navegação)
  getDebugPath(): Point[] | null {
    return this.debugPath;
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

    // OTIMIZAÇÃO: shadowBlur removido - muito pesado para performance
    // Usar border mais grossa ao invés de glow
    // (glow consome muita CPU/GPU)

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

    // Outline do inimigo (mais visível, sem usar shadowBlur)
    ctx.strokeStyle = this.isHighlighted ? '#ffaa00' : (this.isStunned() ? '#00aaff' : '#5c1a1a');
    ctx.lineWidth = this.isHighlighted ? 3 : 2;
    ctx.stroke();

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
