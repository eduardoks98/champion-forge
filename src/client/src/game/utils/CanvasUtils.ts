/**
 * Utilitários para desenhar no Canvas
 * Reutilizável para qualquer entidade/efeito
 */

import { DEFAULT_CANVAS } from '../constants/gameDefaults';

// Desenhar círculo
export function drawCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  options: {
    fill?: string;
    stroke?: string;
    lineWidth?: number;
    glow?: string;
    glowBlur?: number;
  } = {}
): void {
  ctx.save();

  if (options.glow) {
    ctx.shadowColor = options.glow;
    ctx.shadowBlur = options.glowBlur ?? DEFAULT_CANVAS.GLOW_BLUR;
  }

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);

  if (options.fill) {
    ctx.fillStyle = options.fill;
    ctx.fill();
  }

  if (options.stroke) {
    ctx.strokeStyle = options.stroke;
    ctx.lineWidth = options.lineWidth ?? DEFAULT_CANVAS.LINE_WIDTH;
    ctx.stroke();
  }

  ctx.restore();
}

// Desenhar retângulo arredondado
export function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  options: {
    fill?: string;
    stroke?: string;
    lineWidth?: number;
    glow?: string;
    glowBlur?: number;
  } = {}
): void {
  ctx.save();

  if (options.glow) {
    ctx.shadowColor = options.glow;
    ctx.shadowBlur = options.glowBlur ?? DEFAULT_CANVAS.GLOW_BLUR;
  }

  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);

  if (options.fill) {
    ctx.fillStyle = options.fill;
    ctx.fill();
  }

  if (options.stroke) {
    ctx.strokeStyle = options.stroke;
    ctx.lineWidth = options.lineWidth ?? DEFAULT_CANVAS.LINE_WIDTH;
    ctx.stroke();
  }

  ctx.restore();
}

// Desenhar linha
export function drawLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options: {
    color?: string;
    width?: number;
    glow?: string;
    glowBlur?: number;
  } = {}
): void {
  ctx.save();

  if (options.glow) {
    ctx.shadowColor = options.glow;
    ctx.shadowBlur = options.glowBlur ?? DEFAULT_CANVAS.LINE_GLOW_BLUR;
  }

  ctx.strokeStyle = options.color ?? '#fff';
  ctx.lineWidth = options.width ?? DEFAULT_CANVAS.LINE_WIDTH;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.restore();
}

// Desenhar texto
export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: {
    color?: string;
    font?: string;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
    shadow?: boolean;
    shadowColor?: string;
    shadowBlur?: number;
  } = {}
): void {
  ctx.save();

  ctx.font = options.font ?? 'bold 16px Arial';
  ctx.fillStyle = options.color ?? '#fff';
  ctx.textAlign = options.align ?? 'center';
  ctx.textBaseline = options.baseline ?? 'middle';

  if (options.shadow) {
    ctx.shadowColor = options.shadowColor ?? 'black';
    ctx.shadowBlur = options.shadowBlur ?? DEFAULT_CANVAS.SHADOW_BLUR;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
  }

  ctx.fillText(text, x, y);

  ctx.restore();
}

// Criar gradiente radial
export function createRadialGradient(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  innerRadius: number,
  outerRadius: number,
  colors: [string, string] | [string, string, string]
): CanvasGradient {
  const gradient = ctx.createRadialGradient(x, y, innerRadius, x, y, outerRadius);

  if (colors.length === 2) {
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
  } else {
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.5, colors[1]);
    gradient.addColorStop(1, colors[2]);
  }

  return gradient;
}

// Desenhar barra de progresso (HP, mana, etc)
export function drawProgressBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  progress: number, // 0 a 1
  options: {
    bgColor?: string;
    fillColor?: string | [string, string];
    borderColor?: string;
    borderWidth?: number;
  } = {}
): void {
  ctx.save();

  // Background
  ctx.fillStyle = options.bgColor ?? '#333';
  ctx.fillRect(x, y, width, height);

  // Fill
  const fillWidth = width * Math.max(0, Math.min(1, progress));
  if (Array.isArray(options.fillColor)) {
    const gradient = ctx.createLinearGradient(x, y, x + width, y);
    gradient.addColorStop(0, options.fillColor[0]);
    gradient.addColorStop(1, options.fillColor[1]);
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = options.fillColor ?? '#27ae60';
  }
  ctx.fillRect(x, y, fillWidth, height);

  // Border
  if (options.borderColor) {
    ctx.strokeStyle = options.borderColor;
    ctx.lineWidth = options.borderWidth ?? DEFAULT_CANVAS.BORDER_WIDTH;
    ctx.strokeRect(x, y, width, height);
  }

  ctx.restore();
}

// Limpar canvas
export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color?: string
): void {
  if (color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }
}
