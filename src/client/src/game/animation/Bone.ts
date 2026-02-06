// ==========================================
// BONE - Sistema de ossos para animacao procedural
// ==========================================

import { Vector2 } from '../utils/Vector2';

/**
 * Constraints de rotacao para um bone
 */
export interface BoneConstraints {
  minAngle: number;  // Angulo minimo (radianos)
  maxAngle: number;  // Angulo maximo (radianos)
}

/**
 * Representa um osso individual no esqueleto
 */
export class Bone {
  readonly name: string;
  length: number;
  angle: number;           // Rotacao local (radianos)
  baseAngle: number;       // Angulo de repouso
  thickness: number;       // Espessura para renderizacao
  color: string;

  parent: Bone | null = null;
  children: Bone[] = [];
  constraints: BoneConstraints | null = null;

  // Posicoes calculadas (world space)
  private _worldStart: Vector2 = new Vector2(0, 0);
  private _worldEnd: Vector2 = new Vector2(0, 0);
  private _worldAngle: number = 0;

  constructor(
    name: string,
    length: number,
    baseAngle: number = 0,
    thickness: number = 4,
    color: string = '#ffffff'
  ) {
    this.name = name;
    this.length = length;
    this.baseAngle = baseAngle;
    this.angle = 0; // Offset do baseAngle
    this.thickness = thickness;
    this.color = color;
  }

  /**
   * Define constraints de rotacao
   */
  setConstraints(minAngle: number, maxAngle: number): this {
    this.constraints = { minAngle, maxAngle };
    return this;
  }

  /**
   * Adiciona um bone filho
   */
  addChild(child: Bone): this {
    child.parent = this;
    this.children.push(child);
    return this;
  }

  /**
   * Retorna o angulo total (base + offset)
   */
  getTotalAngle(): number {
    return this.baseAngle + this.angle;
  }

  /**
   * Aplica constraints ao angulo
   */
  clampAngle(): void {
    if (this.constraints) {
      const total = this.getTotalAngle();
      const clamped = Math.max(
        this.constraints.minAngle,
        Math.min(this.constraints.maxAngle, total)
      );
      this.angle = clamped - this.baseAngle;
    }
  }

  /**
   * Calcula posicoes world space (chamado apos updateWorldTransform do Skeleton)
   */
  updateWorldPositions(parentEnd: Vector2, parentWorldAngle: number): void {
    this._worldStart = parentEnd.clone();
    this._worldAngle = parentWorldAngle + this.getTotalAngle();

    // Calcular posicao final do bone
    this._worldEnd = new Vector2(
      this._worldStart.x + Math.cos(this._worldAngle) * this.length,
      this._worldStart.y + Math.sin(this._worldAngle) * this.length
    );

    // Atualizar filhos recursivamente
    for (const child of this.children) {
      child.updateWorldPositions(this._worldEnd, this._worldAngle);
    }
  }

  /**
   * Getters para posicoes world space
   */
  get worldStart(): Vector2 {
    return this._worldStart;
  }

  get worldEnd(): Vector2 {
    return this._worldEnd;
  }

  get worldAngle(): number {
    return this._worldAngle;
  }

  /**
   * Ponto medio do bone (util para renderizar corpo)
   */
  get worldCenter(): Vector2 {
    return new Vector2(
      (this._worldStart.x + this._worldEnd.x) / 2,
      (this._worldStart.y + this._worldEnd.y) / 2
    );
  }

  /**
   * Reseta angulo para posicao de repouso
   */
  reset(): void {
    this.angle = 0;
  }

  /**
   * Lerp do angulo para um target
   */
  lerpAngle(targetAngle: number, t: number): void {
    this.angle = this.angle + (targetAngle - this.angle) * t;
  }

  /**
   * Smooth damp (frame-rate independent)
   * current = lerp(current, target, 1 - exp(-speed * deltaTime))
   * @param deltaTime em segundos
   */
  smoothDampAngle(targetAngle: number, speed: number, deltaTime: number): void {
    const t = 1 - Math.exp(-speed * deltaTime); // deltaTime em segundos
    this.lerpAngle(targetAngle, t);
  }
}
