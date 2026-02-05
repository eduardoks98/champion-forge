import { COLORS } from '../constants/colors';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  gravity: number;
  shrink: boolean;
  glow: boolean;
}

export interface ParticleConfig {
  color?: string;
  count?: number;
  spread?: number;
  size?: number;
  life?: number;
  gravity?: number;
  shrink?: boolean;
  glow?: boolean;
  direction?: 'up' | 'down' | 'left' | 'right' | 'radial';
}

// Presets de partículas
export const PARTICLE_PRESETS: Record<string, ParticleConfig> = {
  fire: { color: '#ff6b00', count: 20, spread: 3, size: 5, life: 30, gravity: -0.1, glow: true },
  ice: { color: '#00d9ff', count: 15, spread: 2, size: 4, life: 25, gravity: 0, glow: true },
  lightning: { color: '#ffff00', count: 10, spread: 4, size: 3, life: 15, glow: true },
  blood: { color: '#e74c3c', count: 10, spread: 5, size: 6, life: 40, gravity: 0.2 },
  heal: { color: '#2ecc71', count: 15, spread: 2, size: 4, life: 35, direction: 'up', glow: true },
  magic: { color: '#9b59b6', count: 12, spread: 3, size: 5, life: 30, glow: true },
  spark: { color: '#f39c12', count: 8, spread: 4, size: 3, life: 20 },
  death: { color: '#e74c3c', count: 15, spread: 5, size: 5, life: 35, gravity: 0.15 },
};

export class ParticleSystem {
  private particles: Particle[] = [];

  // Emitir partículas
  emit(x: number, y: number, config: ParticleConfig | string): void {
    const cfg = typeof config === 'string' ? PARTICLE_PRESETS[config] : config;
    if (!cfg) return;

    const count = cfg.count ?? 10;
    const spread = cfg.spread ?? 3;
    const size = cfg.size ?? 5;
    const life = cfg.life ?? 30;
    const gravity = cfg.gravity ?? 0;
    const color = cfg.color ?? COLORS.spark;

    for (let i = 0; i < count; i++) {
      let vx: number, vy: number;

      switch (cfg.direction) {
        case 'up':
          vx = (Math.random() - 0.5) * spread;
          vy = -Math.random() * spread - 1;
          break;
        case 'down':
          vx = (Math.random() - 0.5) * spread;
          vy = Math.random() * spread + 1;
          break;
        case 'left':
          vx = -Math.random() * spread - 1;
          vy = (Math.random() - 0.5) * spread;
          break;
        case 'right':
          vx = Math.random() * spread + 1;
          vy = (Math.random() - 0.5) * spread;
          break;
        default: // radial
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * spread;
          vx = Math.cos(angle) * speed;
          vy = Math.sin(angle) * speed;
      }

      this.particles.push({
        x,
        y,
        vx,
        vy,
        size: size + Math.random() * 2,
        color,
        life,
        maxLife: life,
        gravity,
        shrink: cfg.shrink !== false,
        glow: cfg.glow ?? false,
      });
    }
  }

  // Emitir burst de partículas (explosão)
  burst(x: number, y: number, preset: string, multiplier: number = 1): void {
    const cfg = PARTICLE_PRESETS[preset];
    if (!cfg) return;

    this.emit(x, y, {
      ...cfg,
      count: (cfg.count ?? 10) * multiplier,
      spread: (cfg.spread ?? 3) * 1.5,
    });
  }

  // Atualizar todas as partículas
  update(_deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.life--;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  // Renderizar todas as partículas
  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      const size = p.shrink ? p.size * alpha : p.size;

      ctx.save();
      ctx.globalAlpha = alpha;

      if (p.glow) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
      }

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // Obter contagem de partículas
  get count(): number {
    return this.particles.length;
  }

  // Limpar todas as partículas
  clear(): void {
    this.particles = [];
  }
}
