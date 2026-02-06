// ==========================================
// PATHFINDING
// Algoritmo A* para encontrar caminhos
// ==========================================

import { IsometricGrid, GridCell } from './IsometricGrid';

/**
 * No do pathfinding
 */
interface PathNode {
  cell: GridCell;
  g: number;     // Custo do inicio ate aqui
  h: number;     // Heuristica (estimativa ate o fim)
  f: number;     // g + h
  parent: PathNode | null;
}

/**
 * Opcoes de pathfinding
 */
export interface PathfindingOptions {
  /** Permitir movimento diagonal */
  allowDiagonals?: boolean;

  /** Custo extra para diagonais (sqrt(2) ≈ 1.414) */
  diagonalCost?: number;

  /** Maximo de nos a explorar (performance) */
  maxNodes?: number;

  /** Heuristica a usar */
  heuristic?: 'manhattan' | 'euclidean' | 'chebyshev';

  /** Peso da heuristica (> 1 = mais rapido, menos otimo) */
  heuristicWeight?: number;
}

/**
 * Resultado do pathfinding
 */
export interface PathResult {
  /** Se encontrou caminho */
  found: boolean;

  /** Caminho (lista de celulas do inicio ao fim) */
  path: GridCell[];

  /** Custo total do caminho */
  cost: number;

  /** Nos explorados (para debug) */
  explored: number;
}

/**
 * Pathfinding A*
 *
 * Algoritmo:
 * 1. Adicionar no inicial a openList
 * 2. Loop:
 *    a. Pegar no com menor f da openList
 *    b. Se for o destino, reconstruir caminho
 *    c. Mover para closedList
 *    d. Para cada vizinho:
 *       - Se em closedList, ignorar
 *       - Calcular g, h, f
 *       - Se nao em openList, adicionar
 *       - Se ja em openList com g maior, atualizar
 * 3. Se openList vazia, nao ha caminho
 */
export class Pathfinding {
  private grid: IsometricGrid;
  private defaultOptions: Required<PathfindingOptions> = {
    allowDiagonals: true,
    diagonalCost: 1.414,
    maxNodes: 10000,
    heuristic: 'manhattan',
    heuristicWeight: 1,
  };

  constructor(grid: IsometricGrid) {
    this.grid = grid;
  }

  /**
   * Encontra caminho entre duas posicoes do grid
   */
  findPath(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    options: PathfindingOptions = {}
  ): PathResult {
    const opts = { ...this.defaultOptions, ...options };

    // Obter celulas
    const startCell = this.grid.getCell(startX, startY);
    const endCell = this.grid.getCell(endX, endY);

    // Verificar validade
    if (!startCell || !endCell) {
      return { found: false, path: [], cost: 0, explored: 0 };
    }

    // Se destino nao e walkable, encontrar celula walkable mais proxima
    if (!this.grid.isWalkable(endX, endY)) {
      const nearestWalkable = this.findNearestWalkable(endX, endY);
      if (!nearestWalkable) {
        return { found: false, path: [], cost: 0, explored: 0 };
      }
      endX = nearestWalkable.gridX;
      endY = nearestWalkable.gridY;
    }

    // Se inicio == fim
    if (startX === endX && startY === endY) {
      return { found: true, path: [startCell], cost: 0, explored: 1 };
    }

    // Inicializar listas
    const openList: PathNode[] = [];
    const closedSet: Set<string> = new Set();
    const nodeMap: Map<string, PathNode> = new Map();

    // Funcao para gerar chave unica
    const key = (x: number, y: number) => `${x},${y}`;

    // Criar no inicial
    const startNode: PathNode = {
      cell: startCell,
      g: 0,
      h: this.heuristic(startX, startY, endX, endY, opts.heuristic) * opts.heuristicWeight,
      f: 0,
      parent: null,
    };
    startNode.f = startNode.g + startNode.h;

    openList.push(startNode);
    nodeMap.set(key(startX, startY), startNode);

    let explored = 0;

    // Loop principal
    while (openList.length > 0 && explored < opts.maxNodes) {
      explored++;

      // Ordenar por f (pode ser otimizado com heap)
      openList.sort((a, b) => a.f - b.f);

      // Pegar no com menor f
      const current = openList.shift()!;
      const currentKey = key(current.cell.gridX, current.cell.gridY);

      // Verificar se chegou ao destino
      if (current.cell.gridX === endX && current.cell.gridY === endY) {
        return {
          found: true,
          path: this.reconstructPath(current),
          cost: current.g,
          explored,
        };
      }

      // Mover para closed
      closedSet.add(currentKey);

      // Explorar vizinhos
      const neighbors = this.grid.getWalkableNeighbors(
        current.cell.gridX,
        current.cell.gridY,
        opts.allowDiagonals
      );

      for (const neighborCell of neighbors) {
        const neighborKey = key(neighborCell.gridX, neighborCell.gridY);

        // Ignorar se ja processado
        if (closedSet.has(neighborKey)) continue;

        // Calcular custo
        const isDiagonal =
          neighborCell.gridX !== current.cell.gridX &&
          neighborCell.gridY !== current.cell.gridY;

        const moveCost = isDiagonal ? opts.diagonalCost : 1;
        const terrainCost = this.grid.getMovementCost(neighborCell.gridX, neighborCell.gridY);
        const tentativeG = current.g + moveCost * terrainCost;

        // Verificar se ja existe na openList
        let neighborNode = nodeMap.get(neighborKey);

        if (!neighborNode) {
          // Criar novo no
          neighborNode = {
            cell: neighborCell,
            g: tentativeG,
            h: this.heuristic(neighborCell.gridX, neighborCell.gridY, endX, endY, opts.heuristic) * opts.heuristicWeight,
            f: 0,
            parent: current,
          };
          neighborNode.f = neighborNode.g + neighborNode.h;

          openList.push(neighborNode);
          nodeMap.set(neighborKey, neighborNode);
        } else if (tentativeG < neighborNode.g) {
          // Atualizar no existente (caminho melhor encontrado)
          neighborNode.g = tentativeG;
          neighborNode.f = neighborNode.g + neighborNode.h;
          neighborNode.parent = current;
        }
      }
    }

    // Nao encontrou caminho
    return { found: false, path: [], cost: 0, explored };
  }

  /**
   * Encontra celula walkable mais proxima de um ponto
   */
  findNearestWalkable(x: number, y: number, maxRadius: number = 10): GridCell | null {
    // Busca em espiral
    for (let radius = 1; radius <= maxRadius; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          // Apenas verificar borda do quadrado
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;

          const cell = this.grid.getCell(x + dx, y + dy);
          if (cell && this.grid.isWalkable(x + dx, y + dy)) {
            return cell;
          }
        }
      }
    }
    return null;
  }

  /**
   * Reconstroi o caminho a partir do no final
   */
  private reconstructPath(node: PathNode): GridCell[] {
    const path: GridCell[] = [];
    let current: PathNode | null = node;

    while (current) {
      path.unshift(current.cell);
      current = current.parent;
    }

    return path;
  }

  /**
   * Calcula heuristica
   */
  private heuristic(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    type: 'manhattan' | 'euclidean' | 'chebyshev'
  ): number {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);

    switch (type) {
      case 'euclidean':
        return Math.sqrt(dx * dx + dy * dy);

      case 'chebyshev':
        return Math.max(dx, dy);

      case 'manhattan':
      default:
        return dx + dy;
    }
  }

  // ==========================================
  // UTILIDADES PARA MOVIMENTO
  // ==========================================

  /**
   * Simplifica caminho removendo pontos colineares
   */
  simplifyPath(path: GridCell[]): GridCell[] {
    if (path.length <= 2) return path;

    const simplified: GridCell[] = [path[0]];

    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i - 1];
      const curr = path[i];
      const next = path[i + 1];

      // Verificar se esta na mesma linha
      const dx1 = curr.gridX - prev.gridX;
      const dy1 = curr.gridY - prev.gridY;
      const dx2 = next.gridX - curr.gridX;
      const dy2 = next.gridY - curr.gridY;

      // Se direcao mudou, adicionar ponto
      if (dx1 !== dx2 || dy1 !== dy2) {
        simplified.push(curr);
      }
    }

    simplified.push(path[path.length - 1]);
    return simplified;
  }

  /**
   * Suaviza caminho usando interpolacao
   * (para movimento mais natural)
   */
  smoothPath(path: GridCell[], segments: number = 3): { x: number; y: number }[] {
    if (path.length < 2) {
      return path.map(c => ({ x: c.gridX, y: c.gridY }));
    }

    const smoothed: { x: number; y: number }[] = [];

    for (let i = 0; i < path.length - 1; i++) {
      const p0 = i > 0 ? path[i - 1] : path[i];
      const p1 = path[i];
      const p2 = path[i + 1];
      const p3 = i < path.length - 2 ? path[i + 2] : path[i + 1];

      for (let j = 0; j < segments; j++) {
        const t = j / segments;
        const point = this.catmullRom(
          { x: p0.gridX, y: p0.gridY },
          { x: p1.gridX, y: p1.gridY },
          { x: p2.gridX, y: p2.gridY },
          { x: p3.gridX, y: p3.gridY },
          t
        );
        smoothed.push(point);
      }
    }

    // Adicionar ultimo ponto
    const last = path[path.length - 1];
    smoothed.push({ x: last.gridX, y: last.gridY });

    return smoothed;
  }

  /**
   * Interpolacao Catmull-Rom
   */
  private catmullRom(
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
    t: number
  ): { x: number; y: number } {
    const t2 = t * t;
    const t3 = t2 * t;

    const x =
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);

    const y =
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);

    return { x, y };
  }

  /**
   * Verifica se ha linha de visao entre dois pontos
   * (util para otimizar caminhos)
   */
  hasLineOfSight(x1: number, y1: number, x2: number, y2: number): boolean {
    // Algoritmo de Bresenham
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    let x = x1;
    let y = y1;

    while (true) {
      // Verificar se celula atual e walkable
      if (!this.grid.isWalkable(x, y)) {
        return false;
      }

      // Chegou ao destino
      if (x === x2 && y === y2) {
        return true;
      }

      const e2 = 2 * err;

      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }

      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }

  /**
   * Otimiza caminho usando line of sight
   */
  optimizePath(path: GridCell[]): GridCell[] {
    if (path.length <= 2) return path;

    const optimized: GridCell[] = [path[0]];
    let current = 0;

    while (current < path.length - 1) {
      // Encontrar ponto mais distante com linha de visao
      let farthest = current + 1;

      for (let i = current + 2; i < path.length; i++) {
        if (this.hasLineOfSight(
          path[current].gridX,
          path[current].gridY,
          path[i].gridX,
          path[i].gridY
        )) {
          farthest = i;
        }
      }

      optimized.push(path[farthest]);
      current = farthest;
    }

    return optimized;
  }

  // ==========================================
  // DEBUG
  // ==========================================

  /**
   * Renderiza debug do pathfinding
   */
  renderDebug(
    ctx: CanvasRenderingContext2D,
    path: GridCell[],
    cameraOffset: { x: number; y: number } = { x: 0, y: 0 }
  ): void {
    // Usar metodo do grid
    this.grid.renderPath(ctx, path, { x: cameraOffset.x, y: cameraOffset.y } as any);
  }
}

/**
 * Componente de movimento com pathfinding
 */
export class PathFollower {
  private pathfinding: Pathfinding;
  private currentPath: GridCell[] = [];
  private currentIndex: number = 0;
  private speed: number; // tiles por segundo

  constructor(pathfinding: Pathfinding, _grid: IsometricGrid, speed: number = 3) {
    this.pathfinding = pathfinding;
    // Grid mantido no pathfinding, não precisa ser duplicado aqui
    this.speed = speed;
  }

  /**
   * Define novo destino
   */
  setDestination(fromX: number, fromY: number, toX: number, toY: number): boolean {
    const result = this.pathfinding.findPath(fromX, fromY, toX, toY);

    if (result.found) {
      // Otimizar e simplificar caminho
      this.currentPath = this.pathfinding.optimizePath(result.path);
      this.currentIndex = 0;
      return true;
    }

    this.currentPath = [];
    return false;
  }

  /**
   * Atualiza movimento
   * @returns Nova posicao em coordenadas do grid
   */
  update(
    currentX: number,
    currentY: number,
    deltaTime: number
  ): { x: number; y: number; arrived: boolean } {
    if (this.currentPath.length === 0 || this.currentIndex >= this.currentPath.length) {
      return { x: currentX, y: currentY, arrived: true };
    }

    const target = this.currentPath[this.currentIndex];
    const targetX = target.gridX + 0.5; // Centro da celula
    const targetY = target.gridY + 0.5;

    // Calcular direcao
    const dx = targetX - currentX;
    const dy = targetY - currentY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Verificar se chegou no waypoint
    if (distance < 0.1) {
      this.currentIndex++;

      // Verificar se chegou ao destino final
      if (this.currentIndex >= this.currentPath.length) {
        return { x: targetX, y: targetY, arrived: true };
      }

      return { x: targetX, y: targetY, arrived: false };
    }

    // Mover em direcao ao waypoint
    const moveDistance = this.speed * deltaTime;
    const ratio = Math.min(1, moveDistance / distance);

    return {
      x: currentX + dx * ratio,
      y: currentY + dy * ratio,
      arrived: false,
    };
  }

  /**
   * Verifica se tem caminho ativo
   */
  hasPath(): boolean {
    return this.currentPath.length > 0 && this.currentIndex < this.currentPath.length;
  }

  /**
   * Obtem caminho atual (para debug)
   */
  getPath(): GridCell[] {
    return this.currentPath;
  }

  /**
   * Cancela caminho atual
   */
  cancelPath(): void {
    this.currentPath = [];
    this.currentIndex = 0;
  }

  /**
   * Define velocidade
   */
  setSpeed(speed: number): void {
    this.speed = speed;
  }
}
