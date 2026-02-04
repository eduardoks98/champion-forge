import React from 'react';
import ReactDOM from 'react-dom/client';
import { GameProvider } from '@mysys/game-sdk-client';
import App from './App';
import './styles/global.css';

const config = {
  gameCode: import.meta.env.VITE_GAME_CODE,
  authUrl: import.meta.env.VITE_AUTH_URL,
  serverUrl: import.meta.env.VITE_API_URL,
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GameProvider config={config}>
      <App />
    </GameProvider>
  </React.StrictMode>
);
