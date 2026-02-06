// ==========================================
// GAME MAP - Mapa Estilo ARAM (Uma Lane)
// ==========================================

import { SIZES } from '../constants/timing';
import { getPathfindingGrid } from '../systems/PathfindingGrid';

/**
 * Tipos de obstáculos
 */
export type ObstacleType = 'rock' | 'wall' | 'tree' | 'water' | 'ruin' | 'pillar' | 'brush' | 'base';

/**
 * Interface para obstáculos
 */
export interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: ObstacleType;
  team?: 'blue' | 'red'; // Para bases
  blocksVision?: boolean; // Arbustos bloqueiam visão
}

/**
 * Cores dos obstáculos
 */
const OBSTACLE_COLORS: Record<ObstacleType, { fill: string; stroke: string }> = {
  rock: { fill: '#555555', stroke: '#333333' },
  wall: { fill: '#3a3a4a', stroke: '#252530' },
  tree: { fill: '#228833', stroke: '#115522' },
  water: { fill: '#3366aa', stroke: '#224488' },
  ruin: { fill: '#4a4a5a', stroke: '#2a2a3a' },
  pillar: { fill: '#5a5a6a', stroke: '#3a3a4a' },
  brush: { fill: '#2a5a2a', stroke: '#1a4a1a' },
  base: { fill: '#1a1a2e', stroke: '#3a3a5a' },
};

/**
 * Sistema de Mapa do Jogo - Layout ARAM
 */
export class GameMap {
  private obstacles: Obstacle[] = [];
  private obstacleIdCounter: number = 0;

  // Posições de spawn
  blueSpawn: { x: number; y: number } = { x: 200, y: SIZES.lane.centerY };
  redSpawn: { x: number; y: number } = { x: SIZES.arena.width - 200, y: SIZES.lane.centerY };

  constructor() {
    this.createARAMLayout();
  }

  /**
   * Cria o layout ARAM - Uma lane reta com bases nas pontas
   */
  private createARAMLayout(): void {
    const { width: mapWidth, height: mapHeight } = SIZES.arena;
    const { width: laneWidth, centerY } = SIZES.lane;

    // Calcular limites da lane
    const laneTop = centerY - laneWidth / 2;
    const laneBottom = centerY + laneWidth / 2;

    // ==========================================
    // PAREDES - Limitam a lane
    // ==========================================

    // Parede superior (acima da lane)
    this.addObstacle(0, 0, mapWidth, laneTop - 50, 'wall');

    // Parede inferior (abaixo da lane)
    this.addObstacle(0, laneBottom + 50, mapWidth, mapHeight - laneBottom - 50, 'wall');

    // ==========================================
    // BASES - Nas pontas
    // ==========================================

    // Base Azul (esquerda)
    this.addBase(0, centerY - 200, 300, 400, 'blue');

    // Base Vermelha (direita)
    this.addBase(mapWidth - 300, centerY - 200, 300, 400, 'red');

    // ==========================================
    // OBSTÁCULOS ESTRATÉGICOS NO MEIO
    // ==========================================

    // Ruína Central - Obstáculo no centro mas MENOR para permitir passagem
    // Lane tem 550px de largura, ruína precisa deixar espaço nas laterais
    const centerX = mapWidth / 2;
    // Ruína menor: 100x100 em vez de 120x160
    this.addObstacle(centerX - 50, centerY - 50, 100, 100, 'ruin');

    // Pilares laterais - Criam chokepoints
    // Pilar esquerdo (entre base azul e centro)
    this.addObstacle(1000, centerY - 50, 80, 100, 'pillar');

    // Pilar direito (entre centro e base vermelha)
    this.addObstacle(mapWidth - 1080, centerY - 50, 80, 100, 'pillar');

    // ==========================================
    // ARBUSTOS (BRUSH) - Escondem jogadores
    // ==========================================

    // Arbustos superiores
    this.addBrush(800, laneTop - 40, 200, 80);
    this.addBrush(centerX - 100, laneTop - 40, 200, 80);
    this.addBrush(mapWidth - 1000, laneTop - 40, 200, 80);

    // Arbustos inferiores
    this.addBrush(800, laneBottom - 40, 200, 80);
    this.addBrush(centerX - 100, laneBottom - 40, 200, 80);
    this.addBrush(mapWidth - 1000, laneBottom - 40, 200, 80);

    // ==========================================
    // ROCHAS DECORATIVAS
    // ==========================================

    // Rochas espalhadas pela lane
    this.addObstacle(600, centerY - 120, 40, 40, 'rock');
    this.addObstacle(1400, centerY + 80, 50, 45, 'rock');
    this.addObstacle(mapWidth - 1450, centerY - 100, 45, 50, 'rock');
    this.addObstacle(mapWidth - 650, centerY + 90, 40, 40, 'rock');

    // Registrar no pathfinding
    this.registerObstaclesInPathfinding();
  }

  /**
   * Adiciona um arbusto (brush) - área que esconde
   */
  private addBrush(x: number, y: number, width: number, height: number): Obstacle {
    const brush: Obstacle = {
      id: `brush-${this.obstacleIdCounter++}`,
      x,
      y,
      width,
      height,
      type: 'brush',
      blocksVision: true,
    };
    this.obstacles.push(brush);
    return brush;
  }

  /**
   * Adiciona uma base
   */
  private addBase(x: number, y: number, width: number, height: number, team: 'blue' | 'red'): Obstacle {
    const base: Obstacle = {
      id: `base-${team}`,
      x,
      y,
      width,
      height,
      type: 'base',
      team,
    };
    this.obstacles.push(base);
    return base;
  }

  /**
   * Adiciona um obstáculo ao mapa
   */
  addObstacle(x: number, y: number, width: number, height: number, type: ObstacleType): Obstacle {
    const obstacle: Obstacle = {
      id: `obstacle-${this.obstacleIdCounter++}`,
      x,
      y,
      width,
      height,
      type,
    };
    this.obstacles.push(obstacle);
    return obstacle;
  }

  /**
   * Remove um obstáculo do mapa
   */
  removeObstacle(id: string): void {
    const index = this.obstacles.findIndex(o => o.id === id);
    if (index !== -1) {
      this.obstacles.splice(index, 1);
    }
  }

  /**
   * Registra todos os obstáculos no PathfindingGrid
   * Margem baseada no raio do player para garantir passagem
   */
  registerObstaclesInPathfinding(): void {
    const grid = getPathfindingGrid();
    grid.clearObstacles();

    // Margem = raio do player (30px) para garantir que se A* encontra caminho, player passa
    const entityMargin = 30;

    for (const obs of this.obstacles) {
      // Arbustos NÃO bloqueiam movimento, só visão
      if (obs.type === 'brush') continue;

      // Bases não bloqueiam (spawn area)
      if (obs.type === 'base') continue;

      grid.blockRect(
        obs.x - entityMargin,
        obs.y - entityMargin,
        obs.width + entityMargin * 2,
        obs.height + entityMargin * 2
      );
    }
  }

  /**
   * Verifica se uma posição é walkable (não colide com obstáculos)
   */
  isWalkable(x: number, y: number, width: number, height: number): boolean {
    for (const obs of this.obstacles) {
      // Arbustos e bases não bloqueiam
      if (obs.type === 'brush' || obs.type === 'base') continue;

      if (this.rectsOverlap(x, y, width, height, obs.x, obs.y, obs.width, obs.height)) {
        return false;
      }
    }
    // Verificar limites da arena
    if (x < 0 || y < 0 || x + width > SIZES.arena.width || y + height > SIZES.arena.height) {
      return false;
    }
    return true;
  }

  /**
   * Tenta mover uma entidade e retorna a posição válida
   */
  tryMove(
    currentX: number,
    currentY: number,
    newX: number,
    newY: number,
    width: number,
    height: number
  ): { x: number; y: number } {
    let finalX = newX;
    if (!this.isWalkable(newX, currentY, width, height)) {
      finalX = currentX;
    }

    let finalY = newY;
    if (!this.isWalkable(finalX, newY, width, height)) {
      finalY = currentY;
    }

    if (!this.isWalkable(finalX, finalY, width, height)) {
      return { x: currentX, y: currentY };
    }

    return { x: finalX, y: finalY };
  }

  /**
   * Verifica se dois retângulos se sobrepõem
   */
  private rectsOverlap(
    x1: number, y1: number, w1: number, h1: number,
    x2: number, y2: number, w2: number, h2: number
  ): boolean {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }

  // ==========================================
  // COLISÃO CIRCULAR
  // ==========================================

  circleCollidesWithRect(
    circleX: number, circleY: number, radius: number,
    rectX: number, rectY: number, rectW: number, rectH: number
  ): boolean {
    const closestX = Math.max(rectX, Math.min(circleX, rectX + rectW));
    const closestY = Math.max(rectY, Math.min(circleY, rectY + rectH));
    const dx = circleX - closestX;
    const dy = circleY - closestY;
    return dx * dx + dy * dy < radius * radius;
  }

  isWalkableCircle(centerX: number, centerY: number, radius: number): boolean {
    for (const obs of this.obstacles) {
      if (obs.type === 'brush' || obs.type === 'base') continue;

      if (this.circleCollidesWithRect(centerX, centerY, radius, obs.x, obs.y, obs.width, obs.height)) {
        return false;
      }
    }
    if (centerX - radius < 0 || centerY - radius < 0 ||
        centerX + radius > SIZES.arena.width || centerY + radius > SIZES.arena.height) {
      return false;
    }
    return true;
  }

  tryMoveCircle(
    currentX: number, currentY: number,
    newX: number, newY: number,
    radius: number
  ): { x: number; y: number } {
    if (this.isWalkableCircle(newX, newY, radius)) {
      return { x: newX, y: newY };
    }

    let finalX = currentX;
    let finalY = currentY;

    if (this.isWalkableCircle(newX, currentY, radius)) {
      finalX = newX;
    }
    if (this.isWalkableCircle(finalX, newY, radius)) {
      finalY = newY;
    }

    return { x: finalX, y: finalY };
  }

  resolveCircleCollision(centerX: number, centerY: number, radius: number): { x: number; y: number } {
    let pushX = 0;
    let pushY = 0;

    for (const obs of this.obstacles) {
      if (obs.type === 'brush' || obs.type === 'base') continue;

      if (!this.circleCollidesWithRect(centerX, centerY, radius, obs.x, obs.y, obs.width, obs.height)) {
        continue;
      }

      const closestX = Math.max(obs.x, Math.min(centerX, obs.x + obs.width));
      const closestY = Math.max(obs.y, Math.min(centerY, obs.y + obs.height));
      const dx = centerX - closestX;
      const dy = centerY - closestY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0 && dist < radius) {
        const overlap = radius - dist;
        pushX += (dx / dist) * overlap;
        pushY += (dy / dist) * overlap;
      }
    }

    if (centerX - radius < 0) pushX += radius - centerX;
    if (centerY - radius < 0) pushY += radius - centerY;
    if (centerX + radius > SIZES.arena.width) pushX -= (centerX + radius) - SIZES.arena.width;
    if (centerY + radius > SIZES.arena.height) pushY -= (centerY + radius) - SIZES.arena.height;

    return { x: pushX, y: pushY };
  }

  /**
   * Verifica se uma entidade está dentro de um arbusto
   */
  isInBrush(x: number, y: number): boolean {
    for (const obs of this.obstacles) {
      if (obs.type !== 'brush') continue;
      if (x >= obs.x && x <= obs.x + obs.width && y >= obs.y && y <= obs.y + obs.height) {
        return true;
      }
    }
    return false;
  }

  getObstacles(): readonly Obstacle[] {
    return this.obstacles;
  }

  getBlueSpawn(): { x: number; y: number } {
    return { ...this.blueSpawn };
  }

  getRedSpawn(): { x: number; y: number } {
    return { ...this.redSpawn };
  }

  /**
   * Renderiza o mapa
   */
  render(ctx: CanvasRenderingContext2D): void {
    // Renderizar fundo do mapa (grama/chão)
    this.renderBackground(ctx);

    // Renderizar lane
    this.renderLane(ctx);

    // Renderizar obstáculos
    for (const obs of this.obstacles) {
      this.renderObstacle(ctx, obs);
    }
  }

  /**
   * Renderiza o fundo do mapa
   */
  private renderBackground(ctx: CanvasRenderingContext2D): void {
    // Gradiente de fundo
    const gradient = ctx.createLinearGradient(0, 0, SIZES.arena.width, 0);
    gradient.addColorStop(0, '#1a3a5a');    // Lado azul
    gradient.addColorStop(0.5, '#2a2a3a');  // Centro
    gradient.addColorStop(1, '#5a3a3a');    // Lado vermelho

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, SIZES.arena.width, SIZES.arena.height);
  }

  /**
   * Renderiza a lane central
   */
  private renderLane(ctx: CanvasRenderingContext2D): void {
    const { width: laneWidth, centerY } = SIZES.lane;
    const laneTop = centerY - laneWidth / 2;

    // Chão da lane (mais claro)
    ctx.fillStyle = '#3a3a4a';
    ctx.fillRect(0, laneTop, SIZES.arena.width, laneWidth);

    // Linhas de marcação da lane
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 20]);

    // Linha central
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(SIZES.arena.width, centerY);
    ctx.stroke();

    ctx.setLineDash([]);
  }

  /**
   * Renderiza um obstáculo individual
   */
  private renderObstacle(ctx: CanvasRenderingContext2D, obs: Obstacle): void {
    const colors = OBSTACLE_COLORS[obs.type];

    // Tratamento especial para diferentes tipos
    switch (obs.type) {
      case 'brush':
        this.renderBrush(ctx, obs);
        return;

      case 'base':
        this.renderBase(ctx, obs);
        return;

      case 'ruin':
        this.renderRuin(ctx, obs);
        return;

      default:
        // Sombra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(obs.x + 3, obs.y + 3, obs.width, obs.height);

        // Corpo
        ctx.fillStyle = colors.fill;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

        // Borda
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
    }
  }

  /**
   * Renderiza um arbusto
   */
  private renderBrush(ctx: CanvasRenderingContext2D, obs: Obstacle): void {
    // Fundo verde escuro semi-transparente
    ctx.fillStyle = 'rgba(30, 80, 30, 0.6)';
    ctx.beginPath();
    ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 10);
    ctx.fill();

    // Detalhes de folhagem
    ctx.fillStyle = 'rgba(50, 120, 50, 0.5)';
    const circles = 6;
    for (let i = 0; i < circles; i++) {
      const cx = obs.x + 20 + (i % 3) * (obs.width - 40) / 2;
      const cy = obs.y + 20 + Math.floor(i / 3) * (obs.height - 40);
      ctx.beginPath();
      ctx.arc(cx, cy, 15, 0, Math.PI * 2);
      ctx.fill();
    }

    // Borda pontilhada
    ctx.strokeStyle = 'rgba(100, 180, 100, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 10);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /**
   * Renderiza uma base
   */
  private renderBase(ctx: CanvasRenderingContext2D, obs: Obstacle): void {
    const isBlue = obs.team === 'blue';
    const baseColor = isBlue ? '#1a3a6a' : '#6a3a3a';
    const accentColor = isBlue ? '#3a6aaa' : '#aa6a6a';

    // Fundo da base
    ctx.fillStyle = baseColor;
    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

    // Padrão de piso
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1;
    const tileSize = 40;
    for (let x = obs.x; x < obs.x + obs.width; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, obs.y);
      ctx.lineTo(x, obs.y + obs.height);
      ctx.stroke();
    }
    for (let y = obs.y; y < obs.y + obs.height; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(obs.x, y);
      ctx.lineTo(obs.x + obs.width, y);
      ctx.stroke();
    }

    // Borda da base
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);

    // Texto do time
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      isBlue ? 'BLUE BASE' : 'RED BASE',
      obs.x + obs.width / 2,
      obs.y + obs.height / 2
    );
  }

  /**
   * Renderiza a ruína central
   */
  private renderRuin(ctx: CanvasRenderingContext2D, obs: Obstacle): void {
    // Sombra grande
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(obs.x + 5, obs.y + 5, obs.width, obs.height);

    // Corpo da ruína
    const gradient = ctx.createLinearGradient(obs.x, obs.y, obs.x, obs.y + obs.height);
    gradient.addColorStop(0, '#5a5a6a');
    gradient.addColorStop(1, '#3a3a4a');
    ctx.fillStyle = gradient;
    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

    // Detalhes de pedra quebrada
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;

    // Rachaduras
    ctx.beginPath();
    ctx.moveTo(obs.x + obs.width * 0.3, obs.y);
    ctx.lineTo(obs.x + obs.width * 0.4, obs.y + obs.height * 0.5);
    ctx.lineTo(obs.x + obs.width * 0.2, obs.y + obs.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(obs.x + obs.width * 0.7, obs.y);
    ctx.lineTo(obs.x + obs.width * 0.6, obs.y + obs.height * 0.6);
    ctx.lineTo(obs.x + obs.width * 0.8, obs.y + obs.height);
    ctx.stroke();

    // Borda
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 3;
    ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);

    // Texto decorativo
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('RUINS', obs.x + obs.width / 2, obs.y + obs.height / 2);
  }

  clear(): void {
    this.obstacles = [];
    this.obstacleIdCounter = 0;
  }
}

// ==========================================
// SINGLETON GLOBAL
// ==========================================

let globalGameMap: GameMap | null = null;

export function initializeGameMap(): GameMap {
  globalGameMap = new GameMap();
  return globalGameMap;
}

export function getGameMap(): GameMap {
  if (!globalGameMap) {
    globalGameMap = new GameMap();
  }
  return globalGameMap;
}
