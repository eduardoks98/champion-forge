import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import './Lobby.css';

export default function Lobby() {
  const { isAuthenticated, isLoading, user, login } = useAuth();
  const { onlineCount, connect } = useSocket();
  const navigate = useNavigate();

  const handleQuickPlay = () => {
    if (!isAuthenticated) {
      login();
      return;
    }
    connect();
    navigate('/game');
  };

  const handleSoloPlay = () => {
    navigate('/game');
  };

  const handleInventory = () => {
    navigate('/inventory');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="loading-splash">
        <h1 className="loading-splash__title">CHAMPION FORGE</h1>
        <div className="loading-splash__spinner" />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="lobby">
      <Header variant="full" onlineCount={onlineCount} />

      <main className="lobby__content">
        <div className="lobby__container">
          <h1 className="lobby__title">Lobby</h1>
          <p className="lobby__subtitle">Escolha seu modo de jogo</p>

          <div className="lobby__modes">
            {/* Quick Play */}
            <div className="lobby__mode-card lobby__mode-card--primary">
              <div className="lobby__mode-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2>Jogo Rapido</h2>
              <p>Encontre uma partida automaticamente contra outros jogadores online.</p>
              <div className="lobby__mode-info">
                <span className="lobby__mode-players">
                  <span className="lobby__online-dot" />
                  {onlineCount} jogadores online
                </span>
              </div>
              <button onClick={handleQuickPlay} className="lobby__btn lobby__btn--primary">
                {isAuthenticated ? 'Jogar Agora' : 'Entrar para Jogar'}
              </button>
            </div>

            {/* Solo Practice */}
            <div className="lobby__mode-card">
              <div className="lobby__mode-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <h2>Treino Solo</h2>
              <p>Pratique suas habilidades contra alvos de treino sem pressao.</p>
              <div className="lobby__mode-info">
                <span className="lobby__mode-tag">Offline</span>
              </div>
              <button onClick={handleSoloPlay} className="lobby__btn lobby__btn--secondary">
                Treinar
              </button>
            </div>

            {/* Inventory */}
            <div className="lobby__mode-card">
              <div className="lobby__mode-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                </svg>
              </div>
              <h2>Inventario</h2>
              <p>Personalize suas habilidades e armas antes da batalha.</p>
              <div className="lobby__mode-info">
                <span className="lobby__mode-tag">Loadout</span>
              </div>
              <button onClick={handleInventory} className="lobby__btn lobby__btn--secondary">
                Editar Loadout
              </button>
            </div>

            {/* Custom Game - Coming Soon */}
            <div className="lobby__mode-card lobby__mode-card--disabled">
              <div className="lobby__mode-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" />
                  <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
              <h2>Partida Customizada</h2>
              <p>Crie uma sala privada e convide seus amigos para jogar.</p>
              <div className="lobby__mode-info">
                <span className="lobby__mode-tag lobby__mode-tag--soon">Em Breve</span>
              </div>
              <button className="lobby__btn lobby__btn--disabled" disabled>
                Em Breve
              </button>
            </div>

            {/* Ranked - Coming Soon */}
            <div className="lobby__mode-card lobby__mode-card--disabled">
              <div className="lobby__mode-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <h2>Ranqueada</h2>
              <p>Compita por pontos de ranking e suba nas classificacoes.</p>
              <div className="lobby__mode-info">
                <span className="lobby__mode-tag lobby__mode-tag--soon">Em Breve</span>
              </div>
              <button className="lobby__btn lobby__btn--disabled" disabled>
                Em Breve
              </button>
            </div>
          </div>

          {/* User Stats */}
          {isAuthenticated && user && (
            <div className="lobby__user-stats">
              <h3>Suas Estatisticas</h3>
              <div className="lobby__stats-grid">
                <div className="lobby__stat">
                  <span className="lobby__stat-value">0</span>
                  <span className="lobby__stat-label">Partidas</span>
                </div>
                <div className="lobby__stat">
                  <span className="lobby__stat-value">0</span>
                  <span className="lobby__stat-label">Vitorias</span>
                </div>
                <div className="lobby__stat">
                  <span className="lobby__stat-value">0</span>
                  <span className="lobby__stat-label">Kills</span>
                </div>
                <div className="lobby__stat">
                  <span className="lobby__stat-value">0%</span>
                  <span className="lobby__stat-label">Win Rate</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
