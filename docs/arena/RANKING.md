# Sistema de Ranking

## Visao Geral

Sistema competitivo baseado em LP (League Points) e MMR (Matchmaking Rating).

---

## Tiers e Divisoes

```
┌─────────────────────────────────────────────────────────────┐
│                    RANKING LADDER                           │
│                                                             │
│   CHALLENGER     Top 100 players                            │
│   GRANDMASTER    Top 500 players                            │
│   MASTER         2000+ LP                                   │
│   ─────────────────────────────────────────────────         │
│   DIAMOND IV-I   1600-2000 LP                               │
│   PLATINUM IV-I  1200-1600 LP                               │
│   GOLD IV-I      800-1200 LP                                │
│   SILVER IV-I    400-800 LP                                 │
│   BRONZE IV-I    0-400 LP                                   │
│   ─────────────────────────────────────────────────         │
│   IRON IV-I      Placement (10 games)                       │
└─────────────────────────────────────────────────────────────┘
```

### Detalhes por Tier

| Tier | LP Range | Divisoes | Promocao | Decay |
|------|----------|----------|----------|-------|
| Iron | - | IV-I | 10 placements | Nao |
| Bronze | 0-400 | IV-I | 100 LP | Nao |
| Silver | 400-800 | IV-I | 100 LP | Nao |
| Gold | 800-1200 | IV-I | 100 LP | Nao |
| Platinum | 1200-1600 | IV-I | 100 LP | Sim |
| Diamond | 1600-2000 | IV-I | 100 LP | Sim |
| Master | 2000+ | - | - | Sim |
| Grandmaster | Top 500 | - | - | Sim |
| Challenger | Top 100 | - | - | Sim |

---

## Sistema de LP

### Ganho/Perda de LP

```typescript
interface LPCalculation {
  // Base LP
  baseWin: 25;
  baseLoss: -20;

  // Modificadores
  modifiers: {
    // MMR vs Rank
    mmrHigherThanRank: '+5 LP';    // MMR maior que rank
    mmrLowerThanRank: '-5 LP';     // MMR menor que rank

    // Performance
    mvp: '+3 LP';                   // MVP da partida
    highKDA: '+2 LP';               // KDA > 5
    firstBlood: '+1 LP';            // Primeiro sangue

    // Streaks
    winStreak3: '+2 LP';
    winStreak5: '+5 LP';
    lossStreak3: '-2 LP';           // Protecao
  };
}
```

### Calculo de LP

```typescript
const calculateLP = (
  result: 'win' | 'loss',
  playerMMR: number,
  opponentMMR: number,
  performance: PerformanceStats
): number => {
  // Base
  let lp = result === 'win' ? 25 : -20;

  // MMR difference adjustment
  const mmrDiff = opponentMMR - playerMMR;
  const mmrBonus = Math.floor(mmrDiff / 100) * 2;
  lp += result === 'win' ? mmrBonus : -mmrBonus;

  // Performance bonus (apenas para vitoria)
  if (result === 'win') {
    if (performance.isMVP) lp += 3;
    if (performance.kda > 5) lp += 2;
    if (performance.firstBlood) lp += 1;
  }

  // Streak adjustment
  if (performance.winStreak >= 5) lp += 5;
  else if (performance.winStreak >= 3) lp += 2;
  else if (performance.lossStreak >= 3 && result === 'loss') {
    lp = Math.max(lp, -15); // Protecao
  }

  // Clamp
  return Math.max(-30, Math.min(35, lp));
};

// Exemplos:
// Vitoria normal: +25 LP
// Vitoria vs MMR maior: +27-30 LP
// Vitoria com MVP: +28 LP
// Derrota normal: -20 LP
// Derrota vs MMR maior: -15 LP
// Derrota com loss protection: -15 LP
```

---

## Sistema de MMR

### O que e MMR?

MMR (Matchmaking Rating) e um numero oculto que representa sua habilidade real.
Usado para matchmaking e ajuste de LP.

```typescript
interface MMR {
  value: number;           // 1000-3000 tipicamente
  confidence: number;      // 0-1 (quao certo o sistema esta)
  lastUpdate: Date;
}
```

### Calculo de MMR

```typescript
const updateMMR = (
  playerMMR: number,
  opponentMMR: number,
  result: 'win' | 'loss',
  kFactor: number = 32
): number => {
  // ELO formula
  const expected = 1 / (1 + Math.pow(10, (opponentMMR - playerMMR) / 400));
  const actual = result === 'win' ? 1 : 0;
  const newMMR = playerMMR + kFactor * (actual - expected);

  return Math.round(newMMR);
};

// Exemplos:
// 1500 MMR vs 1500 MMR, win: +16 MMR
// 1500 MMR vs 1700 MMR, win: +24 MMR
// 1500 MMR vs 1300 MMR, win: +8 MMR
```

### K-Factor Dinamico

```typescript
const getKFactor = (
  gamesPlayed: number,
  currentMMR: number
): number => {
  // Novos jogadores: mudanca rapida
  if (gamesPlayed < 30) return 40;

  // Jogadores estabelecidos
  if (currentMMR < 1600) return 32;
  if (currentMMR < 2000) return 24;

  // Alto elo: mudanca lenta
  return 16;
};
```

---

## Promocao e Rebaixamento

### Promocao

```typescript
const promotionRules = {
  // Dentro do mesmo tier (ex: Silver III -> Silver II)
  sameTier: {
    requirement: '100 LP',
    promoSeries: false, // Promocao automatica
  },

  // Entre tiers (ex: Silver I -> Gold IV)
  betweenTiers: {
    requirement: '100 LP',
    promoSeries: {
      bestOf: 3,        // Melhor de 3
      winsNeeded: 2,
    },
  },

  // Para Master+
  toMaster: {
    requirement: '100 LP em Diamond I',
    promoSeries: {
      bestOf: 5,        // Melhor de 5
      winsNeeded: 3,
    },
  },
};
```

### Rebaixamento

```typescript
const demotionRules = {
  // Dentro do mesmo tier
  sameTier: {
    trigger: '0 LP + derrota',
    protection: 'shield se recem promovido (3 jogos)',
  },

  // Entre tiers
  betweenTiers: {
    trigger: '0 LP + derrotas consecutivas',
    demotionShield: {
      games: 5,         // 5 jogos de protecao
      orLosses: 3,      // Ou 3 derrotas seguidas
    },
  },

  // De Master+
  fromMaster: {
    trigger: 'MMR abaixo de Diamond I',
    warning: 'Alerta quando proximo',
  },
};
```

---

## Seasons e Reset

### Duracao da Season

```typescript
const seasonStructure = {
  duration: '3 meses',
  splits: 2,            // 2 splits por season

  softReset: {
    // Formula: (MMR + 1200) / 2
    formula: (currentMMR) => Math.round((currentMMR + 1200) / 2),
    placements: 10,     // 10 jogos de placement
  },
};
```

### Rewards por Season

| Tier Alcancado | Reward |
|----------------|--------|
| Bronze | Border Bronze |
| Silver | Border Silver + Icon |
| Gold | Border Gold + Icon + Skin |
| Platinum | Border Plat + Icon + Skin + Emote |
| Diamond | Border Diamond + Tudo anterior + Titulo |
| Master+ | Border especial + Tudo + Titulo exclusivo |

---

## Matchmaking

### Criterios de Match

```typescript
const matchmakingCriteria = {
  // Prioridade 1: MMR similar
  mmrRange: {
    initial: 100,       // +/- 100 MMR
    expansion: {
      interval: 30,     // Segundos
      amount: 50,       // Expande +50 a cada 30s
      maxExpansion: 400,
    },
  },

  // Prioridade 2: Tempo de fila
  queueTime: {
    targetMatch: '2 min',
    forceMatch: '5 min',  // Aceita qualquer MMR
  },

  // Prioridade 3: Rank similar
  rankPreference: {
    maxTierDiff: 1,     // Maximo 1 tier de diferenca
    flexibleAfter: '3 min',
  },

  // Party balance
  partyHandling: {
    averageMMR: true,   // Usa media do grupo
    mmrPenalty: 50,     // +50 MMR por membro extra
  },
};
```

### Qualidade do Match

```typescript
const matchQuality = (team1: Player[], team2: Player[]): number => {
  const avgMMR1 = average(team1.map(p => p.mmr));
  const avgMMR2 = average(team2.map(p => p.mmr));
  const diff = Math.abs(avgMMR1 - avgMMR2);

  // 100 = perfeito, 0 = terrivel
  return Math.max(0, 100 - diff / 5);
};
```

---

## Decay (Inatividade)

### Regras de Decay

```typescript
const decayRules = {
  // Apenas para Platinum+
  minTier: 'platinum',

  // Dias de inatividade antes de decay
  gracePeriod: {
    platinum: 28,       // 28 dias
    diamond: 21,        // 21 dias
    master: 14,         // 14 dias
    grandmaster: 7,     // 7 dias
    challenger: 7,      // 7 dias
  },

  // LP perdido por dia apos grace period
  decayPerDay: {
    platinum: 25,
    diamond: 35,
    master: 50,
    grandmaster: 75,
    challenger: 100,
  },

  // Limite de decay
  maxDecay: {
    platinum: 'ate Gold I',
    diamond: 'ate Platinum I',
    master: 'ate Diamond I',
    grandmaster: 'ate Master',
    challenger: 'ate Master',
  },

  // Banked games (jogos de reserva)
  bankedGames: {
    max: 10,
    earnedPer: 'game_played',
    consumedPer: 'day_inactive',
  },
};
```

---

## Leaderboards

### Rankings Visiveis

```typescript
const leaderboards = {
  // Global
  global: {
    visible: 'top 1000',
    refresh: 'real_time',
  },

  // Por Tier
  perTier: {
    visible: 'all in tier',
    showRank: true,
  },

  // Por Regiao (futuro)
  regional: {
    regions: ['BR', 'NA', 'EU'],
    showServer: true,
  },

  // Friends
  friends: {
    visible: 'all friends',
    comparison: true,
  },
};
```

### Informacoes Mostradas

| Campo | Visivel |
|-------|---------|
| Rank | Sempre |
| Tier/Divisao | Sempre |
| LP | Sempre |
| Win Rate | Sempre |
| Games Played | Sempre |
| MMR | Nunca (oculto) |
| Match History | Publico (ultimos 20) |

---

## Anti-Boost/Smurf

### Deteccao

```typescript
const antiAbuse = {
  // Deteccao de smurf
  smurfDetection: {
    triggers: [
      'win_rate > 80% em 20 jogos',
      'KDA > 10 consistentemente',
      'climb muito rapido',
    ],
    action: 'fast_mmr_adjustment', // Sobe MMR rapidamente
  },

  // Deteccao de boost
  boostDetection: {
    triggers: [
      'IP/device diferente',
      'horarios de jogo muito diferentes',
      'performance inconsistente',
    ],
    action: 'flag_for_review',
  },

  // Duo queue restrictions
  duoRestrictions: {
    maxTierDiff: 1,     // Maximo 1 tier de diferenca
    masterPlus: 'solo_only', // Master+ so solo
  },
};
```

---

## Estatisticas e Achievements

### Stats Trackados

```typescript
interface RankedStats {
  // Season atual
  currentSeason: {
    gamesPlayed: number;
    wins: number;
    losses: number;
    winRate: number;
    peakRank: string;
    currentRank: string;
    lpGained: number;
    lpLost: number;
  };

  // All-time
  allTime: {
    totalGames: number;
    peakRank: string;
    seasonsPlayed: number;
    bestWinStreak: number;
  };

  // Per champion/build
  perBuild: {
    buildId: string;
    gamesPlayed: number;
    winRate: number;
    avgKDA: number;
  }[];
}
```

### Achievements de Ranked

| Achievement | Requisito | Reward |
|-------------|-----------|--------|
| First Steps | Completar placements | Icon |
| Silver Lining | Alcancar Silver | Border |
| Golden Touch | Alcancar Gold | Skin |
| Platinum Club | Alcancar Platinum | Titulo |
| Diamond in the Rough | Alcancar Diamond | Titulo raro |
| Master of the Arena | Alcancar Master | Titulo + emote |
| Top 100 | Alcancar Challenger | Titulo unico |
| Win Streak | 10 vitorias seguidas | Emote |
| Climb King | Subir 2 tiers em 1 semana | Icon |

---

## Proximos Documentos

- [MATCHMAKING.md](./MATCHMAKING.md) - Algoritmo detalhado
- [BALANCE.md](./BALANCE.md) - Balanceamento de arena
- [MODES.md](./MODES.md) - Modos de jogo
