import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { StatProgressCard } from '../components/stats';
import {
  UserStatsResponse,
  getStatsByCategory,
  StatCategory,
} from '@champion-forge/shared';
import './Profile.css';

export default function Profile() {
  const { isAuthenticated, user, login, logout } = useAuth();
  const { onlineCount } = useSocket();
  const navigate = useNavigate();
  const [statsData, setStatsData] = useState<UserStatsResponse | null>(null);
  const [activeCategory, setActiveCategory] = useState<StatCategory>('combat');
  const [isLoading, setIsLoading] = useState(false);

  // Buscar stats do servidor
  useEffect(() => {
    if (!user?.id) return;

    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/stats/${user.id}`
        );
        if (response.ok) {
          const data = await response.json();
          setStatsData(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user?.id]);

  // Obter progresso de uma stat específica
  const getStatProgress = (statKey: string) => {
    return statsData?.progress.find((p) => p.key === statKey);
  };

  // Calcular win rate
  const calculateWinRate = () => {
    if (!statsData) return '0%';
    const { wins, gamesPlayed } = statsData.stats;
    if (gamesPlayed === 0) return '0%';
    return `${((wins / gamesPlayed) * 100).toFixed(1)}%`;
  };

  // Calcular K/D ratio
  const calculateKD = () => {
    if (!statsData) return '0.00';
    const { kills, deaths } = statsData.stats;
    if (deaths === 0) return kills > 0 ? kills.toFixed(2) : '0.00';
    return (kills / deaths).toFixed(2);
  };

  // Formatar tempo
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="profile">
        <Header variant="full" onlineCount={onlineCount} />
        <main className="profile__content">
          <div className="profile__container">
            <div className="profile__login-prompt">
              <div className="profile__login-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1>Faca Login para Ver seu Perfil</h1>
              <p>Entre com sua conta MySys para acessar suas estatisticas e configuracoes.</p>
              <button onClick={login} className="profile__btn profile__btn--primary">
                Entrar / Criar Conta
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="profile">
      <Header variant="full" onlineCount={onlineCount} />

      <main className="profile__content">
        <div className="profile__container">
          {/* Profile Header */}
          <div className="profile__header">
            <div className="profile__avatar-wrapper">
              <div className="profile__avatar">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.display_name} />
                ) : (
                  <span>{user.display_name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="profile__level">Lv 1</div>
            </div>
            <div className="profile__info">
              <h1 className="profile__name">{user.display_name}</h1>
              <p className="profile__username">@{user.username}</p>
              <p className="profile__member-since">Membro desde Janeiro 2025</p>
            </div>
            <div className="profile__actions">
              <button onClick={logout} className="profile__btn profile__btn--secondary">
                Sair da Conta
              </button>
            </div>
          </div>

          {/* Stats Overview - Resumo rápido */}
          <div className="profile__section">
            <h2 className="profile__section-title">Resumo</h2>
            <div className="profile__stats-grid">
              <div className="profile__stat-card">
                <span className="profile__stat-value">{statsData?.stats.gamesPlayed ?? 0}</span>
                <span className="profile__stat-label">Partidas</span>
              </div>
              <div className="profile__stat-card">
                <span className="profile__stat-value">{statsData?.stats.wins ?? 0}</span>
                <span className="profile__stat-label">Vitorias</span>
              </div>
              <div className="profile__stat-card">
                <span className="profile__stat-value">{calculateWinRate()}</span>
                <span className="profile__stat-label">Win Rate</span>
              </div>
              <div className="profile__stat-card">
                <span className="profile__stat-value">{statsData?.stats.kills ?? 0}</span>
                <span className="profile__stat-label">Kills</span>
              </div>
              <div className="profile__stat-card">
                <span className="profile__stat-value">{calculateKD()}</span>
                <span className="profile__stat-label">K/D</span>
              </div>
              <div className="profile__stat-card">
                <span className="profile__stat-value">{formatTime(statsData?.stats.timePlayed ?? 0)}</span>
                <span className="profile__stat-label">Tempo</span>
              </div>
            </div>
          </div>

          {/* Recent Matches */}
          <div className="profile__section">
            <h2 className="profile__section-title">Partidas Recentes</h2>
            <div className="profile__matches-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>Nenhuma partida encontrada</p>
              <button onClick={() => navigate('/lobby')} className="profile__btn profile__btn--primary">
                Jogar Agora
              </button>
            </div>
          </div>

          {/* Estatísticas com Progressão - Estilo LoL Eternals */}
          <div className="profile__section">
            <div className="profile__section-header">
              <h2 className="profile__section-title">Estatisticas</h2>
              {statsData && (
                <span className="profile__xp-total">
                  {statsData.totalXpEarned.toLocaleString()} XP ganho
                </span>
              )}
            </div>

            {/* Tabs de categoria */}
            <div className="profile__stats-tabs">
              <button
                className={`profile__stats-tab ${activeCategory === 'combat' ? 'profile__stats-tab--active' : ''}`}
                onClick={() => setActiveCategory('combat')}
              >
                Combate
              </button>
              <button
                className={`profile__stats-tab ${activeCategory === 'matches' ? 'profile__stats-tab--active' : ''}`}
                onClick={() => setActiveCategory('matches')}
              >
                Partidas
              </button>
              <button
                className={`profile__stats-tab ${activeCategory === 'abilities' ? 'profile__stats-tab--active' : ''}`}
                onClick={() => setActiveCategory('abilities')}
              >
                Habilidades
              </button>
            </div>

            {/* Lista de stats da categoria ativa */}
            <div className="profile__stats-list">
              {isLoading ? (
                <div className="profile__stats-loading">Carregando estatisticas...</div>
              ) : (
                getStatsByCategory(activeCategory).map((definition) => {
                  const progress = getStatProgress(definition.key);
                  if (!progress) return null;

                  return (
                    <StatProgressCard
                      key={definition.key}
                      stat={progress}
                      definition={definition}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
