import { Entity, Vector2 } from './Entity';
import { COLORS } from '../constants/colors';
import { SIZES, SPEEDS, DAMAGE } from '../constants/timing';

export type ProjectileType = 'fireball' | 'ice' | 'lightning';

interface ProjectileOptions {
  id: string;
  x: number;
  y: number;
  direction: Vector2;
  type: ProjectileType;
  ownerId: string;
}

export class Projectile extends Entity {
  direction: Vector2;
  type: ProjectileType;
  ownerId: string;
  speed: number;
  pierce: boolean;
  hitEntities: Set<string> = new Set();

  // Trail effect
  trail: { x: number; y: number; opacity: number }[] = [];
  pulsePhase: number = 0;

  constructor(options: ProjectileOptions) {
    const colors: Record<ProjectileType, string> = {
      fireball: '#ff6b00',
      ice: '#00d9ff',
      lightning: '#ffff00',
    };

    super({
      id: options.id,
      x: options.x,
      y: options.y,
      width: SIZES.projectile,
      height: SIZES.projectile,
      color: colors[options.type],
    });

    this.direction = options.direction;
    this.type = options.type;
    this.ownerId = options.ownerId;

    // Configurações por tipo
    switch (options.type) {
      case 'fireball':
        this.speed = SPEEDS.fireball;
        this.pierce = false;
        break;
      case 'ice':
        this.speed = SPEEDS.iceSpear;
        this.pierce = true;
        break;
      default:
        this.speed = SPEEDS.fireball;
        this.pierce = false;
    }
  }

  update(deltaTime: number): void {
    // Adicionar posição atual ao trail
    this.trail.push({
      x: this.x,
      y: this.y,
      opacity: 0.5,
    });

    // Limitar tamanho do trail
    if (this.trail.length > 10) {
      this.trail.shift();
    }

    // Atualizar opacidade do trail
    this.trail.forEach((point, i) => {
      point.opacity = (i / this.trail.length) * 0.5;
    });

    // Mover projétil
    this.x += this.direction.x * this.speed;
    this.y += this.direction.y * this.speed;

    // Atualizar fase de pulso (para fireball)
    this.pulsePhase += deltaTime * 0.02;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Renderizar trail
    this.trail.forEach(point => {
      ctx.globalAlpha = point.opacity;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(
        point.x + this.width / 2,
        point.y + this.height / 2,
        this.width / 3,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });

    ctx.globalAlpha = 1;

    // Renderizar projétil principal
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const pulseScale = this.type === 'fireball' ? 1 + Math.sin(this.pulsePhase) * 0.2 : 1;

    // Gradiente
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, (this.width / 2) * pulseScale
    );

    switch (this.type) {
      case 'fireball':
        gradient.addColorStop(0, COLORS.fireball[0]);
        gradient.addColorStop(1, COLORS.fireball[1]);
        break;
      case 'ice':
        gradient.addColorStop(0, COLORS.ice[0]);
        gradient.addColorStop(1, COLORS.ice[1]);
        break;
      case 'lightning':
        gradient.addColorStop(0, COLORS.lightning[0]);
        gradient.addColorStop(1, COLORS.lightning[1]);
        break;
    }

    ctx.fillStyle = gradient;
    // OTIMIZAÇÃO: shadowBlur removido - muito pesado
    // Usar outline ao invés de glow

    ctx.beginPath();
    ctx.arc(centerX, centerY, (this.width / 2) * pulseScale, 0, Math.PI * 2);
    ctx.fill();

    // Outline colorido ao invés de glow
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  // Obter dano do projétil
  getDamage(): number {
    switch (this.type) {
      case 'fireball':
        return DAMAGE.fireball;
      case 'ice':
        return DAMAGE.iceSpear;
      default:
        return DAMAGE.fireball;
    }
  }

  // Verificar se já atingiu uma entidade
  hasHit(entityId: string): boolean {
    return this.hitEntities.has(entityId);
  }

  // Marcar entidade como atingida
  markHit(entityId: string): void {
    this.hitEntities.add(entityId);
  }

  // Verificar se deve ser removido
  shouldRemove(): boolean {
    return this.isOutOfBounds(SIZES.arena.width, SIZES.arena.height);
  }
}
