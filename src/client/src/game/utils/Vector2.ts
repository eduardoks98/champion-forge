/**
 * Classe utilitária para operações com vetores 2D
 * Reutilizável em todo o engine
 */
export class Vector2 {
  constructor(public x: number = 0, public y: number = 0) {}

  // Criar cópia
  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  // Definir valores
  set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  // Copiar de outro vetor
  copy(v: Vector2): this {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  // Adicionar
  add(v: Vector2): this {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  // Subtrair
  sub(v: Vector2): this {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  // Alias para sub (usado em alguns contextos)
  subtract(v: Vector2): this {
    return this.sub(v);
  }

  // Multiplicar por escalar
  scale(s: number): this {
    this.x *= s;
    this.y *= s;
    return this;
  }

  // Magnitude (comprimento)
  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  // Normalizar (tornar unitário)
  normalize(): this {
    const mag = this.magnitude();
    if (mag > 0) {
      this.x /= mag;
      this.y /= mag;
    }
    return this;
  }

  // Distância para outro vetor
  distanceTo(v: Vector2): number {
    const dx = v.x - this.x;
    const dy = v.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Direção para outro vetor (normalizada)
  directionTo(v: Vector2): Vector2 {
    const dx = v.x - this.x;
    const dy = v.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return new Vector2(0, 0);
    return new Vector2(dx / dist, dy / dist);
  }

  // Ângulo em radianos
  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  // Criar de ângulo e magnitude
  static fromAngle(angle: number, magnitude: number = 1): Vector2 {
    return new Vector2(
      Math.cos(angle) * magnitude,
      Math.sin(angle) * magnitude
    );
  }

  // Vetor zero
  static zero(): Vector2 {
    return new Vector2(0, 0);
  }

  // Vetor unitário (1, 0)
  static right(): Vector2 {
    return new Vector2(1, 0);
  }

  // Vetor unitário (0, 1)
  static down(): Vector2 {
    return new Vector2(0, 1);
  }

  // Interpolação linear
  static lerp(a: Vector2, b: Vector2, t: number): Vector2 {
    return new Vector2(
      a.x + (b.x - a.x) * t,
      a.y + (b.y - a.y) * t
    );
  }

  // Produto escalar (dot product)
  dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y;
  }

  // Limitar magnitude
  clampMagnitude(max: number): this {
    const mag = this.magnitude();
    if (mag > max) {
      this.normalize().scale(max);
    }
    return this;
  }
}
