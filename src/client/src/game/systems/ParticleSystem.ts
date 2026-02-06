// ==========================================
// PARTICLE SYSTEM (OTIMIZADO COM OBJECT POOL)
// ==========================================

import { COLORS } from '../constants/colors';
import { getParticlePool, PoolableParticle } from './ObjectPool';

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

// Presets de partículas - MÍNIMOS para performance máxima
export const PARTICLE_PRESETS: Record<string, ParticleConfig> = {
  fire: { color: '#ff6b00', count: 2, spread: 2, size: 4, life: 15, gravity: -0.1, glow: false },
  ice: { color: '#00d9ff', count: 2, spread: 2, size: 3, life: 12, gravity: 0, glow: false },
  lightning: { color: '#ffff00', count: 2, spread: 3, size: 3, life: 8, glow: false },
  blood: { color: '#e74c3c', count: 2, spread: 4, size: 4, life: 15, gravity: 0.2 },
  heal: { color: '#2ecc71', count: 2, spread: 2, size: 3, life: 15, direction: 'up', glow: false },
  magic: { color: '#9b59b6', count: 2, spread: 2, size: 4, life: 15, glow: false },
  spark: { color: '#f39c12', count: 1, spread: 3, size: 3, life: 10 },
  death: { color: '#e74c3c', count: 2, spread: 4, size: 4, life: 15, gravity: 0.15 },
};

// Limite de partículas ativas (para evitar lag)
const MAX_ACTIVE_PARTICLES = 500;

export class ParticleSystem {
  private pool = getParticlePool();

  // Emitir partículas usando pool
  emit(x: number, y: number, config: ParticleConfig | string): void {
    // OTIMIZAÇÃO: Skip se já tem muitas partículas
    if (this.pool.getActiveCount() >= MAX_ACTIVE_PARTICLES) {
      return;
    }

    const cfg = typeof config === 'string' ? PARTICLE_PRESETS[config] : config;
    if (!cfg) return;

    const count = cfg.count ?? 10;
    const spread = cfg.spread ?? 3;
    const size = cfg.size ?? 5;
    const life = cfg.life ?? 30;
    const gravity = cfg.gravity ?? 0;
    const color = cfg.color ?? COLORS.spark;

    for (let i = 0; i < count; i++) {
      const particle = this.pool.acquire();
      if (!particle) break; // Pool cheio

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

      // Configura a partícula do pool
      particle.x = x;
      particle.y = y;
      particle.vx = vx;
      particle.vy = vy;
      particle.size = size + Math.random() * 2;
      particle.color = color;
      particle.life = life;
      particle.maxLife = life;
      particle.gravity = gravity;
      particle.shrink = cfg.shrink !== false;
      particle.glow = cfg.glow ?? false;
    }
  }

  // Emitir burst de partículas (explosão)
  // OTIMIZADO: Limita bursts quando há muita ação
  burst(x: number, y: number, preset: string, multiplier: number = 1): void {
    const activeCount = this.pool.getActiveCount();

    // Skip completamente se já tem muitas partículas
    if (activeCount > 300) {
      return;
    }

    // Reduz multiplier se está ficando cheio
    if (activeCount > 150) {
      multiplier *= 0.5;
    }

    const cfg = PARTICLE_PRESETS[preset];
    if (!cfg) return;

    this.emit(x, y, {
      ...cfg,
      count: Math.ceil((cfg.count ?? 2) * multiplier),
      spread: (cfg.spread ?? 3) * 1.5,
    });
  }

  // Atualizar todas as partículas
  update(_deltaTime: number): void {
    const toRelease: PoolableParticle[] = [];

    this.pool.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.life--;

      if (p.life <= 0) {
        toRelease.push(p);
      }
    });

    // Libera partículas mortas de volta ao pool
    for (const p of toRelease) {
      this.pool.release(p);
    }
  }

  // Renderizar todas as partículas (OTIMIZADO - sem shadowBlur)
  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    this.pool.forEach((p) => {
      const alpha = p.life / p.maxLife;
      const size = p.shrink ? p.size * alpha : p.size;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  // Obter contagem de partículas ativas
  get count(): number {
    return this.pool.getActiveCount();
  }

  // Limpar todas as partículas
  clear(): void {
    this.pool.releaseAll();
  }
}

// Re-exporta Particle interface para compatibilidade
export type Particle = PoolableParticle;
