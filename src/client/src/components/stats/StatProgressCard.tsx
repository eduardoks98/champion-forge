import { useEffect, useState } from 'react';
import {
  StatProgress,
  StatDefinition,
  formatStatValue,
  formatMilestone,
} from '@champion-forge/shared';
import './StatProgressCard.css';

interface Props {
  stat: StatProgress;
  definition: StatDefinition;
}

export default function StatProgressCard({ stat, definition }: Props) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [animatedValue, setAnimatedValue] = useState(0);

  // Animar barra de progresso
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(stat.progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [stat.progress]);

  // Animar contador
  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = stat.value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= stat.value) {
        setAnimatedValue(stat.value);
        clearInterval(timer);
      } else {
        setAnimatedValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [stat.value]);

  const getMilestoneState = (milestone: number): 'completed' | 'current' | 'locked' => {
    if (stat.completedMilestones.includes(milestone)) {
      return 'completed';
    }
    if (milestone === stat.nextMilestone) {
      return 'current';
    }
    return 'locked';
  };

  return (
    <div className="stat-card">
      {/* Header */}
      <div className="stat-card__header">
        <span className="stat-card__icon">{definition.icon}</span>
        <span className="stat-card__name">{definition.name}</span>
      </div>

      {/* Valor e próximo milestone */}
      <div className="stat-card__values">
        <span className="stat-card__current">
          {formatStatValue(animatedValue, definition.format)}
        </span>
        {stat.nextMilestone && (
          <>
            <span className="stat-card__separator">/</span>
            <span className="stat-card__next">
              {formatMilestone(stat.nextMilestone, definition.format)}
            </span>
          </>
        )}
      </div>

      {/* Barra de progresso */}
      <div className="stat-card__progress-container">
        <div
          className="stat-card__progress-bar"
          style={{ width: `${animatedProgress}%` }}
        />
        <span className="stat-card__progress-text">
          {stat.progress.toFixed(1)}%
        </span>
      </div>

      {/* Milestones */}
      <div className="stat-card__milestones">
        {definition.milestones.map((milestone, index) => {
          const state = getMilestoneState(milestone);
          return (
            <div
              key={milestone}
              className={`stat-card__milestone stat-card__milestone--${state}`}
              title={`${formatMilestone(milestone, definition.format)} - ${
                state === 'completed'
                  ? 'Completado!'
                  : state === 'current'
                  ? 'Em progresso'
                  : 'Bloqueado'
              } (+${definition.xpPerMilestone[index]} XP)`}
            >
              {state === 'completed' ? (
                <span className="stat-card__milestone-check">✓</span>
              ) : state === 'current' ? (
                <span className="stat-card__milestone-current">▶</span>
              ) : (
                <span className="stat-card__milestone-locked">○</span>
              )}
              <span className="stat-card__milestone-value">
                {formatMilestone(milestone, definition.format)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
