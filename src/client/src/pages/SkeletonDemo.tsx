// ==========================================
// SKELETON DEMO PAGE
// Pagina para testar skeleton procedural e grid isometrico
// ==========================================

import { useEffect, useRef, useState } from 'react';
import { SkeletonFactory } from '../game/animation/Skeleton';
import { ProceduralAnimator, AnimationState } from '../game/animation/ProceduralAnimator';
import { RendererFactory, SkeletonRenderer } from '../game/animation/SkeletonRenderer';
import { IsometricGrid } from '../game/world/IsometricGrid';
import { Pathfinding, PathFollower } from '../game/world/Pathfinding';
import { Vector2 } from '../game/utils/Vector2';
import { getDirectionFromVelocity, getDirectionName } from '../game/animation/Direction';
import './SkeletonDemo.css';

interface DemoEntity {
  skeleton: ReturnType<typeof SkeletonFactory.createPlayer>;
  animator: ProceduralAnimator;
  renderer: SkeletonRenderer | null;
  pathFollower: PathFollower;
  gridX: number;
  gridY: number;
  screenX: number;
  screenY: number;
  type: 'player' | 'enemy';
  speed: number;
}

export default function SkeletonDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fps, setFps] = useState(0);
  const [currentState, setCurrentState] = useState<AnimationState>('idle');
  const [debugMode, setDebugMode] = useState(false);
  const [gridPosition, setGridPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });

  // Refs para valores que mudam mas não devem causar re-render do game loop
  const currentStateRef = useRef<AnimationState>(currentState);
  const debugModeRef = useRef(debugMode);
  const zoomRef = useRef(zoom);
  const cameraOffsetRef = useRef(cameraOffset);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // Refs para game state
  const gridRef = useRef<IsometricGrid | null>(null);
  const pathfindingRef = useRef<Pathfinding | null>(null);
  const entitiesRef = useRef<DemoEntity[]>([]);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const fpsCounterRef = useRef({ frames: 0, lastTime: 0 });
  const initializedRef = useRef(false);

  // Sincronizar refs com state
  useEffect(() => { currentStateRef.current = currentState; }, [currentState]);
  useEffect(() => { debugModeRef.current = debugMode; }, [debugMode]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { cameraOffsetRef.current = cameraOffset; }, [cameraOffset]);

  // Atualizar debug mode nos renderers
  useEffect(() => {
    for (const entity of entitiesRef.current) {
      entity.renderer?.setDebug(debugMode);
    }
  }, [debugMode]);

  // Inicialização única
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || initializedRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Marcar como inicializado
    initializedRef.current = true;

    // Definir tamanho do canvas
    canvas.width = 1200;
    canvas.height = 800;

    // Criar grid isometrico
    const grid = new IsometricGrid({
      width: 30,
      height: 30,
      tileWidth: 64,
      tileHeight: 32,
      offsetX: 500,
      offsetY: 100,
    });
    grid.generateTestMap();
    gridRef.current = grid;
    pathfindingRef.current = new Pathfinding(grid);

    // Criar player
    const playerSkeleton = SkeletonFactory.createPlayer();
    const playerAnimator = new ProceduralAnimator(playerSkeleton);
    const playerRenderer = RendererFactory.createPlayerRenderer(ctx);

    const player: DemoEntity = {
      skeleton: playerSkeleton,
      animator: playerAnimator,
      renderer: playerRenderer,
      pathFollower: new PathFollower(pathfindingRef.current, grid, 3),
      gridX: 5,
      gridY: 5,
      screenX: 0,
      screenY: 0,
      type: 'player',
      speed: 3,
    };

    // Criar enemy
    const enemySkeleton = SkeletonFactory.createEnemy();
    const enemyAnimator = new ProceduralAnimator(enemySkeleton);
    const enemyRenderer = RendererFactory.createEnemyRenderer(ctx);

    const enemy: DemoEntity = {
      skeleton: enemySkeleton,
      animator: enemyAnimator,
      renderer: enemyRenderer,
      pathFollower: new PathFollower(pathfindingRef.current, grid, 1.5),
      gridX: 20,
      gridY: 20,
      screenX: 0,
      screenY: 0,
      type: 'enemy',
      speed: 1.5,
    };

    // Posições iniciais
    const playerPos = grid.getCellCenter(player.gridX, player.gridY);
    player.screenX = playerPos.x;
    player.screenY = playerPos.y;

    const enemyPos = grid.getCellCenter(enemy.gridX, enemy.gridY);
    enemy.screenX = enemyPos.x;
    enemy.screenY = enemyPos.y;

    entitiesRef.current = [player, enemy];

    // Game loop
    const gameLoop = (timestamp: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const grid = gridRef.current;

      if (!canvas || !ctx || !grid) {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      // Delta time
      const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0.016;
      lastTimeRef.current = timestamp;

      // FPS counter
      fpsCounterRef.current.frames++;
      if (timestamp - fpsCounterRef.current.lastTime >= 1000) {
        setFps(fpsCounterRef.current.frames);
        fpsCounterRef.current.frames = 0;
        fpsCounterRef.current.lastTime = timestamp;
      }

      // Limpar canvas
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Aplicar camera
      ctx.save();
      ctx.scale(zoomRef.current, zoomRef.current);
      ctx.translate(-cameraOffsetRef.current.x, -cameraOffsetRef.current.y);

      // Renderizar grid
      grid.render(ctx);

      // Atualizar e renderizar entidades
      for (const entity of entitiesRef.current) {
        // Guardar posição anterior para calcular direção
        const prevScreenX = entity.screenX;
        const prevScreenY = entity.screenY;

        // Pathfinding
        const moveResult = entity.pathFollower.update(entity.gridX, entity.gridY, deltaTime);
        entity.gridX = moveResult.x;
        entity.gridY = moveResult.y;

        // Screen position
        const screenPos = grid.getCellCenter(entity.gridX, entity.gridY);
        entity.screenX = screenPos.x;
        entity.screenY = screenPos.y;

        // Calcular velocidade real de movimento para direção
        const velocityX = entity.screenX - prevScreenX;
        const velocityY = entity.screenY - prevScreenY;

        // Atualizar direção baseado no movimento (8 direções)
        if (entity.pathFollower.hasPath() && (Math.abs(velocityX) > 0.1 || Math.abs(velocityY) > 0.1)) {
          const direction = getDirectionFromVelocity(velocityX, velocityY);
          entity.skeleton.setFacing(direction);
        }

        // Animation state
        if (entity.pathFollower.hasPath()) {
          entity.animator.setState('walk');
        } else if (entity.type === 'player') {
          entity.animator.setState(currentStateRef.current);
        } else {
          entity.animator.setState('idle');
        }

        // Update animation com velocidade real
        const velocity = new Vector2(velocityX * 60, velocityY * 60); // Multiplicar por ~fps para ter magnitude correta
        entity.animator.update(deltaTime, velocity);

        // Position skeleton
        const skeletonHeight = entity.skeleton.getHeight();
        entity.skeleton.setPosition(entity.screenX, entity.screenY - skeletonHeight * 0.5);

        // Debug path
        if (debugModeRef.current && entity.pathFollower.hasPath()) {
          grid.renderPath(ctx, entity.pathFollower.getPath());
        }

        // Render skeleton
        if (entity.renderer) {
          entity.renderer.render(entity.skeleton);
        }
      }

      ctx.restore();

      // Debug overlay
      if (debugModeRef.current) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 220, 150);
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px monospace';
        ctx.fillText(`FPS: ${fpsCounterRef.current.frames || fps}`, 20, 30);
        ctx.fillText(`State: ${currentStateRef.current}`, 20, 50);
        ctx.fillText(`Entities: ${entitiesRef.current.length}`, 20, 70);
        ctx.fillText(`Zoom: ${zoomRef.current.toFixed(2)}x`, 20, 90);
        ctx.fillText(`Camera: (${cameraOffsetRef.current.x.toFixed(0)}, ${cameraOffsetRef.current.y.toFixed(0)})`, 20, 110);
        // Mostrar direção do player
        const player = entitiesRef.current.find(e => e.type === 'player');
        if (player) {
          ctx.fillText(`Direction: ${getDirectionName(player.skeleton.getFacing())}`, 20, 130);
        }
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    // Start game loop
    lastTimeRef.current = performance.now();
    fpsCounterRef.current.lastTime = performance.now();
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      initializedRef.current = false;
    };
  }, []); // Empty deps - run once

  // Wheel event for zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setZoom(prev => {
        const newZoom = prev + (e.deltaY > 0 ? -0.1 : 0.1);
        return Math.max(0.3, Math.min(3, newZoom));
      });
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  // Event handlers
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    const canvas = canvasRef.current;
    const grid = gridRef.current;
    if (!canvas || !grid) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = ((e.clientX - rect.left) * scaleX) / zoomRef.current + cameraOffsetRef.current.x;
    const y = ((e.clientY - rect.top) * scaleY) / zoomRef.current + cameraOffsetRef.current.y;

    const gridPos = grid.screenToCell(x, y);
    if (!gridPos) return;

    const player = entitiesRef.current.find(ent => ent.type === 'player');
    if (player && grid.isWalkable(gridPos.x, gridPos.y)) {
      player.pathFollower.setDestination(
        Math.floor(player.gridX),
        Math.floor(player.gridY),
        gridPos.x,
        gridPos.y
      );
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || e.button === 2) {
      e.preventDefault();
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const grid = gridRef.current;
    if (!canvas || !grid) return;

    if (isDraggingRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      setCameraOffset(prev => ({
        x: prev.x - dx / zoomRef.current,
        y: prev.y - dy / zoomRef.current
      }));
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = ((e.clientX - rect.left) * scaleX) / zoomRef.current + cameraOffsetRef.current.x;
    const y = ((e.clientY - rect.top) * scaleY) / zoomRef.current + cameraOffsetRef.current.y;
    const gridPos = grid.screenToGrid(x, y);
    setGridPosition({ x: gridPos.x, y: gridPos.y });
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleStateChange = (state: AnimationState) => {
    setCurrentState(state);
    const player = entitiesRef.current.find(ent => ent.type === 'player');
    if (player) {
      player.animator.setState(state);
    }
  };

  const handleChasePlayer = () => {
    const player = entitiesRef.current.find(ent => ent.type === 'player');
    const enemy = entitiesRef.current.find(ent => ent.type === 'enemy');
    if (player && enemy) {
      enemy.pathFollower.setDestination(
        Math.floor(enemy.gridX),
        Math.floor(enemy.gridY),
        Math.floor(player.gridX),
        Math.floor(player.gridY)
      );
    }
  };

  const handleResetCamera = () => {
    setZoom(1);
    setCameraOffset({ x: 0, y: 0 });
  };

  return (
    <div className="skeleton-demo">
      <div className="skeleton-demo__header">
        <h1>Skeleton & Grid Demo</h1>
        <span className="skeleton-demo__fps">FPS: {fps}</span>
      </div>

      <div className="skeleton-demo__content">
        <canvas
          ref={canvasRef}
          className="skeleton-demo__canvas"
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onMouseMove={handleMouseMove}
          onContextMenu={handleContextMenu}
        />

        <div className="skeleton-demo__controls">
          <div className="skeleton-demo__section">
            <h3>Animation State</h3>
            <div className="skeleton-demo__buttons">
              {(['idle', 'walk', 'run', 'attack', 'hit', 'death'] as AnimationState[]).map((state) => (
                <button
                  key={state}
                  className={`skeleton-demo__btn ${currentState === state ? 'active' : ''}`}
                  onClick={() => handleStateChange(state)}
                >
                  {state.charAt(0).toUpperCase() + state.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="skeleton-demo__section">
            <h3>Actions</h3>
            <div className="skeleton-demo__buttons">
              <button className="skeleton-demo__btn" onClick={handleChasePlayer}>
                Enemy Chase
              </button>
              <button
                className={`skeleton-demo__btn ${debugMode ? 'active' : ''}`}
                onClick={() => setDebugMode(!debugMode)}
              >
                Debug Mode
              </button>
              <button className="skeleton-demo__btn" onClick={handleResetCamera}>
                Reset Camera
              </button>
            </div>
          </div>

          <div className="skeleton-demo__section">
            <h3>Camera</h3>
            <div className="skeleton-demo__info">
              <p><strong>Zoom:</strong> {zoom.toFixed(2)}x (Scroll to zoom)</p>
              <p><strong>Pan:</strong> Right-click + drag</p>
              <p><strong>Move:</strong> Left-click on tile</p>
            </div>
          </div>

          <div className="skeleton-demo__section">
            <h3>Info</h3>
            <div className="skeleton-demo__info">
              <p><strong>Grid Position:</strong> ({gridPosition.x.toFixed(1)}, {gridPosition.y.toFixed(1)})</p>
              <p><strong>State:</strong> {currentState}</p>
              <p><strong>Grid Size:</strong> 30x30</p>
            </div>
          </div>

          <div className="skeleton-demo__section">
            <h3>Legend</h3>
            <div className="skeleton-demo__legend">
              <div className="skeleton-demo__legend-item">
                <span className="skeleton-demo__color" style={{ background: '#4a7c3f' }}></span>
                Grass (walkable)
              </div>
              <div className="skeleton-demo__legend-item">
                <span className="skeleton-demo__color" style={{ background: '#4a90d9' }}></span>
                Water (blocked)
              </div>
              <div className="skeleton-demo__legend-item">
                <span className="skeleton-demo__color" style={{ background: '#808080' }}></span>
                Stone (walkable)
              </div>
              <div className="skeleton-demo__legend-item">
                <span className="skeleton-demo__color" style={{ background: '#c8b060' }}></span>
                Sand (slow)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
