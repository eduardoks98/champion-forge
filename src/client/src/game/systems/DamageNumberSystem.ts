import { COLORS } from '../constants/colors';
import { TIMING } from '../constants/timing';

export type DamageType = 'physical' | 'magic' | 'crit' | 'heal' | 'shield';

interface DamageNumber {
  x: number;
  y: number;
  amount: number;
  type: DamageType;
  life: number;
  maxLife: number;
}

export class DamageNumberSystem {
  private numbers: DamageNumber[] = [];

  // Mostrar número de dano
  show(x: number, y: number, amount: number, type: DamageType): void {
    this.numbers.push({
      x: x + (Math.random() - 0.5) * 20,
      y,
      amount,
      type,
      life: TIMING.damageFloat,
      maxLife: TIMING.damageFloat,
    });
  }

  // Atualizar
  update(deltaTime: number): void {
    for (let i = this.numbers.length - 1; i >= 0; i--) {
      const num = this.numbers[i];
      num.life -= deltaTime;
      num.y -= 1; // Flutuar para cima

      if (num.life <= 0) {
        this.numbers.splice(i, 1);
      }
    }
  }

  // Renderizar
  render(ctx: CanvasRenderingContext2D): void {
    for (const num of this.numbers) {
      const progress = num.life / num.maxLife;
      const alpha = progress;
      const scale = 0.8 + (1 - progress) * 0.4; // Cresce um pouco

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(num.x, num.y);
      ctx.scale(scale, scale);

      // Cor baseada no tipo
      let color: string;
      let fontSize = 18;
      let prefix = '-';

      switch (num.type) {
        case 'physical':
          color = COLORS.damagePhysical;
          break;
        case 'magic':
          color = COLORS.damageMagic;
          break;
        case 'crit':
          color = COLORS.damageCrit;
          fontSize = 24;
          break;
        case 'heal':
          color = COLORS.damageHeal;
          prefix = '+';
          break;
        case 'shield':
          color = '#00ccff';
          prefix = '';
          break;
      }

      // Sombra
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      // Texto
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.fillText(`${prefix}${num.amount}`, 0, 0);

      // CRIT! text
      if (num.type === 'crit') {
        ctx.font = 'bold 12px Arial';
        ctx.fillText('CRIT!', 0, -20);
      }

      // BLOCKED text for shield
      if (num.type === 'shield') {
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#00ccff';
        ctx.fillText('BLOCKED', 0, 0);
      }

      ctx.restore();
    }
  }

  // Limpar
  clear(): void {
    this.numbers = [];
  }
}
