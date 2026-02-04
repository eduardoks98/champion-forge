# Sistema de Matchmaking

## Visao Geral

O matchmaking do Champion Forge utiliza um sistema hibrido que balanceia tempo de espera, qualidade das partidas e diversidade de builds.

---

## Algoritmo Principal

### 1. MMR (Matchmaking Rating)

```typescript
interface PlayerMMR {
  rating: number;           // Numero base (padrao: 1200)
  deviation: number;        // Incerteza (padrao: 350)
  volatility: number;       // Mudanca recente (0.06)
  gamesPlayed: number;
  lastPlayed: Date;
}

// Sistema Glicko-2 simplificado
const INITIAL_MMR = 1200;
const INITIAL_DEVIATION = 350;
const MIN_DEVIATION = 60;
const MAX_DEVIATION = 500;
```

### 2. Calculo de MMR

```typescript
function calculateMMRChange(
  winner: PlayerMMR,
  loser: PlayerMMR,
  kFactor: number = 32
): { winnerGain: number; loserLoss: number } {
  // Probabilidade esperada
  const expectedWinner = 1 / (1 + Math.pow(10, (loser.rating - winner.rating) / 400));
  const expectedLoser = 1 - expectedWinner;

  // Ajuste baseado em incerteza
  const winnerK = kFactor * (1 + (winner.deviation / 350));
  const loserK = kFactor * (1 + (loser.deviation / 350));

  // Ganhos/Perdas
  const winnerGain = Math.round(winnerK * (1 - expectedWinner));
  const loserLoss = Math.round(loserK * expectedLoser);

  return { winnerGain, loserLoss };
}

// Exemplos:
// MMR similar (1200 vs 1200): +16 / -16
// Upset (1000 vence 1400): +32 / -32
// Esperado (1400 vence 1000): +8 / -8
```

---

## Filas de Matchmaking

### Tipos de Fila

| Fila | Jogadores | MMR Usado | Restricoes |
|------|-----------|-----------|------------|
| **Solo/Duo Ranked** | 1-2 | Individual | Diferenca max 300 MMR em duo |
| **Flex Ranked** | 1-5 | Team + Individual | Aceita premades |
| **Normal** | 1-5 | Separado | Sem restricoes |
| **Custom** | 1-10 | Nenhum | Salas privadas |

### Configuracao por Modo

```typescript
interface QueueConfig {
  mode: '3v3' | '5v5';
  queueType: 'solo_duo' | 'flex' | 'normal';

  // Tempo de espera
  initialSearchRange: number;    // Range inicial de MMR
  expandRatePerSecond: number;   // Quanto expande por segundo
  maxSearchRange: number;        // Maximo range

  // Limites
  maxWaitTime: number;           // Segundos max na fila
  minPlayersToStart: number;     // Minimo para comecar

  // Restricoes
  allowPremades: boolean;
  maxPremadeSize: number;
  premadeMmrDifference: number;  // Max MMR diff em premade
}

const QUEUE_CONFIGS: Record<string, QueueConfig> = {
  'ranked_3v3': {
    mode: '3v3',
    queueType: 'solo_duo',
    initialSearchRange: 100,
    expandRatePerSecond: 10,
    maxSearchRange: 400,
    maxWaitTime: 300,
    minPlayersToStart: 6,
    allowPremades: true,
    maxPremadeSize: 2,
    premadeMmrDifference: 300,
  },

  'ranked_5v5': {
    mode: '5v5',
    queueType: 'solo_duo',
    initialSearchRange: 150,
    expandRatePerSecond: 15,
    maxSearchRange: 500,
    maxWaitTime: 600,
    minPlayersToStart: 10,
    allowPremades: true,
    maxPremadeSize: 2,
    premadeMmrDifference: 300,
  },

  'flex_5v5': {
    mode: '5v5',
    queueType: 'flex',
    initialSearchRange: 200,
    expandRatePerSecond: 20,
    maxSearchRange: 600,
    maxWaitTime: 600,
    minPlayersToStart: 10,
    allowPremades: true,
    maxPremadeSize: 5,
    premadeMmrDifference: 500,
  },

  'normal': {
    mode: '5v5',
    queueType: 'normal',
    initialSearchRange: 300,
    expandRatePerSecond: 30,
    maxSearchRange: 1000,
    maxWaitTime: 180,
    minPlayersToStart: 10,
    allowPremades: true,
    maxPremadeSize: 5,
    premadeMmrDifference: 1000,
  },
};
```

---

## Processo de Matchmaking

### Fluxo Completo

```
1. ENTRAR NA FILA
   ├── Validar requisitos (level, restrictions)
   ├── Registrar no pool de matchmaking
   └── Iniciar busca

2. BUSCA DE PARTIDA
   ├── A cada 1s: verificar matches possiveis
   ├── Expandir range se necessario
   └── Priorizar qualidade vs tempo

3. MATCH ENCONTRADO
   ├── Notificar todos jogadores
   ├── Aguardar confirmacao (30s)
   └── Timeout = voltar para fila

4. CONFIRMACAO
   ├── Todos aceitam: criar partida
   ├── Alguem recusa: voltar para fila
   └── Timeout: penalidade + voltar

5. DRAFT/SELECAO
   ├── Selecao de personagem
   ├── Verificar loadouts
   └── Iniciar partida
```

### Algoritmo de Match

```typescript
interface QueueEntry {
  id: string;
  players: string[];           // IDs dos jogadores
  avgMMR: number;              // Media do grupo
  mmrRange: { min: number; max: number };
  searchRange: number;         // Range atual de busca
  queueTime: number;           // Segundos na fila
  isFlexible: boolean;         // Aceita range maior
}

function findMatch(entries: QueueEntry[]): Match | null {
  // Ordenar por tempo na fila (prioridade)
  const sorted = entries.sort((a, b) => b.queueTime - a.queueTime);

  for (const entry of sorted) {
    // Buscar oponentes compativeis
    const opponents = findCompatibleOpponents(entry, entries);

    if (opponents) {
      // Verificar balanceamento
      const teams = balanceTeams([entry, ...opponents]);

      if (isBalanced(teams)) {
        return createMatch(teams);
      }
    }
  }

  return null;
}

function findCompatibleOpponents(
  seeker: QueueEntry,
  pool: QueueEntry[]
): QueueEntry[] | null {
  const needed = calculateNeededPlayers(seeker);
  const compatible: QueueEntry[] = [];

  for (const entry of pool) {
    if (entry.id === seeker.id) continue;

    // Verificar overlap de range
    const mmrDiff = Math.abs(seeker.avgMMR - entry.avgMMR);
    const maxRange = Math.max(seeker.searchRange, entry.searchRange);

    if (mmrDiff <= maxRange) {
      compatible.push(entry);

      // Verificar se temos jogadores suficientes
      const totalPlayers = sumPlayers([seeker, ...compatible]);
      if (totalPlayers >= needed) {
        return compatible;
      }
    }
  }

  return null;
}
```

---

## Balanceamento de Times

### Criterios

```typescript
interface TeamBalanceFactors {
  mmrDifference: number;       // Max diff entre times
  roleDistribution: boolean;   // Diversidade de roles
  premadeBalance: boolean;     // Premades nos dois lados
  buildDiversity: boolean;     // Evitar builds iguais
}

function balanceTeams(
  players: Player[],
  mode: '3v3' | '5v5'
): { team1: Player[]; team2: Player[] } {
  const teamSize = mode === '3v3' ? 3 : 5;

  // Ordenar por MMR
  const sorted = players.sort((a, b) => b.mmr - a.mmr);

  // Distribuir snake-style (1-2-2-2-1)
  const team1: Player[] = [];
  const team2: Player[] = [];

  sorted.forEach((player, index) => {
    const round = Math.floor(index / 2);
    const isEvenRound = round % 2 === 0;

    if ((index % 2 === 0) === isEvenRound) {
      team1.push(player);
    } else {
      team2.push(player);
    }
  });

  // Ajustar se necessario
  return optimizeBalance(team1, team2);
}

function optimizeBalance(
  team1: Player[],
  team2: Player[]
): { team1: Player[]; team2: Player[] } {
  const diff = getTeamMMR(team1) - getTeamMMR(team2);

  // Se diferenca > 50, tentar trocar
  if (Math.abs(diff) > 50) {
    // Encontrar troca que minimize diferenca
    const bestSwap = findBestSwap(team1, team2);

    if (bestSwap) {
      return applySwap(team1, team2, bestSwap);
    }
  }

  return { team1, team2 };
}
```

### Metricas de Qualidade

```typescript
interface MatchQuality {
  mmrBalance: number;          // 0-100 (100 = perfeito)
  waitTimeScore: number;       // 0-100 (100 = rapido)
  roleBalance: number;         // 0-100 (100 = diverso)
  premadeBalance: number;      // 0-100 (100 = equilibrado)
  overall: number;             // Media ponderada
}

function calculateMatchQuality(match: Match): MatchQuality {
  // MMR Balance (40% do peso)
  const mmrDiff = Math.abs(
    getTeamAvgMMR(match.team1) - getTeamAvgMMR(match.team2)
  );
  const mmrBalance = Math.max(0, 100 - (mmrDiff / 5));

  // Wait Time (30% do peso)
  const avgWait = getAverageWaitTime(match.players);
  const waitTimeScore = Math.max(0, 100 - (avgWait / 3));

  // Role Balance (20% do peso)
  const roleBalance = calculateRoleDiversity(match);

  // Premade Balance (10% do peso)
  const premadeBalance = calculatePremadeBalance(match);

  // Overall
  const overall = (
    mmrBalance * 0.4 +
    waitTimeScore * 0.3 +
    roleBalance * 0.2 +
    premadeBalance * 0.1
  );

  return { mmrBalance, waitTimeScore, roleBalance, premadeBalance, overall };
}
```

---

## Protecoes Anti-Abuse

### Restricoes de Duo

```typescript
interface DuoRestrictions {
  // Restricao por tier
  tierLimits: {
    'bronze': ['bronze', 'silver'],
    'silver': ['bronze', 'silver', 'gold'],
    'gold': ['silver', 'gold', 'platinum'],
    'platinum': ['gold', 'platinum', 'diamond'],
    'diamond': ['platinum', 'diamond'],
    'master': ['master', 'grandmaster'],
    'grandmaster': ['master', 'grandmaster', 'challenger'],
    'challenger': ['grandmaster', 'challenger'],
  };

  // Max MMR difference
  maxMMRDiff: 300;

  // Promoacoes devem ser solo
  promoRequiresSolo: true;
}

function canDuoWith(player1: Player, player2: Player): boolean {
  // Verificar tiers permitidos
  const allowedTiers = DuoRestrictions.tierLimits[player1.tier];
  if (!allowedTiers.includes(player2.tier)) {
    return false;
  }

  // Verificar MMR
  const mmrDiff = Math.abs(player1.mmr - player2.mmr);
  if (mmrDiff > DuoRestrictions.maxMMRDiff) {
    return false;
  }

  return true;
}
```

### Deteccao de Smurf

```typescript
interface SmurfDetection {
  // Indicadores
  indicators: {
    highWinRate: boolean;      // >70% nas primeiras 20 games
    abnormalKDA: boolean;      // KDA muito acima da media do tier
    fastClimb: boolean;        // Subiu muito rapido
    accountAge: boolean;       // Conta nova
  };

  // Score de suspeita (0-100)
  suspicionScore: number;
}

function detectSmurf(player: Player): SmurfDetection {
  const indicators = {
    highWinRate: player.winRate > 0.7 && player.gamesPlayed < 20,
    abnormalKDA: player.avgKDA > getTierAvgKDA(player.tier) * 2,
    fastClimb: player.lpGainedLast7Days > 500,
    accountAge: player.accountAge < 7, // dias
  };

  const suspicionScore = Object.values(indicators)
    .filter(v => v).length * 25;

  return { indicators, suspicionScore };
}

// Se suspicionScore > 75, colocar em "smurf queue"
// Smurf queue tem range de MMR mais amplo
```

### Penalidades de Dodge

```typescript
interface DodgePenalties {
  firstDodge: {
    lp: -3,
    timeout: 6 * 60,          // 6 minutos
    reset: 16 * 60 * 60,      // Reseta apos 16 horas
  };

  secondDodge: {
    lp: -10,
    timeout: 30 * 60,         // 30 minutos
    reset: 16 * 60 * 60,
  };

  thirdDodge: {
    lp: -10,
    timeout: 12 * 60 * 60,    // 12 horas
    reset: 24 * 60 * 60,
  };
}

function applyDodgePenalty(player: Player): void {
  player.dodgeCount++;

  const penalty = getDodgePenalty(player.dodgeCount);

  player.lp -= penalty.lp;
  player.queueTimeout = Date.now() + penalty.timeout * 1000;

  // Agendar reset
  scheduleReset(player, penalty.reset);
}
```

---

## Autofill e Roles

### Sistema de Roles (Futuro)

```typescript
// Para quando o jogo tiver roles definidas
interface RolePreference {
  primary: Role;
  secondary: Role;
  autofillProtection: number; // Games ate ser autofilled
}

type Role = 'damage' | 'tank' | 'support' | 'flex';

// Por enquanto, Champion Forge nao tem roles fixas
// Cada jogador escolhe seu personagem livremente
// Balanceamento e feito por MMR apenas
```

---

## Performance e Escalabilidade

### Otimizacoes

```typescript
// Cache de jogadores na fila
const queueCache = new Map<string, QueueEntry>();

// Indexacao por MMR range
const mmrBuckets = new Map<number, Set<string>>();

function addToQueue(entry: QueueEntry): void {
  queueCache.set(entry.id, entry);

  // Adicionar aos buckets de MMR (intervalos de 100)
  const bucket = Math.floor(entry.avgMMR / 100) * 100;

  if (!mmrBuckets.has(bucket)) {
    mmrBuckets.set(bucket, new Set());
  }
  mmrBuckets.get(bucket)!.add(entry.id);
}

function findInRange(mmr: number, range: number): QueueEntry[] {
  const results: QueueEntry[] = [];

  const minBucket = Math.floor((mmr - range) / 100) * 100;
  const maxBucket = Math.floor((mmr + range) / 100) * 100;

  for (let bucket = minBucket; bucket <= maxBucket; bucket += 100) {
    const entries = mmrBuckets.get(bucket);
    if (entries) {
      for (const id of entries) {
        const entry = queueCache.get(id);
        if (entry && Math.abs(entry.avgMMR - mmr) <= range) {
          results.push(entry);
        }
      }
    }
  }

  return results;
}
```

### Metricas de Monitoramento

```typescript
interface MatchmakingMetrics {
  // Tempos
  avgQueueTime: number;        // Segundos
  p50QueueTime: number;
  p95QueueTime: number;
  p99QueueTime: number;

  // Qualidade
  avgMatchQuality: number;     // 0-100
  mmrImbalanceRate: number;    // % de partidas com diff > 100

  // Volume
  gamesPerHour: number;
  playersInQueue: number;
  activeMatches: number;

  // Saude
  dodgeRate: number;
  afkRate: number;
  rematchRate: number;
}

// Dashboard de monitoramento
function getMatchmakingHealth(): 'healthy' | 'degraded' | 'unhealthy' {
  const metrics = getCurrentMetrics();

  if (metrics.avgQueueTime > 300 || metrics.avgMatchQuality < 70) {
    return 'unhealthy';
  }

  if (metrics.avgQueueTime > 180 || metrics.avgMatchQuality < 80) {
    return 'degraded';
  }

  return 'healthy';
}
```

---

## Eventos Socket.IO

### Client -> Server

```typescript
// Entrar na fila
socket.emit('queue:join', {
  queueType: 'ranked_3v3',
  partyMembers: ['player2_id'], // Opcional para duo
});

// Sair da fila
socket.emit('queue:leave');

// Aceitar partida encontrada
socket.emit('match:accept', { matchId: '...' });

// Recusar partida
socket.emit('match:decline', { matchId: '...' });
```

### Server -> Client

```typescript
// Atualizacao de status na fila
socket.emit('queue:status', {
  position: 15,
  estimatedWait: 45,
  searchRange: 150,
  playersInQueue: 234,
});

// Partida encontrada
socket.emit('match:found', {
  matchId: '...',
  mode: '3v3',
  avgMMR: 1250,
  timeToAccept: 30,
});

// Todos aceitaram
socket.emit('match:ready', {
  matchId: '...',
  team1: [...],
  team2: [...],
});

// Alguem nao aceitou
socket.emit('match:cancelled', {
  reason: 'player_declined',
});

// Erro na fila
socket.emit('queue:error', {
  code: 'DUO_MMR_TOO_HIGH',
  message: 'Diferenca de MMR muito alta para duo',
});
```

---

## Configuracoes por Horario

### Peak Hours

```typescript
interface TimeBasedConfig {
  // Horarios de pico (UTC-3 Brasil)
  peakHours: [19, 20, 21, 22, 23];

  // Durante pico: busca mais rigorosa
  peakSettings: {
    initialSearchRange: 80,
    expandRatePerSecond: 5,
    maxSearchRange: 300,
  };

  // Fora de pico: busca mais flexivel
  offPeakSettings: {
    initialSearchRange: 200,
    expandRatePerSecond: 20,
    maxSearchRange: 600,
  };
}

function getSearchSettings(): SearchSettings {
  const hour = new Date().getHours();
  const isPeak = TimeBasedConfig.peakHours.includes(hour);

  return isPeak
    ? TimeBasedConfig.peakSettings
    : TimeBasedConfig.offPeakSettings;
}
```

---

## Resumo do Sistema

| Aspecto | Configuracao |
|---------|--------------|
| **Algoritmo** | Glicko-2 simplificado |
| **MMR Inicial** | 1200 |
| **K-Factor** | 32 (ajustado por incerteza) |
| **Tempo Max Fila** | 5min (ranked), 3min (normal) |
| **Range Inicial** | 100-200 MMR |
| **Expansao** | 10-30 MMR/segundo |
| **Range Maximo** | 400-600 MMR |
| **Qualidade Minima** | 70/100 |

---

## Documentos Relacionados

- [RANKING.md](./RANKING.md) - Sistema de LP e Tiers
- [../technical/NETWORKING.md](../technical/NETWORKING.md) - Arquitetura Socket.IO
- [../GDD.md](../GDD.md) - Game Design Document
