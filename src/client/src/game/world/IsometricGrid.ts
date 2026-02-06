// ==========================================
// ISOMETRIC GRID
// Sistema de grid isometrico com conversoes
// ==========================================

import { Vector2 } from '../utils/Vector2';

/**
 * Tipos de terreno
 */
export enum TerrainType {
  GRASS = 'grass',
  STONE = 'stone',
  WATER = 'water',
  SAND = 'sand',
  VOID = 'void',
}

/**
 * Configuracao de terreno
 */
export interface TerrainConfig {
  /** Se pode andar */
  walkable: boolean;

  /** Custo de movimento (para pathfinding) */
  movementCost: number;

  /** Cor base do tile */
  color: string;

  /** Cor escura (lateral) */
  darkColor: string;

  /** Cor clara (highlight) */
  lightColor: string;
}

/**
 * Celula do grid
 */
export interface GridCell {
  /** Posicao X no grid */
  gridX: number;

  /** Posicao Y no grid */
  gridY: number;

  /** Tipo de terreno */
  terrain: TerrainType;

  /** Se pode andar */
  walkable: boolean;

  /** Custo de movimento */
  cost: number;

  /** Elevacao (para efeitos visuais) */
  elevation: number;

  /** Entidade ocupando a celula (opcional) */
  occupiedBy?: string;
}

/**
 * Configuracao do grid
 */
export interface GridConfig {
  /** Largura em tiles */
  width: number;

  /** Altura em tiles */
  height: number;

  /** Largura do tile em pixels */
  tileWidth: number;

  /** Altura do tile em pixels (metade para isometrico 2:1) */
  tileHeight: number;

  /** Offset X para centralizar */
  offsetX?: number;

  /** Offset Y para centralizar */
  offsetY?: number;
}

/**
 * Configuracoes de terreno
 */
const TERRAIN_CONFIGS: Record<TerrainType, TerrainConfig> = {
  [TerrainType.GRASS]: {
    walkable: true,
    movementCost: 1,
    color: '#4a7c3f',
    darkColor: '#3a6432',
    lightColor: '#5a9c4f',
  },
  [TerrainType.STONE]: {
    walkable: true,
    movementCost: 1,
    color: '#808080',
    darkColor: '#606060',
    lightColor: '#a0a0a0',
  },
  [TerrainType.WATER]: {
    walkable: false,
    movementCost: Infinity,
    color: '#4a90d9',
    darkColor: '#3a7bc4',
    lightColor: '#5ba3e0',
  },
  [TerrainType.SAND]: {
    walkable: true,
    movementCost: 1.5,
    color: '#c8b060',
    darkColor: '#a89040',
    lightColor: '#e8d080',
  },
  [TerrainType.VOID]: {
    walkable: false,
    movementCost: Infinity,
    color: '#1a1a2e',
    darkColor: '#0f0f1a',
    lightColor: '#2a2a4e',
  },
};

/**
 * Grid isometrico
 *
 * Sistema de coordenadas:
 * - gridX aumenta para direita-baixo
 * - gridY aumenta para esquerda-baixo
 *
 * Projecao isometrica 2:1:
 * screenX = (gridX - gridY) * (tileWidth / 2) + offsetX
 * screenY = (gridX + gridY) * (tileHeight / 2) + offsetY
 */
export class IsometricGrid {
  private cells: GridCell[][] = [];
  private config: Required<GridConfig>;

  constructor(config: GridConfig) {
    this.config = {
      offsetX: 0,
      offsetY: 0,
      ...config,
    };

    this.initializeGrid();
  }

  /**
   * Inicializa o grid com terreno padrao
   */
  private initializeGrid(): void {
    for (let y = 0; y < this.config.height; y++) {
      this.cells[y] = [];
      for (let x = 0; x < this.config.width; x++) {
        this.cells[y][x] = {
          gridX: x,
          gridY: y,
          terrain: TerrainType.GRASS,
          walkable: true,
          cost: 1,
          elevation: 0,
        };
      }
    }
  }

  // ==========================================
  // CONVERSAO DE COORDENADAS
  // ==========================================

  /**
   * Converte coordenadas do grid para tela (isometrico)
   */
  gridToScreen(gridX: number, gridY: number): Vector2 {
    const screenX = (gridX - gridY) * (this.config.tileWidth / 2) + this.config.offsetX;
    const screenY = (gridX + gridY) * (this.config.tileHeight / 2) + this.config.offsetY;
    return new Vector2(screenX, screenY);
  }

  /**
   * Converte coordenadas da tela para grid
   */
  screenToGrid(screenX: number, screenY: number): Vector2 {
    // Remover offset
    const sx = screenX - this.config.offsetX;
    const sy = screenY - this.config.offsetY;

    // Inversao da projecao isometrica
    const gridX = (sx / (this.config.tileWidth / 2) + sy / (this.config.tileHeight / 2)) / 2;
    const gridY = (sy / (this.config.tileHeight / 2) - sx / (this.config.tileWidth / 2)) / 2;

    return new Vector2(gridX, gridY);
  }

  /**
   * Converte coordenadas de tela para celula do grid (inteiros)
   */
  screenToCell(screenX: number, screenY: number): { x: number; y: number } | null {
    const grid = this.screenToGrid(screenX, screenY);
    const cellX = Math.floor(grid.x);
    const cellY = Math.floor(grid.y);

    if (this.isValidCell(cellX, cellY)) {
      return { x: cellX, y: cellY };
    }
    return null;
  }

  /**
   * Obtem centro de uma celula em coordenadas de tela
   */
  getCellCenter(gridX: number, gridY: number): Vector2 {
    return this.gridToScreen(gridX + 0.5, gridY + 0.5);
  }

  // ==========================================
  // ACESSO AO GRID
  // ==========================================

  /**
   * Verifica se uma celula e valida
   */
  isValidCell(x: number, y: number): boolean {
    return x >= 0 && x < this.config.width && y >= 0 && y < this.config.height;
  }

  /**
   * Obtem uma celula
   */
  getCell(x: number, y: number): GridCell | null {
    if (!this.isValidCell(x, y)) return null;
    return this.cells[y][x];
  }

  /**
   * Define uma celula
   */
  setCell(x: number, y: number, cell: Partial<GridCell>): void {
    if (!this.isValidCell(x, y)) return;
    this.cells[y][x] = { ...this.cells[y][x], ...cell };
  }

  /**
   * Define terreno de uma celula
   */
  setTerrain(x: number, y: number, terrain: TerrainType): void {
    if (!this.isValidCell(x, y)) return;

    const config = TERRAIN_CONFIGS[terrain];
    this.cells[y][x].terrain = terrain;
    this.cells[y][x].walkable = config.walkable;
    this.cells[y][x].cost = config.movementCost;
  }

  /**
   * Verifica se uma celula pode ser atravessada
   */
  isWalkable(x: number, y: number): boolean {
    const cell = this.getCell(x, y);
    return cell !== null && cell.walkable && !cell.occupiedBy;
  }

  /**
   * Obtem custo de movimento de uma celula
   */
  getMovementCost(x: number, y: number): number {
    const cell = this.getCell(x, y);
    return cell ? cell.cost : Infinity;
  }

  /**
   * Obtem vizinhos de uma celula (8 direcoes)
   */
  getNeighbors(x: number, y: number, includeDiagonals: boolean = true): GridCell[] {
    const neighbors: GridCell[] = [];

    // Direcoes cardinais
    const directions = [
      { dx: 1, dy: 0 },   // direita
      { dx: -1, dy: 0 },  // esquerda
      { dx: 0, dy: 1 },   // baixo
      { dx: 0, dy: -1 },  // cima
    ];

    // Adicionar diagonais
    if (includeDiagonals) {
      directions.push(
        { dx: 1, dy: 1 },
        { dx: 1, dy: -1 },
        { dx: -1, dy: 1 },
        { dx: -1, dy: -1 }
      );
    }

    for (const dir of directions) {
      const cell = this.getCell(x + dir.dx, y + dir.dy);
      if (cell) {
        neighbors.push(cell);
      }
    }

    return neighbors;
  }

  /**
   * Obtem vizinhos walkable
   */
  getWalkableNeighbors(x: number, y: number, includeDiagonals: boolean = true): GridCell[] {
    return this.getNeighbors(x, y, includeDiagonals).filter(
      cell => cell.walkable && !cell.occupiedBy
    );
  }

  // ==========================================
  // OCUPACAO
  // ==========================================

  /**
   * Marca celula como ocupada
   */
  occupyCell(x: number, y: number, entityId: string): void {
    const cell = this.getCell(x, y);
    if (cell) {
      cell.occupiedBy = entityId;
    }
  }

  /**
   * Libera celula
   */
  releaseCell(x: number, y: number): void {
    const cell = this.getCell(x, y);
    if (cell) {
      cell.occupiedBy = undefined;
    }
  }

  /**
   * Move ocupacao de uma celula para outra
   */
  moveOccupation(fromX: number, fromY: number, toX: number, toY: number): void {
    const fromCell = this.getCell(fromX, fromY);
    if (fromCell?.occupiedBy) {
      const entityId = fromCell.occupiedBy;
      this.releaseCell(fromX, fromY);
      this.occupyCell(toX, toY, entityId);
    }
  }

  // ==========================================
  // RENDERIZACAO
  // ==========================================

  /**
   * Renderiza o grid
   */
  render(ctx: CanvasRenderingContext2D, cameraOffset: Vector2 = new Vector2(0, 0)): void {
    // Renderizar de tras para frente (painter's algorithm)
    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        const cell = this.cells[y][x];
        this.renderTile(ctx, cell, cameraOffset);
      }
    }
  }

  /**
   * Renderiza um tile individual
   */
  private renderTile(ctx: CanvasRenderingContext2D, cell: GridCell, cameraOffset: Vector2): void {
    const screenPos = this.gridToScreen(cell.gridX, cell.gridY);
    const x = screenPos.x - cameraOffset.x;
    const y = screenPos.y - cameraOffset.y;

    const tw = this.config.tileWidth;
    const th = this.config.tileHeight;
    const terrainConfig = TERRAIN_CONFIGS[cell.terrain];

    // Desenhar diamante isometrico
    ctx.beginPath();
    ctx.moveTo(x, y - th / 2);           // topo
    ctx.lineTo(x + tw / 2, y);           // direita
    ctx.lineTo(x, y + th / 2);           // baixo
    ctx.lineTo(x - tw / 2, y);           // esquerda
    ctx.closePath();

    // Cor baseada na elevacao
    const baseColor = terrainConfig.color;
    ctx.fillStyle = this.adjustBrightness(baseColor, cell.elevation * 10);
    ctx.fill();

    // Borda
    ctx.strokeStyle = terrainConfig.darkColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Highlight se selecionado
    if (cell.occupiedBy) {
      ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
      ctx.fill();
    }
  }

  /**
   * Renderiza highlight em uma celula
   */
  renderCellHighlight(
    ctx: CanvasRenderingContext2D,
    gridX: number,
    gridY: number,
    color: string,
    cameraOffset: Vector2 = new Vector2(0, 0)
  ): void {
    const screenPos = this.gridToScreen(gridX, gridY);
    const x = screenPos.x - cameraOffset.x;
    const y = screenPos.y - cameraOffset.y;

    const tw = this.config.tileWidth;
    const th = this.config.tileHeight;

    ctx.beginPath();
    ctx.moveTo(x, y - th / 2);
    ctx.lineTo(x + tw / 2, y);
    ctx.lineTo(x, y + th / 2);
    ctx.lineTo(x - tw / 2, y);
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /**
   * Renderiza caminho (para debug)
   */
  renderPath(
    ctx: CanvasRenderingContext2D,
    path: GridCell[],
    cameraOffset: Vector2 = new Vector2(0, 0)
  ): void {
    if (path.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
    ctx.lineWidth = 3;

    for (let i = 0; i < path.length; i++) {
      const center = this.getCellCenter(path[i].gridX, path[i].gridY);
      const x = center.x - cameraOffset.x;
      const y = center.y - cameraOffset.y;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Marcar waypoints
    for (const cell of path) {
      const center = this.getCellCenter(cell.gridX, cell.gridY);
      const x = center.x - cameraOffset.x;
      const y = center.y - cameraOffset.y;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'yellow';
      ctx.fill();
    }
  }

  // ==========================================
  // UTILIDADES
  // ==========================================

  /**
   * Ajusta brilho de uma cor hex
   */
  private adjustBrightness(hex: string, amount: number): string {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  /**
   * Calcula distancia entre duas celulas (Manhattan)
   */
  getManhattanDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.abs(x2 - x1) + Math.abs(y2 - y1);
  }

  /**
   * Calcula distancia entre duas celulas (Euclidiana)
   */
  getEuclideanDistance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Obtem dimensoes do grid
   */
  getDimensions(): { width: number; height: number } {
    return { width: this.config.width, height: this.config.height };
  }

  /**
   * Obtem configuracao do tile
   */
  getTileSize(): { width: number; height: number } {
    return { width: this.config.tileWidth, height: this.config.tileHeight };
  }

  /**
   * Itera sobre todas as celulas
   */
  forEach(callback: (cell: GridCell) => void): void {
    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        callback(this.cells[y][x]);
      }
    }
  }

  /**
   * Gera mapa de teste
   */
  generateTestMap(): void {
    // Adicionar alguns obstaculos de agua
    for (let i = 5; i < 10; i++) {
      this.setTerrain(i, 7, TerrainType.WATER);
      this.setTerrain(7, i, TerrainType.WATER);
    }

    // Adicionar pedras
    this.setTerrain(3, 3, TerrainType.STONE);
    this.setTerrain(3, 4, TerrainType.STONE);
    this.setTerrain(4, 3, TerrainType.STONE);

    // Adicionar areia
    for (let i = 12; i < 15; i++) {
      for (let j = 12; j < 15; j++) {
        this.setTerrain(i, j, TerrainType.SAND);
      }
    }
  }
}
