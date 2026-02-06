// ==========================================
// DAMAGE NUMBER SYSTEM (OTIMIZADO COM OBJECT POOL)
// ==========================================

import { COLORS } from '../constants/colors';
import { TIMING } from '../constants/timing';
import { getDamageNumberPool, PoolableDamageNumber } from './ObjectPool';

export type DamageType = 'physical' | 'magic' | 'crit' | 'heal' | 'shield';

// Limite de números de dano visíveis (evita lag com 500+ hits)
const MAX_VISIBLE_DAMAGE_NUMBERS = 30;

export class DamageNumberSystem {
  private pool = getDamageNumberPool();

  // Mostrar número de dano usando pool
  show(x: number, y: number, amount: number, type: DamageType): void {
    // OTIMIZAÇÃO: Skip se já tem muitos números
    if (this.pool.getActiveCount() >= MAX_VISIBLE_DAMAGE_NUMBERS) {
      return;
    }

    const num = this.pool.acquire();
    if (!num) return; // Pool cheio

    num.x = x + (Math.random() - 0.5) * 20;
    num.y = y;
    num.value = amount;
    num.life = TIMING.damageFloat;
    num.maxLife = TIMING.damageFloat;
    num.vy = -1;

    // Configurar baseado no tipo
    switch (type) {
      case 'physical':
        num.color = COLORS.damagePhysical;
        num.isCrit = false;
        num.scale = 1;
        break;
      case 'magic':
        num.color = COLORS.damageMagic;
        num.isCrit = false;
        num.scale = 1;
        break;
      case 'crit':
        num.color = COLORS.damageCrit;
        num.isCrit = true;
        num.scale = 1.3;
        break;
      case 'heal':
        num.color = COLORS.damageHeal;
        num.isCrit = false;
        num.scale = 1;
        break;
      case 'shield':
        num.color = '#00ccff';
        num.isCrit = false;
        num.scale = 1;
        break;
    }
  }

  // Atualizar
  update(deltaTime: number): void {
    const toRelease: PoolableDamageNumber[] = [];

    this.pool.forEach((num) => {
      num.life -= deltaTime;
      num.y += num.vy; // Flutuar para cima

      if (num.life <= 0) {
        toRelease.push(num);
      }
    });

    // Liberar de volta ao pool
    for (const num of toRelease) {
      this.pool.release(num);
    }
  }

  // Renderizar - OTIMIZADO (sem shadowBlur)
  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.textAlign = 'center';

    this.pool.forEach((num) => {
      const progress = num.life / num.maxLife;
      const alpha = progress;
      const scale = 0.8 + (1 - progress) * 0.4;

      ctx.globalAlpha = alpha;

      // Texto com outline ao invés de shadow (mais performático)
      const fontSize = num.isCrit ? 24 : 18;
      ctx.font = `bold ${fontSize * scale}px Arial`;

      // Outline preto (mais leve que shadowBlur)
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(`${num.isCrit ? '' : '-'}${num.value}`, num.x, num.y);

      // Texto colorido
      ctx.fillStyle = num.color;
      ctx.fillText(`${num.isCrit ? '' : '-'}${num.value}`, num.x, num.y);

      // CRIT! text
      if (num.isCrit) {
        ctx.font = `bold ${12 * scale}px Arial`;
        ctx.strokeText('CRIT!', num.x, num.y - 20);
        ctx.fillText('CRIT!', num.x, num.y - 20);
      }
    });

    ctx.restore();
  }

  // Limpar
  clear(): void {
    this.pool.releaseAll();
  }

  // Contagem de números ativos
  get count(): number {
    return this.pool.getActiveCount();
  }
}
