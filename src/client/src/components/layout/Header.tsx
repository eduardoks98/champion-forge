import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || 'http://localhost:8000';

interface HeaderProps {
  variant?: 'full' | 'simple';
  onlineCount?: number;
}

export default function Header({ variant = 'full', onlineCount = 0 }: HeaderProps) {
  const { isAuthenticated, user, logout, login } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Simple variant - para paginas legais (igual Bangshot)
  if (variant === 'simple') {
    return (
      <header className="header header--simple">
        <a href={PORTAL_URL} className="header__mysys-logo" title="Voltar ao MySys Games">
          <div className="header__mysys-icon">M</div>
          <span className="header__mysys-text">MYSYS GAMES</span>
        </a>
        <nav className="header__simple-nav">
          <a href={PORTAL_URL} className="header__simple-nav-item">Jogos</a>
        </nav>
        <button onClick={login} className="header__btn header__btn--primary">
          Entrar
        </button>
      </header>
    );
  }

  // Full variant - main header with navigation
  return (
    <header className="header header--full">
      <div className="header__container">
        <Link to="/" className="header__logo">
          <div className="header__logo-icon">CF</div>
          <span className="header__logo-text">Champion Forge</span>
        </Link>

        {isAuthenticated && (
          <nav className="header__nav">
            <Link to="/lobby" className="header__nav-item">
              <svg className="header__nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Lobby
            </Link>
            <Link to="/game" className="header__nav-item">
              <svg className="header__nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Jogar
            </Link>
            <Link to="/profile" className="header__nav-item">
              <svg className="header__nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Perfil
            </Link>
            <Link to="/leaderboard" className="header__nav-item">
              <svg className="header__nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Ranking
            </Link>
          </nav>
        )}

        <div className="header__right">
          {onlineCount > 0 && (
            <div className="header__online-badge">
              <span className="header__online-dot" />
              <span>{onlineCount} online</span>
            </div>
          )}

          {isAuthenticated && user ? (
            <div className="header__user-card">
              <div className="header__avatar">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.display_name} />
                ) : (
                  <span>{user.display_name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="header__user-info">
                <span className="header__username">{user.display_name}</span>
              </div>
              <button onClick={handleLogout} className="header__btn header__btn--ghost" title="Sair">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="header__auth-buttons">
              <button onClick={login} className="header__btn header__btn--primary">
                Entrar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
