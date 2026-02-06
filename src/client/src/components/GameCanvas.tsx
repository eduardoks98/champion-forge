import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine, GameStats } from '../game/engine/GameEngine';
import { Loadout, DEFAULT_LOADOUT } from '../game/data/loadout';
import AbilityBar from './game/AbilityBar';
import './GameCanvas.css';

interface Props {
  onStatsUpdate?: (stats: GameStats) => void;
}

interface PlayerState {
  cooldowns: Record<string, number>;
  loadout: Loadout;
  hp: { current: number; max: number };
  maxCooldowns: Record<string, number>;
}

export default function GameCanvas({ onStatsUpdate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>({
    cooldowns: {},
    loadout: DEFAULT_LOADOUT,
    hp: { current: 100, max: 100 },
    maxCooldowns: {},
  });

  // Resize handler
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;

    // Fullscreen dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    // Notificar engine sobre resize
    engine.handleResize(width, height);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set initial fullscreen size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Criar engine
    const engine = new GameEngine(canvas);
    engineRef.current = engine;

    // Callback para stats e player state
    engine.onStatsUpdate = (stats) => {
      onStatsUpdate?.(stats);
      setPlayerState({
        cooldowns: engine.getPlayerCooldowns(),
        loadout: engine.getLoadout(),
        hp: engine.getPlayerHp(),
        maxCooldowns: engine.getMaxCooldowns(),
      });
    };

    // Iniciar
    engine.start();

    // Add resize listener
    window.addEventListener('resize', handleResize);

    return () => {
      engine.stop();
      window.removeEventListener('resize', handleResize);
    };
  }, [onStatsUpdate, handleResize]);

  const handleReset = () => {
    engineRef.current?.reset();
  };

  const handleSpawnEnemy = () => {
    engineRef.current?.spawnEnemy();
  };

  return (
    <div ref={containerRef} className="game-fullscreen-container">
      {/* Canvas fullscreen */}
      <canvas
        ref={canvasRef}
        className="game-canvas-fullscreen"
      />

      {/* HUD Overlay */}
      <div className="game-hud-overlay">
        {/* AbilityBar na parte inferior */}
        <AbilityBar
          loadout={playerState.loadout}
          cooldowns={playerState.cooldowns}
          maxCooldowns={playerState.maxCooldowns}
          currentHp={playerState.hp.current}
          maxHp={playerState.hp.max}
        />

        {/* Controles no canto superior direito */}
        <div className="game-controls-overlay">
          <button onClick={handleSpawnEnemy}>Spawn (T)</button>
          <button onClick={handleReset}>Reset</button>
        </div>

        {/* Mini instruções no canto inferior esquerdo */}
        <div className="game-instructions-mini">
          <p><strong>RMB:</strong> Move/Attack | <strong>QWER:</strong> Abilities | <strong>DF:</strong> Spells | <strong>F3:</strong> Debug</p>
        </div>
      </div>
    </div>
  );
}
