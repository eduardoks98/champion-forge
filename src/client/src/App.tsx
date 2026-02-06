import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { TabSyncProvider } from './context/TabSyncContext';
import { CharacterProvider } from './context/CharacterContext';
import Home from './pages/Home';
import Game from './pages/Game';
import Lobby from './pages/Lobby';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import Inventory from './pages/Inventory';
import AuthCallback from './pages/AuthCallback';
import Preview from './pages/Preview/Preview';
import SkeletonDemo from './pages/SkeletonDemo';
import CharacterEditor from './pages/CharacterEditor';

// Rotas que precisam de auth e tab sync
function AuthenticatedRoutes() {
  return (
    <AuthProvider>
      <TabSyncProvider disabledRoutes={['/game']}>
        <SocketProvider>
          <CharacterProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/game" element={<Game />} />
              <Route path="/lobby" element={<Lobby />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
            </Routes>
          </CharacterProvider>
        </SocketProvider>
      </TabSyncProvider>
    </AuthProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Preview NÃO precisa de auth nem tab sync - é só visual para iframe */}
        <Route path="/preview" element={<Preview />} />
        {/* Demo do skeleton e grid - também não precisa de auth */}
        <Route path="/skeleton-demo" element={<SkeletonDemo />} />
        {/* Editor de personagens - não precisa de auth */}
        <Route path="/character-editor" element={<CharacterEditor />} />
        {/* Todas outras rotas passam pelos providers */}
        <Route path="/*" element={<AuthenticatedRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
