# Modos de Jogo - Arena

## Visao Geral

Champion Forge oferece diversos modos de arena para diferentes estilos de jogo e niveis de compromisso.

---

## Modos Principais

### 1. Team Deathmatch Ranked (3v3)

**Descricao:** Modo competitivo principal, foco em coordenacao de time pequeno.

| Aspecto | Valor |
|---------|-------|
| Jogadores | 3v3 |
| Duracao | 10-15 min |
| Objetivo | Primeiro a 15 kills OU mais kills em 15 min |
| Mapa | Arena Pequena |
| Respawn | 10s + 2s/level |
| Queue | Solo/Duo |

**Regras:**
- Sistema de LP ativo
- Normalizacao de stats: 50%
- Items de arena disponiveis
- Surrender aos 5 min (voto unanime)

---

### 2. Team Deathmatch Ranked (5v5)

**Descricao:** Modo competitivo completo com times maiores.

| Aspecto | Valor |
|---------|-------|
| Jogadores | 5v5 |
| Duracao | 12-18 min |
| Objetivo | Primeiro a 25 kills OU mais kills em 18 min |
| Mapa | Arena Grande |
| Respawn | 12s + 2s/level |
| Queue | Solo/Duo ou Flex |

**Regras:**
- Sistema de LP ativo
- Normalizacao de stats: 50%
- Items de arena disponiveis
- Surrender aos 8 min (4/5 votos)

---

### 3. Free For All (FFA)

**Descricao:** Todos contra todos, caos puro.

| Aspecto | Valor |
|---------|-------|
| Jogadores | 8 |
| Duracao | 8-12 min |
| Objetivo | Primeiro a 10 kills OU mais kills |
| Mapa | Arena FFA |
| Respawn | 5s fixo |
| Queue | Solo |

**Regras:**
- Modo casual (sem LP)
- Normalizacao de stats: 30%
- Ring shrink a cada 2 min
- Ultimo jogador vivo = bonus de kills

**Mecanicas Especiais:**
```typescript
const FFAMechanics = {
  // Kill stealing protection
  assistWindow: 10,  // segundos
  assistShare: 0.5,  // 50% do XP/gold

  // Anti-camping
  ringShrink: {
    startAt: 120,    // 2 min
    interval: 60,    // a cada 1 min
    shrinkAmount: 0.15,  // 15% do raio
  },

  // Power-ups
  powerUpSpawn: {
    interval: 30,    // a cada 30s
    types: ['damage', 'speed', 'heal'],
  },
};
```

---

### 4. King of the Hill

**Descricao:** Capture e segure o ponto para ganhar.

| Aspecto | Valor |
|---------|-------|
| Jogadores | 3v3 ou 5v5 |
| Duracao | 10-15 min |
| Objetivo | Primeiro a 100 pontos |
| Mapa | Arena KOTH |
| Respawn | 8s fixo |
| Queue | Qualquer |

**Regras:**
- Ponto central no mapa
- +1 ponto/segundo por jogador no ponto
- Captura contestada = ninguem ganha pontos
- Time ganha 5 bonus ao capturar de 0

**Mecanicas:**
```typescript
const KOTHMechanics = {
  capturePoint: {
    radius: 200,         // pixels
    captureRate: 1,      // pontos/segundo/jogador
    maxRate: 3,          // mesmo com 5 jogadores
    contestedRate: 0,    // sem pontos se contestado
  },

  captureBonus: 5,       // bonus ao capturar do 0
  overtimeThreshold: 90, // overtime se time perdendo > 90 pontos
};
```

---

### 5. Capture the Flag

**Descricao:** Capture a bandeira inimiga e traga para sua base.

| Aspecto | Valor |
|---------|-------|
| Jogadores | 5v5 |
| Duracao | 15-20 min |
| Objetivo | Primeiro a 3 capturas |
| Mapa | Arena CTF |
| Respawn | 10s fixo |
| Queue | Qualquer |

**Regras:**
- Bandeira na base de cada time
- Tocar bandeira = carrega
- Ser morto = bandeira cai
- Aliado pode retornar bandeira caida
- So pode capturar se sua bandeira esta na base

**Mecanicas:**
```typescript
const CTFMechanics = {
  flag: {
    pickupDelay: 0,      // instantaneo
    dropDuration: 30,    // segundos ate retornar
    returnDelay: 3,      // segundos para aliado retornar
    carrierDebuff: {
      speed: -0.2,       // -20% velocidade
      canUseDash: false, // sem dashes
    },
  },

  capture: {
    pointsToWin: 3,
    requireOwnFlag: true,
    captureTime: 1,      // 1 segundo na base
  },
};
```

---

### 6. Elimination

**Descricao:** Sem respawn, ultimo time de pe vence o round.

| Aspecto | Valor |
|---------|-------|
| Jogadores | 3v3 ou 5v5 |
| Duracao | 5-10 min |
| Objetivo | Melhor de 5 rounds |
| Mapa | Arena Elimination |
| Respawn | Nenhum (por round) |
| Queue | Qualquer |

**Regras:**
- Rounds rapidos (max 2 min)
- Primeiro time a eliminar todos vence round
- Entre rounds: 15s de preparacao
- Gold carrega entre rounds
- Items resetam ao final do match

**Mecanicas:**
```typescript
const EliminationMechanics = {
  rounds: {
    toWin: 3,
    maxTime: 120,        // 2 min por round
    prepTime: 15,        // entre rounds
  },

  economy: {
    startGold: 1000,
    winBonus: 500,
    lossBonus: 300,
    killGold: 200,
    carryOver: true,
  },

  overtime: {
    triggerAt: 60,       // 1 min
    ringShrink: true,
  },
};
```

---

### 7. Duel (1v1)

**Descricao:** Confronto direto, teste de habilidade pura.

| Aspecto | Valor |
|---------|-------|
| Jogadores | 1v1 |
| Duracao | 5-10 min |
| Objetivo | Melhor de 5 |
| Mapa | Arena Duel |
| Respawn | Por round |
| Queue | Solo |

**Regras:**
- Rounds de 90 segundos max
- Sem items de arena (stats puros)
- Normalizacao de stats: 70%
- Ranking separado (Duel MMR)

**Mecanicas:**
```typescript
const DuelMechanics = {
  rounds: {
    toWin: 3,
    maxTime: 90,
    prepTime: 10,
  },

  restrictions: {
    arenaItems: false,
    consumables: false,
    abilitySwap: false,  // locked loadout
  },

  normalization: 0.7,    // 70% normalized

  tiebreaker: {
    hpPercent: true,     // maior % HP vence
    suddenDeath: true,   // ambos 1 HP
  },
};
```

---

## Modos Rotativos

### Weekly Rotation

Modos especiais que rodam semanalmente:

#### 8. All Random All Mid (ARAM)

| Aspecto | Valor |
|---------|-------|
| Jogadores | 5v5 |
| Duracao | 15-20 min |
| Especial | Personagem aleatorio |

**Regras:**
- Habilidades aleatorias (das desbloqueadas)
- 1 reroll gratuito
- Mapa de 1 lane
- HP/Mana regen aumentado

---

#### 9. Ultra Rapid Fire (URF)

| Aspecto | Valor |
|---------|-------|
| Jogadores | 5v5 |
| Duracao | 10-15 min |
| Especial | Cooldowns reduzidos |

**Modificadores:**
```typescript
const URFModifiers = {
  cooldownReduction: 0.8,    // 80% CDR
  manaConsumption: 0,        // sem custo de mana
  attackSpeed: 2.0,          // 2x attack speed cap
  movementSpeed: 1.25,       // +25% base
  tenacity: 0.25,            // +25% tenacity base
};
```

---

#### 10. One for All

| Aspecto | Valor |
|---------|-------|
| Jogadores | 5v5 |
| Duracao | 15-20 min |
| Especial | Todos jogam a mesma build |

**Regras:**
- Votacao de build no lobby
- Time inteiro usa mesma arma/habilidades
- Customizacao apenas em items de arena

---

#### 11. Battlegrounds (Battle Royale)

| Aspecto | Valor |
|---------|-------|
| Jogadores | 20-30 |
| Duracao | 15-25 min |
| Especial | Loot no chao, ring shrink |

**Mecanicas:**
```typescript
const BattlegroundsMechanics = {
  start: {
    spawnLocations: 'random_edge',
    startingGear: 'basic_only',
  },

  loot: {
    weaponTiers: [1, 2, 3],
    abilityOrbs: true,
    consumables: true,
    armorPieces: true,
  },

  ring: {
    firstShrink: 120,    // 2 min
    shrinkInterval: 60,  // a cada 1 min
    damagePerSecond: 10, // dano crescente
  },

  respawn: 'none',
  teamSize: 'solo_or_duo',
};
```

---

## Modos Custom

### Configuracoes Disponiveis

```typescript
interface CustomGameSettings {
  // Basico
  mode: GameMode;
  teamSize: 1 | 2 | 3 | 4 | 5;
  numTeams: 2 | 4 | 8;

  // Tempo
  matchDuration: number;
  respawnTime: number;

  // Economia
  startingGold: number;
  goldMultiplier: number;

  // Stats
  normalizationFactor: number;
  levelCap: number;
  startingLevel: number;

  // Restricoes
  allowedWeapons: WeaponType[] | 'all';
  allowedAbilities: AbilityId[] | 'all';
  arenaItemsEnabled: boolean;

  // Especiais
  friendlyFire: boolean;
  spectatorAllowed: boolean;
  password: string | null;
}
```

### Presets de Custom

```typescript
const CUSTOM_PRESETS = {
  tournament: {
    normalizationFactor: 0.6,
    spectatorAllowed: true,
    friendlyFire: false,
  },

  practice: {
    startingGold: 10000,
    startingLevel: 18,
    respawnTime: 3,
  },

  chaos: {
    goldMultiplier: 3,
    respawnTime: 1,
    friendlyFire: true,
  },

  restricted: {
    allowedWeapons: ['sword', 'shield'],
    allowedAbilities: ['basic_abilities_only'],
    arenaItemsEnabled: false,
  },
};
```

---

## Mapas

### Arena Pequena (3v3)

```
┌────────────────────────────────────┐
│                                    │
│   [Spawn A]         [Spawn B]      │
│       ●                 ●          │
│                                    │
│          ╔═══════════╗             │
│          ║  Center   ║             │
│          ║   Area    ║             │
│          ╚═══════════╝             │
│                                    │
│       ●                 ●          │
│                                    │
└────────────────────────────────────┘

Tamanho: 1000x800 pixels
Power-ups: 1 no centro
```

### Arena Grande (5v5)

```
┌──────────────────────────────────────────────┐
│                                              │
│  [Spawn A]                      [Spawn B]    │
│      ●   ●                      ●   ●        │
│          ●                      ●            │
│                                              │
│        ╔════╗            ╔════╗              │
│        ║ PU ║            ║ PU ║              │
│        ╚════╝            ╚════╝              │
│                                              │
│              ╔═══════════╗                   │
│              ║  Center   ║                   │
│              ╚═══════════╝                   │
│                                              │
│        ╔════╗            ╔════╗              │
│        ║ PU ║            ║ PU ║              │
│        ╚════╝            ╚════╝              │
│                                              │
│          ●                      ●            │
│      ●   ●                      ●   ●        │
│                                              │
└──────────────────────────────────────────────┘

Tamanho: 1400x1000 pixels
Power-ups: 5 (4 corners + center)
```

### Arena FFA

```
        ╭───────────────────────╮
       ╱                         ╲
      ╱   ●                   ●   ╲
     │         ╔═════╗           │
     │    ●    ║ PU  ║    ●      │
     │         ╚═════╝           │
    │                             │
    │  ●    ╔═══════════╗    ●    │
    │       ║  Center   ║         │
    │       ╚═══════════╝         │
    │                             │
     │         ╔═════╗           │
     │    ●    ║ PU  ║    ●      │
     │         ╚═════╝           │
      ╲   ●                   ●   ╱
       ╲                         ╱
        ╰───────────────────────╯

Formato: Circular (shrinking)
Tamanho: 1200x1200 pixels inicial
Power-ups: 5 (rotativo)
```

---

## Progressao de Modos

### Desbloqueio por Level de Conta

| Level | Modo Desbloqueado |
|-------|-------------------|
| 1 | Tutorial, Custom |
| 3 | Normal 3v3 |
| 5 | FFA |
| 8 | Normal 5v5 |
| 10 | Ranked 3v3 |
| 15 | KOTH, CTF |
| 20 | Ranked 5v5 |
| 25 | Duel Ranked |
| 30 | Modos Rotativos |

---

## Documentos Relacionados

- [RANKING.md](./RANKING.md) - Sistema de LP e Tiers
- [MATCHMAKING.md](./MATCHMAKING.md) - Algoritmo de matchmaking
- [BALANCE.md](./BALANCE.md) - Balanceamento de arena
- [ARENA-ITEMS.md](./ARENA-ITEMS.md) - Items de counter-play
