import { COLORS } from '../constants/colors';

export type EffectType = 'aoe' | 'lightning' | 'explosion' | 'frost_nova' | 'meteor_warning';

interface Effect {
  x: number;
  y: number;
  type: EffectType;
  radius: number;
  maxRadius: number;
  color: string;
  life: number;
  maxLife: number;
}

export class EffectSystem {
  private effects: Effect[] = [];

  // Criar efeito de AOE (círculo expandindo)
  createAOE(x: number, y: number, radius: number, color: string, duration: number = 500): void {
    this.effects.push({
      x,
      y,
      type: 'aoe',
      radius: 0,
      maxRadius: radius,
      color,
      life: duration,
      maxLife: duration,
    });
  }

  // Criar efeito de lightning
  createLightning(x: number, y: number, radius: number = 100): void {
    this.effects.push({
      x,
      y,
      type: 'lightning',
      radius,
      maxRadius: radius,
      color: COLORS.lightning[1],
      life: 300,
      maxLife: 300,
    });
  }

  // Criar explosão
  createExplosion(x: number, y: number, radius: number, color: string): void {
    this.effects.push({
      x,
      y,
      type: 'explosion',
      radius: 0,
      maxRadius: radius,
      color,
      life: 400,
      maxLife: 400,
    });
  }

  // Criar efeito de Frost Nova (círculo de gelo expandindo)
  createFrostNova(x: number, y: number, radius: number): void {
    this.effects.push({
      x,
      y,
      type: 'frost_nova',
      radius: 0,
      maxRadius: radius,
      color: '#88ddff',
      life: 500,
      maxLife: 500,
    });
  }

  // Criar indicador de Meteor (círculo vermelho piscando)
  createMeteorWarning(x: number, y: number, radius: number): void {
    this.effects.push({
      x,
      y,
      type: 'meteor_warning',
      radius: radius,
      maxRadius: radius,
      color: '#ff4400',
      life: 1000, // 1 second warning
      maxLife: 1000,
    });
  }

  // Atualizar
  update(deltaTime: number): void {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i];
      effect.life -= deltaTime;

      // Atualizar raio baseado no progresso
      const progress = 1 - (effect.life / effect.maxLife);
      effect.radius = effect.maxRadius * progress;

      if (effect.life <= 0) {
        this.effects.splice(i, 1);
      }
    }
  }

  // Renderizar
  render(ctx: CanvasRenderingContext2D): void {
    for (const effect of this.effects) {
      const progress = 1 - (effect.life / effect.maxLife);
      const alpha = 1 - progress;

      ctx.save();
      ctx.globalAlpha = alpha;

      switch (effect.type) {
        case 'aoe':
          this.renderAOE(ctx, effect);
          break;
        case 'lightning':
          this.renderLightning(ctx, effect);
          break;
        case 'explosion':
          this.renderExplosion(ctx, effect);
          break;
        case 'frost_nova':
          this.renderFrostNova(ctx, effect);
          break;
        case 'meteor_warning':
          this.renderMeteorWarning(ctx, effect);
          break;
      }

      ctx.restore();
    }
  }

  private renderAOE(ctx: CanvasRenderingContext2D, effect: Effect): void {
    // Círculo com borda
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Fill semi-transparente
    ctx.fillStyle = effect.color + '33'; // 20% opacity
    ctx.fill();
  }

  private renderLightning(ctx: CanvasRenderingContext2D, effect: Effect): void {
    const progress = 1 - (effect.life / effect.maxLife);

    // Flash central
    const gradient = ctx.createRadialGradient(
      effect.x, effect.y, 0,
      effect.x, effect.y, effect.radius
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, ' + (1 - progress) + ')');
    gradient.addColorStop(0.3, 'rgba(255, 255, 0, ' + (0.5 - progress * 0.5) + ')');
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
    ctx.fill();

    // Raios elétricos
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i + Math.random() * 0.3;
      const length = effect.radius * 0.8;

      ctx.beginPath();
      ctx.moveTo(effect.x, effect.y);

      // Linha em zigzag
      const segments = 4;
      for (let j = 1; j <= segments; j++) {
        const dist = (length / segments) * j;
        const nx = effect.x + Math.cos(angle) * dist + (Math.random() - 0.5) * 15;
        const ny = effect.y + Math.sin(angle) * dist + (Math.random() - 0.5) * 15;
        ctx.lineTo(nx, ny);
      }

      ctx.stroke();
    }
  }

  private renderExplosion(ctx: CanvasRenderingContext2D, effect: Effect): void {
    const progress = 1 - (effect.life / effect.maxLife);

    // Múltiplos círculos
    for (let i = 0; i < 3; i++) {
      const ringProgress = Math.max(0, progress - i * 0.1);
      const ringRadius = effect.maxRadius * ringProgress;
      const ringAlpha = Math.max(0, 1 - ringProgress * 1.5);

      ctx.strokeStyle = effect.color;
      ctx.globalAlpha = ringAlpha;
      ctx.lineWidth = 4 - i;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Centro brilhante
    if (progress < 0.3) {
      ctx.globalAlpha = 1 - progress * 3;
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 15 * (1 - progress * 2), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderFrostNova(ctx: CanvasRenderingContext2D, effect: Effect): void {
    const progress = 1 - (effect.life / effect.maxLife);

    // Expanding ice circle
    const currentRadius = effect.maxRadius * progress;

    // Outer ring
    ctx.strokeStyle = '#88ddff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, currentRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner fill with gradient
    const gradient = ctx.createRadialGradient(
      effect.x, effect.y, 0,
      effect.x, effect.y, currentRadius
    );
    gradient.addColorStop(0, 'rgba(136, 221, 255, 0.4)');
    gradient.addColorStop(0.7, 'rgba(136, 221, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(136, 221, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, currentRadius, 0, Math.PI * 2);
    ctx.fill();

    // Ice crystal decorations around the edge
    const crystalCount = 8;
    for (let i = 0; i < crystalCount; i++) {
      const angle = (Math.PI * 2 / crystalCount) * i + progress * Math.PI;
      const cx = effect.x + Math.cos(angle) * currentRadius;
      const cy = effect.y + Math.sin(angle) * currentRadius;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(cx, cy - 8);
      ctx.lineTo(cx + 4, cy);
      ctx.lineTo(cx, cy + 8);
      ctx.lineTo(cx - 4, cy);
      ctx.closePath();
      ctx.fill();
    }
  }

  private renderMeteorWarning(ctx: CanvasRenderingContext2D, effect: Effect): void {
    const progress = 1 - (effect.life / effect.maxLife);

    // Pulsing warning circle
    const pulseAlpha = 0.3 + Math.sin(progress * Math.PI * 8) * 0.2;

    // Warning fill
    ctx.fillStyle = `rgba(255, 68, 0, ${pulseAlpha})`;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
    ctx.fill();

    // Warning border (gets thicker as meteor approaches)
    ctx.strokeStyle = '#ff4400';
    ctx.lineWidth = 2 + progress * 4;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner target circle
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.radius * 0.3, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(effect.x - effect.radius * 0.5, effect.y);
    ctx.lineTo(effect.x + effect.radius * 0.5, effect.y);
    ctx.moveTo(effect.x, effect.y - effect.radius * 0.5);
    ctx.lineTo(effect.x, effect.y + effect.radius * 0.5);
    ctx.stroke();
  }

  // Limpar
  clear(): void {
    this.effects = [];
  }
}
