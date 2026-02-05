/**
 * Sistema de Estatísticas com Progressão (Estilo LoL Eternals)
 * Estatísticas que nunca param de contar, com milestones desbloqueáveis
 */

// Categorias de estatísticas
export type StatCategory = 'combat' | 'matches' | 'abilities';

// Definição de uma estatística
export interface StatDefinition {
  key: StatKey;
  name: string;
  description: string;
  icon: string; // emoji ou nome do ícone
  category: StatCategory;
  milestones: number[];
  xpPerMilestone: number[];
  format?: 'number' | 'time' | 'damage'; // como formatar o valor
}

// Chaves das estatísticas
export type StatKey =
  // Combate
  | 'kills'
  | 'deaths'
  | 'assists'
  | 'damageDealt'
  | 'damageTaken'
  // Partidas
  | 'gamesPlayed'
  | 'wins'
  | 'losses'
  | 'maxWinStreak'
  | 'timePlayed'
  // Habilidades
  | 'abilitiesUsed'
  | 'skillshotsHit'
  | 'dashesUsed'
  | 'criticalHits';

// Valores das estatísticas do usuário (vem do banco)
export interface UserStats {
  // Combate
  kills: number;
  deaths: number;
  assists: number;
  damageDealt: number;
  damageTaken: number;
  // Partidas
  gamesPlayed: number;
  wins: number;
  losses: number;
  winStreak: number;
  maxWinStreak: number;
  timePlayed: number; // em minutos
  // Habilidades
  abilitiesUsed: number;
  skillshotsHit: number;
  dashesUsed: number;
  criticalHits: number;
}

// Estado de progresso de uma estatística individual
export interface StatProgress {
  key: StatKey;
  value: number;
  previousMilestone: number;
  currentMilestone: number; // milestone atual (já alcançado)
  nextMilestone: number | null; // próximo milestone (ou null se completou tudo)
  progress: number; // 0-100% para o próximo milestone
  completedMilestones: number[]; // milestones já alcançados
  totalMilestones: number;
}

// Resposta completa de stats do usuário
export interface UserStatsResponse {
  userId: string;
  stats: UserStats;
  progress: StatProgress[];
  totalXpEarned: number;
  lastUpdated: string;
}

// Definições de todas as estatísticas
export const STAT_DEFINITIONS: StatDefinition[] = [
  // === COMBATE ===
  {
    key: 'kills',
    name: 'Eliminações',
    description: 'Total de inimigos eliminados',
    icon: '⚔️',
    category: 'combat',
    milestones: [1, 10, 50, 100, 500, 1000, 5000, 10000],
    xpPerMilestone: [10, 25, 50, 100, 250, 500, 1000, 2000],
  },
  {
    key: 'deaths',
    name: 'Mortes',
    description: 'Vezes que você morreu',
    icon: '💀',
    category: 'combat',
    milestones: [1, 10, 50, 100, 500, 1000],
    xpPerMilestone: [5, 10, 25, 50, 100, 200],
  },
  {
    key: 'assists',
    name: 'Assistências',
    description: 'Assistências em eliminações',
    icon: '🤝',
    category: 'combat',
    milestones: [1, 10, 50, 100, 500, 1000, 5000],
    xpPerMilestone: [10, 20, 40, 80, 200, 400, 800],
  },
  {
    key: 'damageDealt',
    name: 'Dano Causado',
    description: 'Total de dano causado a inimigos',
    icon: '💥',
    category: 'combat',
    milestones: [1000, 10000, 100000, 500000, 1000000, 5000000],
    xpPerMilestone: [20, 50, 150, 400, 1000, 2500],
    format: 'damage',
  },
  {
    key: 'damageTaken',
    name: 'Dano Recebido',
    description: 'Total de dano recebido',
    icon: '🛡️',
    category: 'combat',
    milestones: [1000, 10000, 100000, 500000, 1000000],
    xpPerMilestone: [15, 40, 100, 300, 750],
    format: 'damage',
  },

  // === PARTIDAS ===
  {
    key: 'gamesPlayed',
    name: 'Partidas',
    description: 'Total de partidas jogadas',
    icon: '🎮',
    category: 'matches',
    milestones: [1, 10, 50, 100, 500, 1000],
    xpPerMilestone: [10, 30, 75, 150, 500, 1000],
  },
  {
    key: 'wins',
    name: 'Vitórias',
    description: 'Total de partidas vencidas',
    icon: '🏆',
    category: 'matches',
    milestones: [1, 10, 50, 100, 500, 1000],
    xpPerMilestone: [15, 50, 125, 250, 750, 1500],
  },
  {
    key: 'losses',
    name: 'Derrotas',
    description: 'Total de partidas perdidas',
    icon: '😢',
    category: 'matches',
    milestones: [1, 10, 50, 100, 500],
    xpPerMilestone: [5, 15, 35, 75, 200],
  },
  {
    key: 'maxWinStreak',
    name: 'Maior Sequência',
    description: 'Maior sequência de vitórias',
    icon: '🔥',
    category: 'matches',
    milestones: [3, 5, 10, 15, 20, 30],
    xpPerMilestone: [25, 50, 150, 300, 500, 1000],
  },
  {
    key: 'timePlayed',
    name: 'Tempo de Jogo',
    description: 'Tempo total jogado',
    icon: '⏱️',
    category: 'matches',
    milestones: [60, 600, 3000, 6000, 30000, 60000], // em minutos: 1h, 10h, 50h, 100h, 500h, 1000h
    xpPerMilestone: [20, 100, 400, 800, 3000, 6000],
    format: 'time',
  },

  // === HABILIDADES ===
  {
    key: 'abilitiesUsed',
    name: 'Habilidades Usadas',
    description: 'Total de habilidades ativadas',
    icon: '✨',
    category: 'abilities',
    milestones: [100, 500, 1000, 5000, 10000, 50000],
    xpPerMilestone: [15, 40, 80, 300, 600, 2000],
  },
  {
    key: 'skillshotsHit',
    name: 'Skillshots Acertadas',
    description: 'Habilidades de skill acertadas',
    icon: '🎯',
    category: 'abilities',
    milestones: [10, 50, 100, 500, 1000, 5000],
    xpPerMilestone: [20, 60, 120, 400, 800, 2500],
  },
  {
    key: 'dashesUsed',
    name: 'Dashes',
    description: 'Total de dashes executados',
    icon: '💨',
    category: 'abilities',
    milestones: [10, 50, 100, 500, 1000],
    xpPerMilestone: [10, 30, 60, 200, 400],
  },
  {
    key: 'criticalHits',
    name: 'Críticos',
    description: 'Hits críticos desferidos',
    icon: '⚡',
    category: 'abilities',
    milestones: [10, 50, 100, 500, 1000, 5000],
    xpPerMilestone: [15, 45, 90, 300, 600, 2000],
  },
];

// Helpers
export function getStatDefinition(key: StatKey): StatDefinition | undefined {
  return STAT_DEFINITIONS.find((s) => s.key === key);
}

export function getStatsByCategory(category: StatCategory): StatDefinition[] {
  return STAT_DEFINITIONS.filter((s) => s.category === category);
}

export function calculateStatProgress(
  definition: StatDefinition,
  value: number
): StatProgress {
  const { key, milestones } = definition;

  // Encontrar milestones completados
  const completedMilestones = milestones.filter((m) => value >= m);
  const currentMilestoneIndex = completedMilestones.length - 1;
  const nextMilestoneIndex = completedMilestones.length;

  const previousMilestone =
    currentMilestoneIndex >= 0 ? milestones[currentMilestoneIndex] : 0;
  const currentMilestone = previousMilestone;
  const nextMilestone =
    nextMilestoneIndex < milestones.length ? milestones[nextMilestoneIndex] : null;

  // Calcular progresso para o próximo milestone
  let progress = 0;
  if (nextMilestone !== null) {
    const range = nextMilestone - previousMilestone;
    const current = value - previousMilestone;
    progress = Math.min(100, (current / range) * 100);
  } else {
    progress = 100; // Completou todos os milestones
  }

  return {
    key,
    value,
    previousMilestone,
    currentMilestone,
    nextMilestone,
    progress,
    completedMilestones,
    totalMilestones: milestones.length,
  };
}

// Formatar valor baseado no tipo
export function formatStatValue(
  value: number,
  format?: 'number' | 'time' | 'damage'
): string {
  switch (format) {
    case 'time': {
      // valor está em minutos
      if (value < 60) return `${value}m`;
      const hours = Math.floor(value / 60);
      const mins = value % 60;
      if (hours < 1000) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
      return `${(hours / 1000).toFixed(1)}K h`;
    }
    case 'damage': {
      if (value < 1000) return value.toString();
      if (value < 1000000) return `${(value / 1000).toFixed(1)}K`;
      return `${(value / 1000000).toFixed(2)}M`;
    }
    default: {
      if (value < 1000) return value.toString();
      if (value < 1000000) return `${(value / 1000).toFixed(1)}K`;
      return `${(value / 1000000).toFixed(2)}M`;
    }
  }
}

// Formatar milestone para exibição
export function formatMilestone(
  value: number,
  format?: 'number' | 'time' | 'damage'
): string {
  if (format === 'time') {
    // valor está em minutos
    const hours = value / 60;
    if (hours < 1) return `${value}m`;
    if (hours < 1000) return `${hours}h`;
    return `${hours / 1000}Kh`;
  }
  if (value < 1000) return value.toString();
  if (value < 1000000) return `${value / 1000}K`;
  return `${value / 1000000}M`;
}

// Stats iniciais (zeradas)
export const INITIAL_USER_STATS: UserStats = {
  kills: 0,
  deaths: 0,
  assists: 0,
  damageDealt: 0,
  damageTaken: 0,
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  winStreak: 0,
  maxWinStreak: 0,
  timePlayed: 0,
  abilitiesUsed: 0,
  skillshotsHit: 0,
  dashesUsed: 0,
  criticalHits: 0,
};
