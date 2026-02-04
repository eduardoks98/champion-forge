import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export default function Game() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001');

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('Connected to server');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <div className="game">
      <header>
        <span>Status: {connected ? '🟢 Conectado' : '🔴 Desconectado'}</span>
      </header>

      <main>
        <h2>Champion Forge - Arena</h2>
        <p>Implemente seu jogo aqui!</p>
        {/* Seu jogo vai aqui */}
      </main>
    </div>
  );
}
