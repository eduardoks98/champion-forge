/**
 * AnimationEffects - Efeitos visuais para transições e feedback
 *
 * Inclui:
 * - Efeito de troca de arma
 * - Efeito de equipar habilidade
 * - Efeito de level up / unlock
 * - Partículas decorativas
 */

import { WeaponSpriteType, WEAPON_COLORS } from './SpriteManager';

export interface TransitionEffect {
  type: 'weapon_swap' | 'ability_equip' | 'item_equip' | 'level_up' | 'unlock';
  x: number;
  y: number;
  startTime: number;
  duration: number;
  data?: Record<string, unknown>;
}

export interface FloatingParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'circle' | 'star' | 'spark' | 'rune';
}

class AnimationEffectsClass {
  private effects: TransitionEffect[] = [];
  private particles: FloatingParticle[] = [];

  /**
   * Adiciona efeito de troca de arma
   */
  triggerWeaponSwap(
    x: number,
    y: number,
    oldWeaponType: WeaponSpriteType | null,
    newWeaponType: WeaponSpriteType
  ): void {
    this.effects.push({
      type: 'weapon_swap',
      x,
      y,
      startTime: Date.now(),
      duration: 600,
      data: { oldWeaponType, newWeaponType },
    });

    // Spawn particles
    const colors = WEAPON_COLORS[newWeaponType];
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 500 + Math.random() * 300,
        maxLife: 500 + Math.random() * 300,
        size: 3 + Math.random() * 4,
        color: colors.glow,
        type: 'spark',
      });
    }
  }

  /**
   * Adiciona efeito de equipar habilidade
   */
  triggerAbilityEquip(x: number, y: number, slot: string, color: string = '#00ffff'): void {
    this.effects.push({
      type: 'ability_equip',
      x,
      y,
      startTime: Date.now(),
      duration: 400,
      data: { slot, color },
    });

    // Spawn rune particles
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      this.particles.push({
        x: x + Math.cos(angle) * 30,
        y: y + Math.sin(angle) * 30,
        vx: Math.cos(angle) * 0.5,
        vy: Math.sin(angle) * 0.5 - 1,
        life: 600,
        maxLife: 600,
        size: 6,
        color,
        type: 'rune',
      });
    }
  }

  /**
   * Adiciona efeito de level up
   */
  triggerLevelUp(x: number, y: number): void {
    this.effects.push({
      type: 'level_up',
      x,
      y,
      startTime: Date.now(),
      duration: 1000,
      data: {},
    });

    // Spawn star particles rising
    for (let i = 0; i < 20; i++) {
      const offsetX = (Math.random() - 0.5) * 60;
      this.particles.push({
        x: x + offsetX,
        y: y + 20,
        vx: (Math.random() - 0.5) * 1,
        vy: -2 - Math.random() * 2,
        life: 800 + Math.random() * 400,
        maxLife: 800 + Math.random() * 400,
        size: 4 + Math.random() * 4,
        color: i % 2 === 0 ? '#ffd700' : '#ffffff',
        type: 'star',
      });
    }
  }

  /**
   * Adiciona efeito de desbloqueio
   */
  triggerUnlock(x: number, y: number, itemType: 'weapon' | 'ability' | 'passive'): void {
    const colors = {
      weapon: '#ff8800',
      ability: '#00aaff',
      passive: '#aa00ff',
    };

    this.effects.push({
      type: 'unlock',
      x,
      y,
      startTime: Date.now(),
      duration: 800,
      data: { itemType },
    });

    // Spawn burst particles
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const speed = 3 + Math.random() * 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 500,
        maxLife: 500,
        size: 5,
        color: colors[itemType],
        type: 'circle',
      });
    }
  }

  /**
   * Atualiza todos os efeitos
   */
  update(deltaTime: number): void {
    const now = Date.now();

    // Remove efeitos expirados
    this.effects = this.effects.filter(effect => {
      return now - effect.startTime < effect.duration;
    });

    // Atualiza partículas
    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.05; // Gravidade leve
      particle.life -= deltaTime;
      return particle.life > 0;
    });
  }

  /**
   * Renderiza todos os efeitos
   */
  render(ctx: CanvasRenderingContext2D): void {
    const now = Date.now();

    // Renderiza efeitos de transição
    for (const effect of this.effects) {
      const progress = (now - effect.startTime) / effect.duration;
      this.renderEffect(ctx, effect, progress);
    }

    // Renderiza partículas
    for (const particle of this.particles) {
      this.renderParticle(ctx, particle);
    }
  }

  private renderEffect(ctx: CanvasRenderingContext2D, effect: TransitionEffect, progress: number): void {
    ctx.save();

    switch (effect.type) {
      case 'weapon_swap':
        this.renderWeaponSwapEffect(ctx, effect, progress);
        break;
      case 'ability_equip':
        this.renderAbilityEquipEffect(ctx, effect, progress);
        break;
      case 'level_up':
        this.renderLevelUpEffect(ctx, effect, progress);
        break;
      case 'unlock':
        this.renderUnlockEffect(ctx, effect, progress);
        break;
    }

    ctx.restore();
  }

  private renderWeaponSwapEffect(ctx: CanvasRenderingContext2D, effect: TransitionEffect, progress: number): void {
    const { x, y, data } = effect;
    const newWeaponType = data?.newWeaponType as WeaponSpriteType;
    const colors = WEAPON_COLORS[newWeaponType];

    // Círculo expandindo
    const radius = progress * 60;
    const alpha = 1 - progress;

    ctx.strokeStyle = colors.glow;
    ctx.lineWidth = 3 * (1 - progress);
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Flash central
    if (progress < 0.3) {
      const flashAlpha = 1 - (progress / 0.3);
      ctx.globalAlpha = flashAlpha * 0.5;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 20 * (1 - progress / 0.3), 0, Math.PI * 2);
      ctx.fill();
    }

    // Arcos girando
    ctx.globalAlpha = alpha * 0.7;
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const startAngle = progress * Math.PI * 4 + (i * Math.PI * 2 / 3);
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.7, startAngle, startAngle + Math.PI / 4);
      ctx.stroke();
    }
  }

  private renderAbilityEquipEffect(ctx: CanvasRenderingContext2D, effect: TransitionEffect, progress: number): void {
    const { x, y, data } = effect;
    const color = (data?.color as string) || '#00ffff';
    const slot = (data?.slot as string) || 'Q';

    // Hexágono aparecendo
    const size = 30 * Math.min(1, progress * 2);
    const alpha = progress < 0.5 ? 1 : 1 - ((progress - 0.5) * 2);

    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const px = x + Math.cos(angle) * size;
      const py = y + Math.sin(angle) * size;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.stroke();

    // Letra do slot
    ctx.fillStyle = color;
    ctx.font = `bold ${14 * Math.min(1, progress * 3)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(slot, x, y);

    // Brilho
    ctx.globalAlpha = alpha * 0.3;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderLevelUpEffect(ctx: CanvasRenderingContext2D, effect: TransitionEffect, progress: number): void {
    const { x, y } = effect;

    // Raios de luz
    ctx.globalAlpha = 1 - progress;
    const rays = 8;
    const rayLength = 50 + progress * 30;

    for (let i = 0; i < rays; i++) {
      const angle = (i / rays) * Math.PI * 2 + progress * Math.PI;
      const gradient = ctx.createLinearGradient(
        x, y,
        x + Math.cos(angle) * rayLength,
        y + Math.sin(angle) * rayLength
      );
      gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 4 * (1 - progress);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(
        x + Math.cos(angle) * rayLength,
        y + Math.sin(angle) * rayLength
      );
      ctx.stroke();
    }

    // Texto "LEVEL UP"
    if (progress > 0.2 && progress < 0.8) {
      const textProgress = (progress - 0.2) / 0.6;
      const textAlpha = textProgress < 0.5 ? textProgress * 2 : (1 - textProgress) * 2;
      const textY = y - 40 - textProgress * 20;

      ctx.globalAlpha = textAlpha;
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText('LEVEL UP!', x, textY);
      ctx.fillText('LEVEL UP!', x, textY);
    }
  }

  private renderUnlockEffect(ctx: CanvasRenderingContext2D, effect: TransitionEffect, progress: number): void {
    const { x, y, data } = effect;
    const itemType = (data?.itemType as string) || 'ability';

    const colors = {
      weapon: '#ff8800',
      ability: '#00aaff',
      passive: '#aa00ff',
    };
    const color = colors[itemType as keyof typeof colors] || colors.ability;

    // Cadeado abrindo
    const lockSize = 20;
    const openProgress = Math.min(1, progress * 2);
    const fadeProgress = progress > 0.5 ? (progress - 0.5) * 2 : 0;

    ctx.globalAlpha = 1 - fadeProgress;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;

    // Corpo do cadeado
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x - lockSize / 2, y - lockSize / 4, lockSize, lockSize * 0.75);
    ctx.strokeRect(x - lockSize / 2, y - lockSize / 4, lockSize, lockSize * 0.75);

    // Arco do cadeado (abrindo)
    ctx.beginPath();
    if (openProgress < 1) {
      ctx.arc(x, y - lockSize / 4, lockSize / 3, Math.PI, 0);
    } else {
      // Aberto - arco rotacionado
      ctx.save();
      ctx.translate(x + lockSize / 3, y - lockSize / 4);
      ctx.rotate(-Math.PI / 4);
      ctx.arc(0, 0, lockSize / 3, Math.PI, 0);
      ctx.restore();
    }
    ctx.stroke();

    // Brilho de desbloqueio
    if (progress > 0.3) {
      const glowProgress = (progress - 0.3) / 0.7;
      ctx.globalAlpha = (1 - glowProgress) * 0.5;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 30 * glowProgress, 0, Math.PI * 2);
      ctx.fill();
    }

    // Texto
    if (progress > 0.4) {
      const textAlpha = Math.min(1, (progress - 0.4) * 3) * (1 - fadeProgress);
      ctx.globalAlpha = textAlpha;
      ctx.fillStyle = color;
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('DESBLOQUEADO!', x, y + lockSize + 15);
    }
  }

  private renderParticle(ctx: CanvasRenderingContext2D, particle: FloatingParticle): void {
    const alpha = particle.life / particle.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;

    switch (particle.type) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'star':
        this.renderStarParticle(ctx, particle.x, particle.y, particle.size * alpha);
        break;

      case 'spark':
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        break;

      case 'rune':
        this.renderRuneParticle(ctx, particle.x, particle.y, particle.size, particle.color);
        break;
    }

    ctx.globalAlpha = 1;
  }

  private renderStarParticle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    const points = 4;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? size : size / 2;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      if (i === 0) {
        ctx.moveTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
      } else {
        ctx.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
      }
    }
    ctx.closePath();
    ctx.fill();
  }

  private renderRuneParticle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;

    // Círculo com cruz
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x - size * 0.6, y);
    ctx.lineTo(x + size * 0.6, y);
    ctx.moveTo(x, y - size * 0.6);
    ctx.lineTo(x, y + size * 0.6);
    ctx.stroke();
  }

  /**
   * Limpa todos os efeitos
   */
  clear(): void {
    this.effects = [];
    this.particles = [];
  }

  /**
   * Verifica se há efeitos ativos
   */
  hasActiveEffects(): boolean {
    return this.effects.length > 0 || this.particles.length > 0;
  }
}

// Singleton export
export const AnimationEffects = new AnimationEffectsClass();
