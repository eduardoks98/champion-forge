/**
 * Utilitários matemáticos reutilizáveis
 */

// Limitar valor entre min e max
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Interpolação linear
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Mapear valor de um range para outro
export function map(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

// Número aleatório entre min e max
export function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// Número aleatório inteiro entre min e max (inclusive)
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Escolher item aleatório de array
export function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Graus para radianos
export function degToRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Radianos para graus
export function radToDeg(rad: number): number {
  return rad * (180 / Math.PI);
}

// Distância entre dois pontos
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

// Ângulo entre dois pontos
export function angleBetween(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1);
}

// Ease in out (suavização)
export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// Ease out (desaceleração)
export function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// Ease in (aceleração)
export function easeIn(t: number): number {
  return t * t * t;
}

// Normalizar ângulo para [-PI, PI]
export function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

// Verificar se ponto está dentro de retângulo
export function pointInRect(
  px: number,
  py: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

// Verificar se ponto está dentro de círculo
export function pointInCircle(
  px: number,
  py: number,
  cx: number,
  cy: number,
  radius: number
): boolean {
  return distance(px, py, cx, cy) <= radius;
}

// Colisão círculo-círculo
export function circleCollision(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number
): boolean {
  return distance(x1, y1, x2, y2) < r1 + r2;
}

// Colisão retângulo-retângulo
export function rectCollision(
  x1: number,
  y1: number,
  w1: number,
  h1: number,
  x2: number,
  y2: number,
  w2: number,
  h2: number
): boolean {
  return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}
