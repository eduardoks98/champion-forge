import { useEffect, useRef, useState } from 'react';
import { GameEngine, GameStats } from '../game/engine/GameEngine';
import { SIZES } from '../game/constants/timing';
import { Loadout, DEFAULT_LOADOUT } from '../game/data/loadout';
import AbilityBar from './game/AbilityBar';

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
  const engineRef = useRef<GameEngine | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>({
    cooldowns: {},
    loadout: DEFAULT_LOADOUT,
    hp: { current: 100, max: 100 },
    maxCooldowns: {},
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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

    return () => {
      engine.stop();
    };
  }, [onStatsUpdate]);

  const handleReset = () => {
    engineRef.current?.reset();
  };

  const handleSpawnEnemy = () => {
    engineRef.current?.spawnEnemy();
  };

  return (
    <div className="game-canvas-container">
      {/* Canvas principal */}
      <canvas
        ref={canvasRef}
        width={SIZES.arena.width}
        height={SIZES.arena.height}
        style={{
          border: '4px solid #4a4a6a',
          borderRadius: '10px',
          background: '#1a1a2e',
          cursor: 'crosshair',
        }}
      />

      {/* Nova AbilityBar estilo LoL */}
      <AbilityBar
        loadout={playerState.loadout}
        cooldowns={playerState.cooldowns}
        maxCooldowns={playerState.maxCooldowns}
        currentHp={playerState.hp.current}
        maxHp={playerState.hp.max}
      />

      {/* Controles */}
      <div className="controls">
        <button onClick={handleSpawnEnemy}>Spawn Enemy (T)</button>
        <button onClick={handleReset}>Reset</button>
      </div>

      {/* Instruções */}
      <div className="instructions">
        <h3>Controles (LoL Style)</h3>
        <ul>
          <li><strong>Click Direito no chao:</strong> Mover</li>
          <li><strong>Click Direito no inimigo:</strong> Seguir + Auto-Attack</li>
          <li><strong>Q:</strong> Fireball (direcao do mouse)</li>
          <li><strong>W:</strong> Ice Spear (atravessa inimigos)</li>
          <li><strong>E:</strong> Lightning (requer alvo)</li>
          <li><strong>R:</strong> Meteor (area com delay)</li>
          <li><strong>D:</strong> Dash (direcao do mouse)</li>
          <li><strong>F:</strong> Heal (auto-cura)</li>
          <li><strong>T:</strong> Spawn inimigo</li>
        </ul>
      </div>
    </div>
  );
}
