// ==========================================
// SKELETON ENTITY
// Entidade base com sistema de bones procedural
// ==========================================

import { Entity } from './Entity';
import { Skeleton, SkeletonFactory } from '../animation/Skeleton';
import { ProceduralAnimator, AnimationState } from '../animation/ProceduralAnimator';
import { SkeletonRenderer, RendererFactory } from '../animation/SkeletonRenderer';
import { Vector2 } from '../utils/Vector2';
import { Direction8, getDirectionFromVelocity } from '../animation/Direction';

/**
 * Tipo de entidade skeleton
 */
export type SkeletonEntityType = 'player' | 'enemy' | 'boss';

/**
 * Configuracao da entidade skeleton
 */
export interface SkeletonEntityConfig {
  id: string;
  x: number;
  y: number;
  type: SkeletonEntityType;
  hp?: number;
  maxHp?: number;
}

/**
 * Entidade com skeleton procedural
 *
 * Esta classe combina o sistema de Entity existente com o novo
 * sistema de animacao procedural por bones.
 */
export class SkeletonEntity extends Entity {
  // Sistema de animacao
  protected skeleton: Skeleton;
  protected animator: ProceduralAnimator;
  protected renderer: SkeletonRenderer | null = null;

  // Estado de movimento
  protected velocity: Vector2 = new Vector2(0, 0);
  protected facing: Direction8 = Direction8.S;
  protected targetPosition: Vector2 | null = null;

  // Velocidade em tiles/segundo
  protected moveSpeed: number = 3;

  constructor(config: SkeletonEntityConfig, ctx?: CanvasRenderingContext2D) {
    super({
      id: config.id,
      x: config.x,
      y: config.y,
      width: 40, // Ajustado para skeleton
      height: 70,
      color: '#ffffff',
      hp: config.hp ?? 100,
      maxHp: config.maxHp ?? 100,
    });

    // Criar skeleton baseado no tipo
    this.skeleton = this.createSkeleton(config.type);
    this.animator = new ProceduralAnimator(this.skeleton);

    // Criar renderer se contexto disponivel
    if (ctx) {
      this.renderer = this.createRenderer(config.type, ctx);
    }
  }

  /**
   * Cria skeleton apropriado para o tipo
   */
  private createSkeleton(type: SkeletonEntityType): Skeleton {
    switch (type) {
      case 'player':
        return SkeletonFactory.createPlayer();
      case 'enemy':
        return SkeletonFactory.createEnemy();
      case 'boss':
        return SkeletonFactory.createBossEnemy();
      default:
        return SkeletonFactory.createPlayer();
    }
  }

  /**
   * Cria renderer apropriado para o tipo
   */
  private createRenderer(type: SkeletonEntityType, ctx: CanvasRenderingContext2D): SkeletonRenderer {
    switch (type) {
      case 'player':
        return RendererFactory.createPlayerRenderer(ctx);
      case 'enemy':
        return RendererFactory.createEnemyRenderer(ctx);
      case 'boss':
        return RendererFactory.createBossRenderer(ctx);
      default:
        return RendererFactory.createPlayerRenderer(ctx);
    }
  }

  /**
   * Define o renderer (usado quando contexto muda)
   */
  setRenderer(renderer: SkeletonRenderer): void {
    this.renderer = renderer;
  }

  /**
   * Atualiza a entidade
   */
  update(deltaTime: number): void {
    // Atualizar timers da entidade base
    this.updateAnimationTimers(deltaTime);

    // Converter deltaTime de ms para segundos
    const dt = deltaTime / 1000;

    // Atualizar movimento
    this.updateMovement(dt);

    // Determinar estado de animacao
    const animState = this.determineAnimationState();
    this.animator.setState(animState);

    // Atualizar animacao
    this.animator.update(dt, this.velocity);

    // Atualizar posicao do skeleton
    this.skeleton.setPosition(this.centerX, this.centerY);
    this.skeleton.setFacing(this.facing);
  }

  /**
   * Atualiza movimento
   */
  protected updateMovement(deltaTime: number): void {
    if (!this.canMove() || !this.targetPosition) {
      this.velocity.set(0, 0);
      return;
    }

    const dx = this.targetPosition.x - this.centerX;
    const dy = this.targetPosition.y - this.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Chegou ao destino
    if (dist < 5) {
      this.targetPosition = null;
      this.velocity.set(0, 0);
      return;
    }

    // Calcular velocidade
    const speedMultiplier = this.getSpeedMultiplier();
    const pixelsPerSecond = this.moveSpeed * 64 * speedMultiplier; // Assumindo tile de 64px
    const speed = pixelsPerSecond * deltaTime;

    // Mover em direcao ao alvo
    const moveX = (dx / dist) * speed;
    const moveY = (dy / dist) * speed;

    this.x += moveX;
    this.y += moveY;

    // Atualizar velocidade para animacao
    this.velocity.set(moveX / deltaTime, moveY / deltaTime);

    // Atualizar direcao (8 direções)
    this.facing = getDirectionFromVelocity(dx, dy);
  }

  /**
   * Determina estado de animacao baseado no estado atual
   */
  protected determineAnimationState(): AnimationState {
    if (this.isStunned()) return 'idle'; // Stunned usa idle por enquanto
    if (this.isHit) return 'hit';
    if (this.isDead) return 'death';
    if (this.velocity.magnitude() > 10) return 'walk';
    return 'idle';
  }

  /**
   * Move para uma posicao
   */
  moveTo(x: number, y: number): void {
    this.targetPosition = new Vector2(x, y);
  }

  /**
   * Para o movimento
   */
  stopMoving(): void {
    this.targetPosition = null;
    this.velocity.set(0, 0);
  }

  /**
   * Renderiza a entidade
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (this.isDead && this.deathScale <= 0) return;

    ctx.save();

    // Escala de morte
    if (this.isDead) {
      ctx.translate(this.centerX, this.centerY);
      ctx.scale(this.deathScale, this.deathScale);
      ctx.translate(-this.centerX, -this.centerY);
    }

    // Renderizar skeleton
    if (this.renderer) {
      this.renderer.render(this.skeleton);
    }

    // Barra de vida
    if (!this.isDead) {
      this.renderHealthBar(ctx);
      this.renderShieldBar(ctx);
      this.renderStatusIndicators(ctx);
    }

    ctx.restore();
  }

  /**
   * Retorna o skeleton
   */
  getSkeleton(): Skeleton {
    return this.skeleton;
  }

  /**
   * Retorna o animador
   */
  getAnimator(): ProceduralAnimator {
    return this.animator;
  }

  /**
   * Dispara animacao de ataque
   */
  triggerAttack(): void {
    this.animator.setState('attack');
  }

  /**
   * Dispara animacao de hit
   */
  triggerHit(): void {
    this.animator.setState('hit');
  }

  /**
   * Obtem direcao atual
   */
  getFacing(): Direction8 {
    return this.facing;
  }

  /**
   * Define direcao
   */
  setFacing(direction: Direction8): void {
    this.facing = direction;
    this.skeleton.setFacing(direction);
  }

  /**
   * Define velocidade de movimento
   */
  setMoveSpeed(tilesPerSecond: number): void {
    this.moveSpeed = tilesPerSecond;
  }
}
