// ==========================================
// CAMERA SYSTEM - Pan e Zoom estilo MOBA
// ==========================================

export interface CameraConfig {
  worldWidth: number;
  worldHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}

export class Camera {
  // Posição no mundo (canto superior esquerdo do viewport)
  x: number = 0;
  y: number = 0;

  // Zoom (1.0 = normal, < 1 = zoom out, > 1 = zoom in)
  zoom: number = 1.0;
  minZoom: number = 0.5;
  maxZoom: number = 2.0;
  zoomSpeed: number = 0.1;

  // Limites do mundo
  worldWidth: number;
  worldHeight: number;

  // Viewport (tela visível)
  viewportWidth: number;
  viewportHeight: number;

  // Pan com mouse nas bordas
  edgePanSpeed: number = 8; // Reduzido para ser menos sensível
  edgePanZone: number = 40; // pixels da borda que ativam pan (reduzido)
  isPanning: boolean = false;

  // Seguir jogador (toggle com barra de espaço)
  followTarget: { x: number; y: number } | null = null;
  isFollowing: boolean = false;

  constructor(config: CameraConfig) {
    this.worldWidth = config.worldWidth;
    this.worldHeight = config.worldHeight;
    this.viewportWidth = config.viewportWidth;
    this.viewportHeight = config.viewportHeight;

    // Centralizar câmera no início
    this.centerOn(this.worldWidth / 2, this.worldHeight / 2);
  }

  /**
   * Atualiza a câmera baseado na posição do mouse
   * Chamado a cada frame
   */
  update(mouseX: number, mouseY: number): void {
    // Se está seguindo um alvo, centralizar nele
    if (this.isFollowing && this.followTarget) {
      this.centerOn(this.followTarget.x, this.followTarget.y);
      return;
    }

    // Pan com mouse nas bordas
    this.isPanning = false;

    // Borda esquerda
    if (mouseX < this.edgePanZone) {
      this.x -= this.edgePanSpeed / this.zoom;
      this.isPanning = true;
    }
    // Borda direita
    else if (mouseX > this.viewportWidth - this.edgePanZone) {
      this.x += this.edgePanSpeed / this.zoom;
      this.isPanning = true;
    }

    // Borda superior
    if (mouseY < this.edgePanZone) {
      this.y -= this.edgePanSpeed / this.zoom;
      this.isPanning = true;
    }
    // Borda inferior
    else if (mouseY > this.viewportHeight - this.edgePanZone) {
      this.y += this.edgePanSpeed / this.zoom;
      this.isPanning = true;
    }

    // Clamp para não sair do mundo
    this.clampPosition();
  }

  /**
   * Aplica zoom (scroll do mouse)
   */
  applyZoom(delta: number, mouseX: number, mouseY: number): void {
    const oldZoom = this.zoom;

    // Delta negativo = scroll up = zoom in
    // Delta positivo = scroll down = zoom out
    if (delta < 0) {
      this.zoom = Math.min(this.maxZoom, this.zoom + this.zoomSpeed);
    } else {
      this.zoom = Math.max(this.minZoom, this.zoom - this.zoomSpeed);
    }

    // Manter o ponto sob o mouse fixo após zoom
    // Converte posição do mouse para mundo antes e depois
    const worldBeforeX = this.x + mouseX / oldZoom;
    const worldBeforeY = this.y + mouseY / oldZoom;
    const worldAfterX = this.x + mouseX / this.zoom;
    const worldAfterY = this.y + mouseY / this.zoom;

    // Ajusta a posição da câmera para manter o ponto fixo
    this.x += worldBeforeX - worldAfterX;
    this.y += worldBeforeY - worldAfterY;

    this.clampPosition();
  }

  /**
   * Centraliza a câmera em um ponto do mundo
   */
  centerOn(worldX: number, worldY: number): void {
    // Calcula o tamanho visível do mundo com zoom atual
    const visibleWidth = this.viewportWidth / this.zoom;
    const visibleHeight = this.viewportHeight / this.zoom;

    this.x = worldX - visibleWidth / 2;
    this.y = worldY - visibleHeight / 2;

    this.clampPosition();
  }

  /**
   * Define um alvo para seguir
   */
  setFollowTarget(target: { x: number; y: number } | null): void {
    this.followTarget = target;
  }

  /**
   * Toggle seguir jogador
   */
  toggleFollow(): void {
    this.isFollowing = !this.isFollowing;
  }

  /**
   * Garante que a câmera não saia dos limites do mundo
   */
  private clampPosition(): void {
    const visibleWidth = this.viewportWidth / this.zoom;
    const visibleHeight = this.viewportHeight / this.zoom;

    // Não deixar ver além do mundo
    this.x = Math.max(0, Math.min(this.worldWidth - visibleWidth, this.x));
    this.y = Math.max(0, Math.min(this.worldHeight - visibleHeight, this.y));
  }

  /**
   * Converte coordenadas da tela para coordenadas do mundo
   */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: this.x + screenX / this.zoom,
      y: this.y + screenY / this.zoom,
    };
  }

  /**
   * Converte coordenadas do mundo para coordenadas da tela
   */
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: (worldX - this.x) * this.zoom,
      y: (worldY - this.y) * this.zoom,
    };
  }

  /**
   * Verifica se um ponto do mundo está visível na tela
   */
  isVisible(worldX: number, worldY: number, margin: number = 100): boolean {
    const visibleWidth = this.viewportWidth / this.zoom;
    const visibleHeight = this.viewportHeight / this.zoom;

    return (
      worldX >= this.x - margin &&
      worldX <= this.x + visibleWidth + margin &&
      worldY >= this.y - margin &&
      worldY <= this.y + visibleHeight + margin
    );
  }

  /**
   * Verifica se uma entidade está visível
   */
  isEntityVisible(entity: { x: number; y: number; width: number; height: number }): boolean {
    const visibleWidth = this.viewportWidth / this.zoom;
    const visibleHeight = this.viewportHeight / this.zoom;

    return (
      entity.x + entity.width >= this.x &&
      entity.x <= this.x + visibleWidth &&
      entity.y + entity.height >= this.y &&
      entity.y <= this.y + visibleHeight
    );
  }

  /**
   * Aplica transformação no contexto do canvas
   * Chamar antes de renderizar o mundo
   */
  applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x, -this.y);
  }

  /**
   * Restaura o contexto após renderizar o mundo
   * Chamar antes de renderizar UI (que não move com câmera)
   */
  resetTransform(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }

  /**
   * Atualiza tamanho do viewport (quando janela redimensiona)
   */
  resize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.clampPosition();
  }

  /**
   * Retorna informações de debug
   */
  getDebugInfo(): string {
    return `Camera: (${Math.round(this.x)}, ${Math.round(this.y)}) Zoom: ${this.zoom.toFixed(2)} Following: ${this.isFollowing}`;
  }
}
