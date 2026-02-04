import { useSocket, useGameState } from '@mysys/game-sdk-client';

export default function Game() {
  const { connected, emit } = useSocket();
  const { gameState } = useGameState();

  return (
    <div className="game">
      <header>
        <span>Status: {connected ? '🟢 Conectado' : '🔴 Desconectado'}</span>
      </header>

      <main>
        <p>Implemente seu jogo aqui!</p>
        {/* Seu jogo vai aqui */}
      </main>
    </div>
  );
}
