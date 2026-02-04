import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from '@mysys/game-sdk-client';
import { SessionInvalidatedModal } from '@mysys/game-sdk-client/components';
import Home from './pages/Home';
import Game from './pages/Game';

function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <BrowserRouter>
      <SessionInvalidatedModal />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game" element={<Game />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
