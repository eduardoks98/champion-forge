// ==========================================
// VIEWPORT CULLING
// Só processa/renderiza entidades visíveis
// ==========================================

import { DEFAULT_SPATIAL } from '../constants/gameDefaults';

/**
 * Interface para entidades que podem ser culled
 */
export interface CullableEntity {
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
}

/**
 * Bounds da viewport
 */
export interface ViewportBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

/**
 * Sistema de Viewport Culling
 * Filtra entidades que estão fora da tela para não renderizá-las
 */
export class ViewportCulling {
  private bounds: ViewportBounds;
  private margin: number;

  /**
   * @param width Largura da viewport (canvas)
   * @param height Altura da viewport (canvas)
   * @param margin Margem extra para evitar pop-in (default: 100px)
   */
  constructor(width: number, height: number, margin: number = 100) {
    this.margin = margin;
    this.bounds = {
      left: 0,
      right: width,
      top: 0,
      bottom: height,
      width,
      height,
      centerX: width / 2,
      centerY: height / 2
    };
  }

  /**
   * Atualiza a viewport (quando a câmera move ou o canvas redimensiona)
   * @param cameraX Posição X da câmera (canto superior esquerdo)
   * @param cameraY Posição Y da câmera (canto superior esquerdo)
   * @param width Nova largura (opcional)
   * @param height Nova altura (opcional)
   */
  update(cameraX: number, cameraY: number, width?: number, height?: number): void {
    if (width !== undefined) this.bounds.width = width;
    if (height !== undefined) this.bounds.height = height;

    this.bounds.left = cameraX;
    this.bounds.right = cameraX + this.bounds.width;
    this.bounds.top = cameraY;
    this.bounds.bottom = cameraY + this.bounds.height;
    this.bounds.centerX = cameraX + this.bounds.width / 2;
    this.bounds.centerY = cameraY + this.bounds.height / 2;
  }

  /**
   * Verifica se uma entidade está visível na viewport
   */
  isVisible(entity: CullableEntity, extraMargin: number = 0): boolean {
    const totalMargin = this.margin + extraMargin;
    const entityRadius = entity.radius ?? (Math.max(entity.width ?? 0, entity.height ?? 0) / 2 || DEFAULT_SPATIAL.ENTITY_RADIUS);

    return (
      entity.x + entityRadius > this.bounds.left - totalMargin &&
      entity.x - entityRadius < this.bounds.right + totalMargin &&
      entity.y + entityRadius > this.bounds.top - totalMargin &&
      entity.y - entityRadius < this.bounds.bottom + totalMargin
    );
  }

  /**
   * Verifica se um ponto está visível na viewport
   */
  isPointVisible(x: number, y: number, extraMargin: number = 0): boolean {
    const totalMargin = this.margin + extraMargin;

    return (
      x > this.bounds.left - totalMargin &&
      x < this.bounds.right + totalMargin &&
      y > this.bounds.top - totalMargin &&
      y < this.bounds.bottom + totalMargin
    );
  }

  /**
   * Verifica se um retângulo está visível na viewport
   */
  isRectVisible(x: number, y: number, width: number, height: number, extraMargin: number = 0): boolean {
    const totalMargin = this.margin + extraMargin;

    return (
      x + width > this.bounds.left - totalMargin &&
      x < this.bounds.right + totalMargin &&
      y + height > this.bounds.top - totalMargin &&
      y < this.bounds.bottom + totalMargin
    );
  }

  /**
   * Filtra um array de entidades, retornando apenas as visíveis
   */
  filterVisible<T extends CullableEntity>(entities: T[], extraMargin: number = 0): T[] {
    return entities.filter(entity => this.isVisible(entity, extraMargin));
  }

  /**
   * Calcula a distância do centro da viewport até uma entidade
   */
  distanceFromCenter(entity: CullableEntity): number {
    const dx = entity.x - this.bounds.centerX;
    const dy = entity.y - this.bounds.centerY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calcula a distância normalizada (0-1) do centro da viewport
   * 0 = no centro, 1 = na borda
   */
  normalizedDistanceFromCenter(entity: CullableEntity): number {
    const maxDist = Math.sqrt(
      (this.bounds.width / 2) ** 2 + (this.bounds.height / 2) ** 2
    );
    return Math.min(1, this.distanceFromCenter(entity) / maxDist);
  }

  /**
   * Retorna o nível de detalhe (LOD) baseado na distância
   * 0 = alta qualidade (perto), 1 = média, 2 = baixa (longe)
   */
  getLODLevel(entity: CullableEntity): number {
    const normalizedDist = this.normalizedDistanceFromCenter(entity);

    if (normalizedDist < 0.4) return 0; // Alta qualidade
    if (normalizedDist < 0.7) return 1; // Média qualidade
    return 2; // Baixa qualidade
  }

  /**
   * Verifica se a entidade está muito longe para atualizar AI
   * Entidades fora de um raio maior ainda renderizam, mas AI não atualiza
   */
  shouldUpdateAI(entity: CullableEntity, aiUpdateRadius: number = 500): boolean {
    const dx = entity.x - this.bounds.centerX;
    const dy = entity.y - this.bounds.centerY;
    return dx * dx + dy * dy <= aiUpdateRadius * aiUpdateRadius;
  }

  /**
   * Retorna os bounds atuais
   */
  getBounds(): ViewportBounds {
    return { ...this.bounds };
  }

  /**
   * Retorna a margem atual
   */
  getMargin(): number {
    return this.margin;
  }

  /**
   * Define a margem
   */
  setMargin(margin: number): void {
    this.margin = margin;
  }

  /**
   * Debug: desenha os bounds da viewport
   */
  debugDraw(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Área visível
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      this.bounds.left,
      this.bounds.top,
      this.bounds.width,
      this.bounds.height
    );

    // Área com margem
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      this.bounds.left - this.margin,
      this.bounds.top - this.margin,
      this.bounds.width + this.margin * 2,
      this.bounds.height + this.margin * 2
    );

    // Centro
    ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.beginPath();
    ctx.arc(this.bounds.centerX, this.bounds.centerY, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ==========================================
// VIEWPORT GLOBAL
// ==========================================

let viewport: ViewportCulling | null = null;

/**
 * Inicializa a viewport global
 */
export function initializeViewport(width: number, height: number, margin: number = 100): ViewportCulling {
  viewport = new ViewportCulling(width, height, margin);
  console.log('[ViewportCulling] Viewport initialized:', { width, height, margin });
  return viewport;
}

/**
 * Retorna a viewport global
 */
export function getViewport(): ViewportCulling {
  if (!viewport) {
    // Default para 800x600 se não inicializado
    viewport = new ViewportCulling(800, 600, 100);
  }
  return viewport;
}
