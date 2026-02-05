import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameCanvas from '../components/GameCanvas';
import { GameStats } from '../game/engine/GameEngine';
import { useAuth } from '../context/AuthContext';
import './Game.css';

export default function Game() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<GameStats>({
    fps: 60,
    entities: 0,
    particles: 0,
    statusEffects: 0,
  });

  // Redirecionar se nao autenticado (igual Bangshot)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/');
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Loading enquanto verifica auth
  if (isLoading) {
    return (
      <div className="game-page game-page--loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  // Nao renderizar se nao autenticado (vai redirecionar)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="game-page">
      <div className="game-stats-bar">
        <span>FPS: {stats.fps}</span>
        <span>Entities: {stats.entities}</span>
        <span>Particles: {stats.particles}</span>
        <span>Effects: {stats.statusEffects}</span>
      </div>

      <main className="game-main">
        <GameCanvas onStatsUpdate={setStats} />
      </main>
    </div>
  );
}
