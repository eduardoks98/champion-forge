# Arquitetura de Rede (Socket.IO)

## Visao Geral

Champion Forge usa Socket.IO para comunicacao real-time.
Dois modos de operacao: Mundo (hibrido) e Arena (server authoritative).

---

## Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (Browser)                        │
│                                                             │
│   [React App]                                               │
│      │                                                      │
│      ├── SocketContext (conexao)                            │
│      ├── GameStateContext (estado local)                    │
│      └── Canvas/Phaser (rendering)                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                    Socket.IO (WebSocket)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVIDOR (Node.js)                       │
│                                                             │
│   [Socket.IO Server]                                        │
│      │                                                      │
│      ├── AuthService (JWT validation)                       │
│      ├── RoomService (gestao de salas)                      │
│      ├── WorldService (PvE instances)                       │
│      └── ArenaService (PvP matches)                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE                                 │
│                                                             │
│   MySQL (persistent) + Redis (cache/sessions)               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## MUNDO ABERTO (Hibrido)

### Arquitetura

O mundo usa modelo hibrido para reduzir carga do servidor:

```typescript
const worldArchitecture = {
  // Client-side (reduz carga do servidor)
  clientSide: {
    mobSpawning: true,     // Seed deterministica
    mobAI: true,           // Comportamento local
    combatCalculation: true, // Dano calculado local
    movement: true,        // Sem prediction necessaria
  },

  // Server-side (previne cheat)
  serverSide: {
    lootDrops: true,       // Server decide drops
    questCompletion: true, // Valida no server
    inventory: true,       // Server authoritative
    characterStats: true,  // Salvo no server
    partySync: true,       // Sincroniza party
  },
};
```

### Eventos World

```typescript
// Cliente -> Servidor
interface WorldClientEvents {
  // Movimento (baixa frequencia - 10 Hz)
  position_update: {
    position: Vector2;
    zone: string;
    timestamp: number;
  };

  // Acoes
  mob_killed: {
    mobId: string;
    mobType: string;
    zone: string;
    position: Vector2;
  };

  quest_complete: {
    questId: string;
    objectives: QuestObjective[];
  };

  loot_request: {
    mobId: string;
    position: Vector2;
  };

  // Party
  party_invite: { targetId: string };
  party_accept: { partyId: string };
  party_leave: {};
}

// Servidor -> Cliente
interface WorldServerEvents {
  // Validacao de loot
  loot_granted: {
    items: Item[];
    gold: number;
    xp: number;
  };

  loot_denied: {
    reason: string;
  };

  // Party sync
  party_update: {
    members: PartyMember[];
    leader: string;
  };

  party_member_position: {
    playerId: string;
    position: Vector2;
    zone: string;
  };

  // Server events
  world_boss_spawn: {
    bossId: string;
    location: Vector2;
    timeToSpawn: number;
  };

  server_announcement: {
    type: 'event' | 'maintenance' | 'news';
    message: string;
  };
}
```

### Validacao Anti-Cheat (Mundo)

```typescript
const worldValidation = {
  // Validacao de kills
  mobKill: {
    maxKillsPerMinute: 30,     // Rate limit
    positionCheck: true,       // Precisa estar na zona
    levelCheck: true,          // Nao pode matar mob 20 levels acima
  },

  // Validacao de loot
  loot: {
    serverSideRNG: true,       // Drops calculados no server
    cooldownBetweenLoots: 100, // ms
    distanceCheck: 200,        // Precisa estar perto
  },

  // Validacao de quests
  quests: {
    objectiveVerification: true,
    timestampValidation: true,
  },
};
```

---

## ARENA (Server Authoritative)

### Arquitetura

Arena usa modelo 100% server authoritative:

```typescript
const arenaArchitecture = {
  tickRate: 60,              // 60 updates/segundo
  clientPrediction: true,    // Movimento predito no client
  serverReconciliation: true,
  lagCompensation: true,     // Rollback para hits

  // Sincronizacao
  sync: {
    positions: 'every_tick',
    abilities: 'on_use',
    damage: 'server_calculated',
    cooldowns: 'server_tracked',
  },
};
```

### Game Loop (Servidor)

```typescript
class ArenaGameLoop {
  private tickRate = 60;
  private tickInterval = 1000 / this.tickRate; // ~16.67ms

  start() {
    setInterval(() => this.tick(), this.tickInterval);
  }

  private tick() {
    const startTime = performance.now();

    // 1. Processar inputs dos jogadores
    this.processInputs();

    // 2. Atualizar fisica
    this.updatePhysics();

    // 3. Processar habilidades
    this.processAbilities();

    // 4. Detectar colisoes/hits
    this.detectCollisions();

    // 5. Aplicar dano
    this.applyDamage();

    // 6. Verificar condicoes de vitoria
    this.checkWinConditions();

    // 7. Broadcast state
    this.broadcastState();

    // Log se tick demorou muito
    const elapsed = performance.now() - startTime;
    if (elapsed > this.tickInterval) {
      console.warn(`Tick took ${elapsed}ms (target: ${this.tickInterval}ms)`);
    }
  }
}
```

### Eventos Arena

```typescript
// Cliente -> Servidor
interface ArenaClientEvents {
  // Input (alta frequencia)
  input: {
    sequence: number;        // Para reconciliation
    timestamp: number;
    movement: Vector2;       // Direcao de movimento
    rotation: number;        // Angulo do mouse
    actions: {
      attack?: boolean;
      block?: boolean;
      dodge?: Vector2;
      ability?: 1 | 2 | 3 | 4;
    };
  };

  // Shop
  buy_item: { itemId: string };
  sell_item: { itemId: string };

  // Match
  ready: {};
  surrender: {};
}

// Servidor -> Cliente
interface ArenaServerEvents {
  // State sync (60 Hz)
  game_state: {
    tick: number;
    timestamp: number;
    players: PlayerState[];
    projectiles: ProjectileState[];
    effects: EffectState[];
  };

  // Eventos de jogo
  player_hit: {
    attackerId: string;
    targetId: string;
    damage: number;
    position: Vector2;
    ability?: string;
  };

  player_died: {
    playerId: string;
    killerId: string;
    position: Vector2;
  };

  ability_used: {
    playerId: string;
    abilityId: string;
    position: Vector2;
    direction: Vector2;
  };

  // Match events
  round_start: {
    round: number;
    duration: number;
  };

  round_end: {
    winner: 'team1' | 'team2' | 'draw';
    scores: { team1: number; team2: number };
  };

  match_end: {
    winner: 'team1' | 'team2';
    stats: MatchStats;
    rewards: MatchRewards;
  };
}
```

### Client-Side Prediction

```typescript
class ClientPrediction {
  private pendingInputs: Input[] = [];
  private serverState: GameState;

  // Envia input e salva para reconciliation
  sendInput(input: Input) {
    input.sequence = this.nextSequence++;
    this.socket.emit('input', input);
    this.pendingInputs.push(input);

    // Aplica localmente (prediction)
    this.applyInput(this.localPlayer, input);
  }

  // Recebe state do servidor
  onServerState(state: GameState) {
    this.serverState = state;

    // Encontra ultimo input processado
    const lastProcessed = state.lastProcessedInput[this.playerId];

    // Remove inputs ja processados
    this.pendingInputs = this.pendingInputs.filter(
      i => i.sequence > lastProcessed
    );

    // Reconciliation: re-aplica inputs pendentes
    let position = state.players[this.playerId].position;
    for (const input of this.pendingInputs) {
      position = this.applyInput(position, input);
    }

    this.localPlayer.position = position;
  }
}
```

### Lag Compensation

```typescript
class LagCompensation {
  private stateHistory: GameState[] = [];
  private maxHistoryMs = 200; // 200ms de historico

  // Salva estados para rollback
  saveState(state: GameState) {
    this.stateHistory.push({
      ...state,
      timestamp: Date.now(),
    });

    // Remove estados muito antigos
    const cutoff = Date.now() - this.maxHistoryMs;
    this.stateHistory = this.stateHistory.filter(
      s => s.timestamp > cutoff
    );
  }

  // Verifica hit com compensacao de lag
  checkHit(
    shooter: Player,
    target: Player,
    clientTimestamp: number
  ): boolean {
    // Encontra estado mais proximo do timestamp do cliente
    const historicState = this.findStateAtTime(clientTimestamp);

    if (!historicState) {
      // Sem historico, usa estado atual
      return this.raycast(shooter.position, target.position);
    }

    // Usa posicao historica do alvo
    const targetPosition = historicState.players[target.id].position;
    return this.raycast(shooter.position, targetPosition);
  }
}
```

---

## Bandwidth e Otimizacao

### Estimativas de Bandwidth

| Modo | Jogadores | Upstream | Downstream |
|------|-----------|----------|------------|
| Mundo solo | 1 | ~0.5 KB/s | ~1 KB/s |
| Mundo party | 4 | ~1 KB/s | ~3 KB/s |
| Arena 3v3 | 6 | ~2 KB/s | ~8 KB/s |
| Arena 5v5 | 10 | ~3 KB/s | ~15 KB/s |

### Otimizacoes

```typescript
const optimizations = {
  // Delta compression
  deltaCompression: {
    enabled: true,
    description: 'Envia apenas mudancas, nao estado completo',
  },

  // Interest management
  interestManagement: {
    enabled: true,
    description: 'So envia entidades proximas ao jogador',
    range: 1000, // pixels
  },

  // Rate limiting
  rateLimiting: {
    input: 60,   // Max 60 inputs/s
    chat: 1,     // Max 1 msg/s
  },

  // Binary protocol (futuro)
  binaryProtocol: {
    enabled: false,
    description: 'Usar MessagePack em vez de JSON',
    savings: '30-50%',
  },
};
```

### Compression de State

```typescript
// Estado completo
interface FullPlayerState {
  id: string;
  position: { x: number; y: number };
  rotation: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  stamina: number;
  status: string[];
  animation: string;
  velocity: { x: number; y: number };
}

// Estado comprimido (delta)
interface DeltaPlayerState {
  id: string;
  p?: [number, number];  // position (se mudou)
  r?: number;            // rotation (se mudou)
  h?: number;            // health (se mudou)
  m?: number;            // mana (se mudou)
  s?: number;            // stamina (se mudou)
  st?: string[];         // status (se mudou)
  a?: string;            // animation (se mudou)
  v?: [number, number];  // velocity (se mudou)
}

// Reducao: ~200 bytes -> ~40 bytes por player
```

---

## Reconexao

### Fluxo de Reconexao

```typescript
const reconnectionFlow = {
  // Detectar desconexao
  detection: {
    heartbeatInterval: 5000,  // 5s
    timeout: 15000,           // 15s sem resposta = desconectado
  },

  // Mundo
  world: {
    gracePeriod: 300,         // 5 min
    preserveState: true,
    preservePosition: true,
    preserveParty: true,
  },

  // Arena
  arena: {
    gracePeriod: 60,          // 1 min
    pauseGame: true,          // Pausa para outros
    maxPauseTime: 120,        // 2 min total por time
    botReplacement: false,    // Nao substitui por bot
  },
};
```

### Implementacao

```typescript
class ReconnectionHandler {
  private reconnectAttempts = 0;
  private maxAttempts = 5;

  onDisconnect() {
    this.showReconnectingUI();
    this.attemptReconnect();
  }

  async attemptReconnect() {
    while (this.reconnectAttempts < this.maxAttempts) {
      this.reconnectAttempts++;

      try {
        await this.connect();
        await this.authenticate();
        await this.rejoinGame();
        this.hideReconnectingUI();
        return;
      } catch (e) {
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
        await sleep(delay);
      }
    }

    this.showDisconnectedUI();
  }

  async rejoinGame() {
    // Se estava em arena
    if (this.wasInArena) {
      await this.socket.emit('arena_rejoin', {
        matchId: this.lastMatchId,
        token: this.reconnectToken,
      });
    }

    // Se estava no mundo
    if (this.wasInWorld) {
      await this.socket.emit('world_rejoin', {
        characterId: this.lastCharacterId,
        position: this.lastPosition,
      });
    }
  }
}
```

---

## Seguranca

### Validacao de Input

```typescript
const inputValidation = {
  // Rate limiting
  maxInputsPerSecond: 60,

  // Validacao de movimento
  movement: {
    maxSpeed: 500,            // pixels/s
    maxAcceleration: 2000,
    teleportThreshold: 100,   // Se mover mais que isso, invalido
  },

  // Validacao de habilidades
  abilities: {
    cooldownServer: true,     // Server track cooldowns
    rangeValidation: true,
    targetValidation: true,
  },

  // Sequencing
  inputSequencing: {
    required: true,
    maxSequenceGap: 10,
    rejectOutOfOrder: false,  // Reordenar, nao rejeitar
  },
};
```

### Anti-Cheat Server-Side

```typescript
const serverSideAntiCheat = {
  // Deteccao de speedhack
  speedHack: {
    maxDistancePerTick: 15,   // pixels
    violations: 3,            // Antes de kick
  },

  // Deteccao de dano impossivel
  damageValidation: {
    maxDamagePerHit: 1000,
    cooldownRespect: true,
  },

  // Deteccao de position hack
  positionValidation: {
    pathfinding: true,        // Verifica se caminho e valido
    wallClipping: true,       // Detecta atravessar paredes
  },

  // Logging
  logging: {
    suspiciousActivity: true,
    reportToAdmin: true,
    autoban: {
      threshold: 10,          // Violacoes
      duration: '24h',
    },
  },
};
```

---

## Escalabilidade

### Arquitetura Multi-Server (Futuro)

```
┌─────────────────────────────────────────────────────────────┐
│                    LOAD BALANCER                            │
│                    (Nginx/HAProxy)                          │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌──────────┐        ┌──────────┐        ┌──────────┐
    │ Gateway  │        │ Gateway  │        │ Gateway  │
    │ Server 1 │        │ Server 2 │        │ Server 3 │
    └──────────┘        └──────────┘        └──────────┘
          │                   │                   │
          └───────────────────┴───────────────────┘
                              │
                    ┌─────────────────┐
                    │  Message Queue  │
                    │    (Redis)      │
                    └─────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌──────────┐        ┌──────────┐        ┌──────────┐
    │  Arena   │        │  Arena   │        │  World   │
    │ Server 1 │        │ Server 2 │        │ Server 1 │
    └──────────┘        └──────────┘        └──────────┘
```

---

## Metricas

### Monitoramento

```typescript
const metrics = {
  // Performance
  tickTime: 'average tick processing time',
  tickOverruns: 'ticks that exceeded budget',
  playerCount: 'concurrent players',

  // Network
  bandwidth: 'bytes/second per player',
  latency: 'average round trip time',
  packetLoss: 'percentage of lost packets',

  // Game
  matchDuration: 'average match length',
  disconnections: 'disconnections per match',
  reconnections: 'successful reconnections',
};
```

---

## Proximos Documentos

- [DATABASE.md](./DATABASE.md) - Estrutura de banco de dados
- [ANTI-CHEAT.md](./ANTI-CHEAT.md) - Sistema anti-cheat detalhado
- [arena/MATCHMAKING.md](../arena/MATCHMAKING.md) - Algoritmo de matchmaking
