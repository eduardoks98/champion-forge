import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Footer from '../components/layout/Footer';
import './Home.css';

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || 'http://localhost:8000';

export default function Home() {
  const { isAuthenticated, isLoading, login, logout, user } = useAuth();
  const { connect } = useSocket();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePlay = () => {
    if (!isAuthenticated) {
      login();
      return;
    }
    connect();
    navigate('/lobby');
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="loading-splash">
        <h1 className="loading-splash__title">CHAMPION FORGE</h1>
        <div className="loading-splash__spinner" />
      </div>
    );
  }

  return (
    <div className="landing">
      {/* Header igual portal MySys Games */}
      <header className="landing__header">
        <div className="landing__header-content">
          <div className="landing__header-left">
            <a href={PORTAL_URL} className="landing__logo">
              <div className="landing__logo-icon">M</div>
              <span>MySys Games</span>
            </a>
          </div>
          <div className="landing__header-right">
            {isAuthenticated && user ? (
              <div
                ref={dropdownRef}
                className={`user-profile ${dropdownOpen ? 'open' : ''}`}
              >
                <div
                  className="user-profile-trigger"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" className="user-avatar" />
                  ) : (
                    <div className="user-avatar user-avatar--placeholder">
                      {(user.nickname || user.display_name || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="user-name">{user.nickname || user.display_name}</span>
                  <svg className="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
                {dropdownOpen && (
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="Avatar" className="user-avatar-large" />
                      ) : (
                        <div className="user-avatar-large user-avatar--placeholder">
                          {(user.nickname || user.display_name || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="dropdown-header-info">
                        <div className="user-name-large">{user.nickname || user.display_name}</div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </div>
                    <div className="dropdown-menu">
                      <button className="dropdown-item logout" onClick={handleLogout}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                          <polyline points="16,17 21,12 16,7"/>
                          <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Sair
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={login} className="btn-login btn-primary-outline">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                </svg>
                <span>Entrar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing__hero">
        <div className="landing__hero-content">
          <h1 className="landing__title">
            CHAMPION<span className="landing__title-accent">FORGE</span>
          </h1>
          <p className="landing__tagline">MOBA Arena Multiplayer</p>
          <p className="landing__description">
            Crie seu campeao, escolha suas habilidades e domine a arena.
            Enfrente outros jogadores em batalhas intensas estilo MOBA.
          </p>

          <div className="landing__cta">
            {isAuthenticated ? (
              <button onClick={handlePlay} className="landing__btn landing__btn--primary">
                Multiplayer
              </button>
            ) : (
              <button onClick={login} className="landing__btn landing__btn--gold">
                Entrar / Criar Conta
              </button>
            )}
          </div>
        </div>

        {/* Visual Element */}
        <div className="landing__hero-visual">
          <div className="landing__game-icon">
            <svg viewBox="0 0 100 100" width="200" height="200">
              {/* Outer ring */}
              <circle cx="50" cy="50" r="45" fill="none" stroke="#d4a418" strokeWidth="2" opacity="0.3"/>
              <circle cx="50" cy="50" r="35" fill="none" stroke="#d4a418" strokeWidth="1" opacity="0.2"/>
              {/* Crossed swords */}
              <path d="M25 75 L75 25" stroke="#d4a418" strokeWidth="3" strokeLinecap="round"/>
              <path d="M75 75 L25 25" stroke="#d4a418" strokeWidth="3" strokeLinecap="round"/>
              {/* Sword handles */}
              <circle cx="25" cy="75" r="5" fill="#d4a418" opacity="0.8"/>
              <circle cx="75" cy="75" r="5" fill="#d4a418" opacity="0.8"/>
              <circle cx="25" cy="25" r="5" fill="#d4a418" opacity="0.8"/>
              <circle cx="75" cy="25" r="5" fill="#d4a418" opacity="0.8"/>
              {/* Center */}
              <circle cx="50" cy="50" r="8" fill="#d4a418" opacity="0.6"/>
            </svg>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="landing__features-section">
        <h2 className="landing__section-title">Por que jogar Champion Forge?</h2>
        <div className="landing__features">
          <div className="landing__feature">
            <div className="landing__feature-icon">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#d4a418" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <h3>Combate LoL-Style</h3>
            <p>Sistema de targeting e auto-attack inspirado nos melhores MOBAs do mercado.</p>
          </div>
          <div className="landing__feature">
            <div className="landing__feature-icon">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#d4a418" strokeWidth="2">
                <path d="M14.5 4h-5L7 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-3l-2.5-3z"/>
                <circle cx="12" cy="13" r="3"/>
              </svg>
            </div>
            <h3>36 Armas Unicas</h3>
            <p>Escolha entre espadas, machados, arcos e muito mais. Cada arma com atributos unicos.</p>
          </div>
          <div className="landing__feature">
            <div className="landing__feature-icon">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#d4a418" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <h3>105 Habilidades</h3>
            <p>Combine habilidades de magia, fisico e suporte para criar builds unicas.</p>
          </div>
          <div className="landing__feature">
            <div className="landing__feature-icon">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#d4a418" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                <path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <h3>Multiplayer Online</h3>
            <p>Jogue com amigos ou desafie jogadores do mundo todo em batalhas epicas.</p>
          </div>
        </div>
      </section>

      {/* How to Play Section */}
      <section className="landing__howto">
        <h2 className="landing__section-title">Como Jogar</h2>
        <div className="landing__steps">
          <div className="landing__step">
            <div className="landing__step-number">1</div>
            <h3>Crie sua Conta</h3>
            <p>Faca login com sua conta MySys Games para comecar a jogar.</p>
          </div>
          <div className="landing__step">
            <div className="landing__step-number">2</div>
            <h3>Monte seu Campeao</h3>
            <p>Escolha sua arma e selecione as habilidades que combinam com seu estilo.</p>
          </div>
          <div className="landing__step">
            <div className="landing__step-number">3</div>
            <h3>Entre na Arena</h3>
            <p>Encontre uma partida ou crie uma sala privada com amigos.</p>
          </div>
          <div className="landing__step">
            <div className="landing__step-number">4</div>
            <h3>Domine e Venca</h3>
            <p>Use suas habilidades, elimine inimigos e seja o ultimo sobrevivente!</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
