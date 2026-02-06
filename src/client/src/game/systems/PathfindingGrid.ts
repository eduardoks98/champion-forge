// ==========================================
// PATHFINDING GRID 2D - A* Algorithm
// ==========================================
// Grid-based pathfinding otimizado para jogos web
// Usa Binary Heap para performance O(n log n)
// ==========================================

/**
 * Nó do grid para pathfinding
 */
interface PathNode {
  x: number;
  y: number;
  walkable: boolean;
  g: number; // Custo do início até aqui
  h: number; // Heurística (estimativa até o destino)
  f: number; // g + h
  parent: PathNode | null;
  // Para o heap
  heapIndex: number;
}

/**
 * Ponto 2D simples
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Binary Heap para A* - muito mais rápido que array.sort()
 * Complexidade: O(log n) para insert e extract
 */
class BinaryHeap {
  private nodes: PathNode[] = [];

  get length(): number {
    return this.nodes.length;
  }

  push(node: PathNode): void {
    node.heapIndex = this.nodes.length;
    this.nodes.push(node);
    this.bubbleUp(node.heapIndex);
  }

  pop(): PathNode | null {
    if (this.nodes.length === 0) return null;

    const first = this.nodes[0];
    const last = this.nodes.pop()!;

    if (this.nodes.length > 0) {
      this.nodes[0] = last;
      last.heapIndex = 0;
      this.bubbleDown(0);
    }

    return first;
  }

  contains(node: PathNode): boolean {
    return this.nodes[node.heapIndex] === node;
  }

  update(node: PathNode): void {
    this.bubbleUp(node.heapIndex);
  }

  private bubbleUp(index: number): void {
    const node = this.nodes[index];

    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const parent = this.nodes[parentIndex];

      if (node.f >= parent.f) break;

      // Swap
      this.nodes[parentIndex] = node;
      this.nodes[index] = parent;
      node.heapIndex = parentIndex;
      parent.heapIndex = index;
      index = parentIndex;
    }
  }

  private bubbleDown(index: number): void {
    const length = this.nodes.length;
    const node = this.nodes[index];

    while (true) {
      const leftIndex = 2 * index + 1;
      const rightIndex = 2 * index + 2;
      let smallest = index;

      if (leftIndex < length && this.nodes[leftIndex].f < this.nodes[smallest].f) {
        smallest = leftIndex;
      }

      if (rightIndex < length && this.nodes[rightIndex].f < this.nodes[smallest].f) {
        smallest = rightIndex;
      }

      if (smallest === index) break;

      // Swap
      const smallestNode = this.nodes[smallest];
      this.nodes[index] = smallestNode;
      this.nodes[smallest] = node;
      smallestNode.heapIndex = index;
      node.heapIndex = smallest;
      index = smallest;
    }
  }
}

/**
 * Grid de Pathfinding com A*
 */
export class PathfindingGrid {
  private grid: PathNode[][] = [];
  private width: number;
  private height: number;
  private cellSize: number;

  // Direções: 8-way movement (incluindo diagonais)
  private static readonly DIRECTIONS = [
    { x: 0, y: -1, cost: 1 },    // Cima
    { x: 1, y: -1, cost: 1.41 }, // Cima-Direita (diagonal)
    { x: 1, y: 0, cost: 1 },     // Direita
    { x: 1, y: 1, cost: 1.41 },  // Baixo-Direita
    { x: 0, y: 1, cost: 1 },     // Baixo
    { x: -1, y: 1, cost: 1.41 }, // Baixo-Esquerda
    { x: -1, y: 0, cost: 1 },    // Esquerda
    { x: -1, y: -1, cost: 1.41 } // Cima-Esquerda
  ];

  /**
   * @param worldWidth Largura do mundo em pixels
   * @param worldHeight Altura do mundo em pixels
   * @param cellSize Tamanho de cada célula em pixels (menor = mais preciso, mais lento)
   */
  constructor(worldWidth: number, worldHeight: number, cellSize: number = 32) {
    this.cellSize = cellSize;
    this.width = Math.ceil(worldWidth / cellSize);
    this.height = Math.ceil(worldHeight / cellSize);

    // Inicializar grid
    for (let y = 0; y < this.height; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.grid[y][x] = {
          x,
          y,
          walkable: true,
          g: 0,
          h: 0,
          f: 0,
          parent: null,
          heapIndex: 0
        };
      }
    }

    console.log(`[PathfindingGrid] Initialized ${this.width}x${this.height} grid (cell size: ${cellSize}px)`);
  }

  /**
   * Converte posição do mundo para posição do grid
   */
  worldToGrid(worldX: number, worldY: number): Point {
    return {
      x: Math.floor(worldX / this.cellSize),
      y: Math.floor(worldY / this.cellSize)
    };
  }

  /**
   * Converte posição do grid para centro da célula no mundo
   */
  gridToWorld(gridX: number, gridY: number): Point {
    return {
      x: gridX * this.cellSize + this.cellSize / 2,
      y: gridY * this.cellSize + this.cellSize / 2
    };
  }

  /**
   * Verifica se uma célula está dentro do grid
   */
  isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /**
   * Verifica se uma célula é walkable
   */
  isWalkable(x: number, y: number): boolean {
    if (!this.isInBounds(x, y)) return false;
    return this.grid[y][x].walkable;
  }

  /**
   * Define se uma célula é walkable ou não
   */
  setWalkable(x: number, y: number, walkable: boolean): void {
    if (this.isInBounds(x, y)) {
      this.grid[y][x].walkable = walkable;
    }
  }

  /**
   * Bloqueia uma área retangular (obstáculo)
   * Corrigido: usa worldWidth-1 para não incluir célula extra
   */
  blockRect(worldX: number, worldY: number, worldWidth: number, worldHeight: number): void {
    const startGrid = this.worldToGrid(worldX, worldY);
    // -1 para não incluir o pixel além do limite do retângulo
    const endGrid = this.worldToGrid(worldX + worldWidth - 1, worldY + worldHeight - 1);

    for (let y = startGrid.y; y <= endGrid.y; y++) {
      for (let x = startGrid.x; x <= endGrid.x; x++) {
        this.setWalkable(x, y, false);
      }
    }
  }

  /**
   * Desbloqueia uma área retangular
   */
  unblockRect(worldX: number, worldY: number, worldWidth: number, worldHeight: number): void {
    const startGrid = this.worldToGrid(worldX, worldY);
    const endGrid = this.worldToGrid(worldX + worldWidth, worldY + worldHeight);

    for (let y = startGrid.y; y <= endGrid.y; y++) {
      for (let x = startGrid.x; x <= endGrid.x; x++) {
        this.setWalkable(x, y, true);
      }
    }
  }

  /**
   * Bloqueia um círculo (para obstáculos circulares)
   */
  blockCircle(worldX: number, worldY: number, radius: number): void {
    const center = this.worldToGrid(worldX, worldY);
    const gridRadius = Math.ceil(radius / this.cellSize);

    for (let dy = -gridRadius; dy <= gridRadius; dy++) {
      for (let dx = -gridRadius; dx <= gridRadius; dx++) {
        const x = center.x + dx;
        const y = center.y + dy;

        if (dx * dx + dy * dy <= gridRadius * gridRadius) {
          this.setWalkable(x, y, false);
        }
      }
    }
  }

  /**
   * Encontra caminho usando A*
   * @returns Array de pontos do mundo, ou null se não houver caminho
   */
  findPath(startWorld: Point, endWorld: Point): Point[] | null {
    const start = this.worldToGrid(startWorld.x, startWorld.y);
    const end = this.worldToGrid(endWorld.x, endWorld.y);

    // Validações
    if (!this.isInBounds(start.x, start.y) || !this.isInBounds(end.x, end.y)) {
      return null;
    }

    if (!this.isWalkable(end.x, end.y)) {
      // Destino não é walkable - tentar encontrar célula walkable mais próxima
      const nearest = this.findNearestWalkable(end.x, end.y);
      if (!nearest) return null;
      end.x = nearest.x;
      end.y = nearest.y;
    }

    // Reset dos nós
    this.resetNodes();

    const openSet = new BinaryHeap();
    const closedSet = new Set<PathNode>();

    const startNode = this.grid[start.y][start.x];
    const endNode = this.grid[end.y][end.x];

    startNode.g = 0;
    startNode.h = this.heuristic(start.x, start.y, end.x, end.y);
    startNode.f = startNode.h;

    openSet.push(startNode);

    // Limite de iterações para evitar loops infinitos
    const maxIterations = this.width * this.height;
    let iterations = 0;

    while (openSet.length > 0 && iterations < maxIterations) {
      iterations++;

      const current = openSet.pop()!;

      // Chegou ao destino!
      if (current === endNode) {
        return this.reconstructPath(current);
      }

      closedSet.add(current);

      // Explorar vizinhos
      for (const dir of PathfindingGrid.DIRECTIONS) {
        const nx = current.x + dir.x;
        const ny = current.y + dir.y;

        if (!this.isWalkable(nx, ny)) continue;

        const neighbor = this.grid[ny][nx];
        if (closedSet.has(neighbor)) continue;

        // Custo para chegar ao vizinho
        const tentativeG = current.g + dir.cost;

        if (!openSet.contains(neighbor)) {
          neighbor.g = tentativeG;
          neighbor.h = this.heuristic(nx, ny, end.x, end.y);
          neighbor.f = neighbor.g + neighbor.h;
          neighbor.parent = current;
          openSet.push(neighbor);
        } else if (tentativeG < neighbor.g) {
          // Encontrou caminho melhor
          neighbor.g = tentativeG;
          neighbor.f = neighbor.g + neighbor.h;
          neighbor.parent = current;
          openSet.update(neighbor);
        }
      }
    }

    // Não encontrou caminho
    return null;
  }

  /**
   * Heurística: Distância Octile (melhor para 8-way movement)
   */
  private heuristic(x1: number, y1: number, x2: number, y2: number): number {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    // Octile distance: mais precisa para movimento diagonal
    return Math.max(dx, dy) + 0.41 * Math.min(dx, dy);
  }

  /**
   * Reconstrói o caminho a partir do nó final
   */
  private reconstructPath(endNode: PathNode): Point[] {
    const path: Point[] = [];
    let current: PathNode | null = endNode;

    while (current !== null) {
      // Converter para coordenadas do mundo (centro da célula)
      const worldPos = this.gridToWorld(current.x, current.y);
      path.unshift(worldPos);
      current = current.parent;
    }

    // Otimização: Simplificar caminho removendo pontos colineares
    return this.simplifyPath(path);
  }

  /**
   * Simplifica o caminho removendo pontos intermediários desnecessários
   */
  private simplifyPath(path: Point[]): Point[] {
    if (path.length <= 2) return path;

    const simplified: Point[] = [path[0]];

    for (let i = 1; i < path.length - 1; i++) {
      const prev = simplified[simplified.length - 1];
      const curr = path[i];
      const next = path[i + 1];

      // Verificar se o ponto atual está na mesma linha que prev e next
      const dx1 = curr.x - prev.x;
      const dy1 = curr.y - prev.y;
      const dx2 = next.x - curr.x;
      const dy2 = next.y - curr.y;

      // Se as direções são diferentes, manter o ponto
      if (Math.sign(dx1) !== Math.sign(dx2) || Math.sign(dy1) !== Math.sign(dy2)) {
        simplified.push(curr);
      }
    }

    simplified.push(path[path.length - 1]);
    return simplified;
  }

  /**
   * Encontra a célula walkable mais próxima
   */
  private findNearestWalkable(x: number, y: number): Point | null {
    const maxRadius = Math.max(this.width, this.height);

    for (let r = 1; r <= maxRadius; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue; // Só borda do quadrado

          const nx = x + dx;
          const ny = y + dy;

          if (this.isWalkable(nx, ny)) {
            return { x: nx, y: ny };
          }
        }
      }
    }

    return null;
  }

  /**
   * Reset dos valores de pathfinding nos nós
   */
  private resetNodes(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const node = this.grid[y][x];
        node.g = 0;
        node.h = 0;
        node.f = 0;
        node.parent = null;
        node.heapIndex = 0;
      }
    }
  }

  /**
   * Limpa todos os obstáculos
   */
  clearObstacles(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.grid[y][x].walkable = true;
      }
    }
  }

  /**
   * Debug: Desenha grid completo com linhas e células bloqueadas
   */
  debugDraw(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // 1. Desenhar TODAS as linhas do grid (cinza claro, muito sutil)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 0.5;

    // Linhas verticais
    for (let x = 0; x <= this.width; x++) {
      const worldX = x * this.cellSize;
      ctx.beginPath();
      ctx.moveTo(worldX, 0);
      ctx.lineTo(worldX, this.height * this.cellSize);
      ctx.stroke();
    }

    // Linhas horizontais
    for (let y = 0; y <= this.height; y++) {
      const worldY = y * this.cellSize;
      ctx.beginPath();
      ctx.moveTo(0, worldY);
      ctx.lineTo(this.width * this.cellSize, worldY);
      ctx.stroke();
    }

    // 2. Células bloqueadas (vermelho semi-transparente)
    ctx.fillStyle = 'rgba(255, 0, 0, 0.25)';
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (!this.grid[y][x].walkable) {
          const worldX = x * this.cellSize;
          const worldY = y * this.cellSize;
          ctx.fillRect(worldX, worldY, this.cellSize, this.cellSize);
        }
      }
    }

    // 3. Bordas das células bloqueadas (vermelho mais visível)
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)';
    ctx.lineWidth = 1;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (!this.grid[y][x].walkable) {
          const worldX = x * this.cellSize;
          const worldY = y * this.cellSize;
          ctx.strokeRect(worldX, worldY, this.cellSize, this.cellSize);
        }
      }
    }

    ctx.restore();
  }

  /**
   * Debug: Desenha um caminho no canvas
   */
  debugDrawPath(ctx: CanvasRenderingContext2D, path: Point[]): void {
    if (path.length < 2) return;

    ctx.save();
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);

    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }

    ctx.stroke();

    // Desenhar waypoints
    ctx.setLineDash([]);
    ctx.fillStyle = '#00ff00';
    for (const point of path) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Retorna dimensões do grid
   */
  getSize(): { width: number; height: number; cellSize: number } {
    return {
      width: this.width,
      height: this.height,
      cellSize: this.cellSize
    };
  }
}

// ==========================================
// SINGLETON GLOBAL
// ==========================================

let globalPathfindingGrid: PathfindingGrid | null = null;

/**
 * Inicializa o grid de pathfinding global
 */
export function initializePathfindingGrid(
  worldWidth: number,
  worldHeight: number,
  cellSize: number = 32
): PathfindingGrid {
  globalPathfindingGrid = new PathfindingGrid(worldWidth, worldHeight, cellSize);
  return globalPathfindingGrid;
}

/**
 * Retorna o grid de pathfinding global
 */
export function getPathfindingGrid(): PathfindingGrid {
  if (!globalPathfindingGrid) {
    // Fallback: criar com tamanho padrão
    globalPathfindingGrid = new PathfindingGrid(800, 600, 32);
  }
  return globalPathfindingGrid;
}
