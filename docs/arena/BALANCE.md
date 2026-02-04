# Balanceamento de Arena

## Visao Geral

O balanceamento do Champion Forge na arena foca em garantir que todas as builds sejam viaveis enquanto mantendo counter-play significativo.

---

## Filosofia de Balanceamento

### Principios Core

1. **Skill > Stats** - Habilidade do jogador importa mais que equipamento
2. **Counter-play** - Sempre existe resposta para qualquer estrategia
3. **Diversidade** - Multiplas builds viaveis em todos os tiers
4. **Consistencia** - Resultados previsiveis, sem RNG excessivo

### Objetivos Numericos

| Metrica | Target | Tolerancia |
|---------|--------|------------|
| Win rate por build | 48-52% | +-5% |
| Pick rate de armas | 5-15% cada | +-5% |
| Ban rate maximo | < 30% | - |
| Tempo de partida | 10-15 min | +-3 min |
| Kills por partida | 15-25 (3v3) | +-5 |

---

## Sistema de Normalizacao

### Por Que Normalizar?

Na arena, jogadores tem equipamentos de diferentes niveis de poder (do mundo).
Para manter competitividade, aplicamos normalizacao parcial.

### Formula de Normalizacao

```typescript
interface ArenaStats {
  // Stats base do equipamento
  baseStats: CharacterStats;

  // Normalizacao aplicada
  normalizedStats: CharacterStats;

  // Fator de normalizacao (0.5 = 50% preservado)
  normFactor: number;
}

function normalizeForArena(
  playerStats: CharacterStats,
  averageStats: CharacterStats,
  factor: number = 0.5
): CharacterStats {
  // Formula: normalized = average + (player - average) * factor
  // Isso reduz a diferenca pela metade

  return {
    hp: averageStats.hp + (playerStats.hp - averageStats.hp) * factor,
    damage: averageStats.damage + (playerStats.damage - averageStats.damage) * factor,
    defense: averageStats.defense + (playerStats.defense - averageStats.defense) * factor,
    speed: averageStats.speed + (playerStats.speed - averageStats.speed) * factor,
    // ... outros stats
  };
}

// Exemplo:
// Player A: 1000 HP (farmou muito)
// Player B: 600 HP (novo)
// Media: 800 HP
// Normalizado A: 800 + (1000-800)*0.5 = 900 HP
// Normalizado B: 800 + (600-800)*0.5 = 700 HP
// Diferenca reduzida: 1000-600=400 → 900-700=200
```

### Configuracao por Modo

| Modo | Fator de Normalizacao | Razao |
|------|----------------------|-------|
| Ranked | 0.5 | Balanceado |
| Normal | 0.3 | Mais impacto de farm |
| Tournament | 0.7 | Mais skill-based |
| Custom | Configuravel | Flexibilidade |

---

## Categorias de Build

### Arquetipos Principais

```typescript
type BuildArchetype =
  | 'burst_damage'    // Alto dano, baixa sobrevivencia
  | 'sustained_dps'   // Dano constante
  | 'tank'            // Alta sobrevivencia
  | 'assassin'        // Mobilidade + burst
  | 'bruiser'         // Hibrido dano/tank
  | 'support'         // Buffs/heals
  | 'cc_heavy'        // Crowd control
  | 'poke'            // Dano a distancia
  | 'splitpush'       // Objetivos (PvE-focused)
  ;
```

### Matriz de Counters

```
                Burst   Sust    Tank    Assas   Bruis   Supp    CC      Poke
Burst           =       +       -       =       -       ++      =       +
Sustained       -       =       +       -       =       +       -       =
Tank            +       -       =       +       =       -       +       -
Assassin        =       +       -       =       +       ++      =       +
Bruiser         +       =       =       -       =       +       -       -
Support         --      -       +       --      -       =       +       =
CC Heavy        =       +       -       =       +       -       =       +
Poke            -       =       +       -       +       =       -       =

++ = Forte vantagem | + = Vantagem | = = Neutro | - = Desvantagem | -- = Forte desvantagem
```

---

## Power Budget na Arena

### Conceito

Cada personagem tem um "budget" total de poder que deve ser equilibrado entre diferentes areas.

```typescript
interface PowerBudget {
  total: 100;  // Budget maximo

  // Distribuicao
  damage: number;      // 0-40
  survivability: number; // 0-40
  utility: number;     // 0-30
  mobility: number;    // 0-30
}

// Exemplos de distribuicao:
const BUILDS = {
  glass_cannon: { damage: 40, survivability: 10, utility: 25, mobility: 25 },
  tank: { damage: 15, survivability: 40, utility: 30, mobility: 15 },
  assassin: { damage: 35, survivability: 15, utility: 15, mobility: 35 },
  support: { damage: 10, survivability: 25, utility: 40, mobility: 25 },
};
```

### Verificacao de Budget

```typescript
function isBalanced(build: PowerBudget): boolean {
  const total = build.damage + build.survivability + build.utility + build.mobility;

  // Deve estar entre 90-110 do budget
  return total >= 90 && total <= 110;
}

function getWeaknesses(build: PowerBudget): string[] {
  const weaknesses: string[] = [];

  if (build.damage > 35 && build.survivability < 20) {
    weaknesses.push('Vulneravel a burst');
  }
  if (build.mobility < 15) {
    weaknesses.push('Facilmente kitado');
  }
  if (build.utility < 15) {
    weaknesses.push('Pouca versatilidade');
  }

  return weaknesses;
}
```

---

## Scaling de Nivel na Arena

### Curva de Poder por Level

```typescript
const LEVEL_SCALING = {
  // Stats base por level
  hpPerLevel: 50,
  damagePerLevel: 5,
  defensePerLevel: 3,

  // Habilidades
  abilityPowerPerLevel: 0.05,  // +5% por level

  // Desbloqueios
  unlocks: {
    1: ['Q'],
    2: ['W'],
    3: ['E'],
    6: ['R'],
    11: ['R rank 2'],
    16: ['R rank 3'],
  },

  // Curva exponencial suave
  getPowerMultiplier: (level: number) => {
    return 1 + (level - 1) * 0.055;  // ~99% mais forte no 18
  },
};
```

### Gold Scaling

```typescript
const GOLD_VALUE = {
  // Eficiencia de gold por stat
  hp: {
    goldPer100: 267,  // 100 HP = 267 gold
  },
  damage: {
    goldPer10: 350,   // 10 damage = 350 gold
  },
  defense: {
    goldPer10: 300,   // 10 defense = 300 gold
  },

  // Item slot efficiency
  slotEfficiency: {
    tier1: 1.0,       // 100% efficient
    tier2: 1.1,       // 110% (melhor custo-beneficio)
    tier3: 1.2,       // 120% (items completos)
  },
};
```

---

## Mecanicas Anti-Snowball

### Comeback Mechanics

```typescript
interface ComebackMechanics {
  // Bounty system
  killBounty: {
    base: 300,
    perKillStreak: 100,     // +100 por kill streak
    maxBounty: 1000,
    shutdownBonus: 150,     // Bonus por terminar streak
  };

  // XP catchup
  xpCatchup: {
    // Jogadores com level menor ganham mais XP
    getLevelDiffBonus: (diff: number) => Math.min(diff * 0.1, 0.5),
  };

  // Gold catchup
  goldCatchup: {
    // Time perdendo ganha mais gold passivo
    losingTeamBonus: 0.1,   // +10% gold passivo
    bigDeficitBonus: 0.2,   // +20% se deficit > 3k gold
  };

  // Respawn timer
  respawnTimer: {
    // Time vencendo tem respawn mais longo
    base: 10,
    perLevel: 2,
    winningTeamPenalty: 3,  // +3s se vencendo
  };
}
```

### Rubber Banding

```typescript
function calculateRubberBand(
  teamGold: number,
  enemyGold: number,
  teamLevel: number,
  enemyLevel: number
): number {
  const goldDiff = enemyGold - teamGold;
  const levelDiff = enemyLevel - teamLevel;

  // Bonus percentual para time perdendo
  let bonus = 1.0;

  // Gold catchup
  if (goldDiff > 1000) bonus += 0.05;
  if (goldDiff > 2000) bonus += 0.05;
  if (goldDiff > 3000) bonus += 0.1;

  // Level catchup
  if (levelDiff > 0) bonus += levelDiff * 0.03;

  return Math.min(bonus, 1.3);  // Max 30% bonus
}
```

---

## Balanceamento de Crowd Control

### Diminishing Returns

```typescript
interface DiminishingReturns {
  // Categorias de CC
  categories: {
    stun: 'hard',
    root: 'hard',
    knockup: 'hard',
    slow: 'soft',
    silence: 'soft',
    blind: 'soft',
  };

  // Reducao por categoria
  getDuration: (baseDuration: number, recentCCs: number) => {
    const reduction = Math.min(recentCCs * 0.25, 0.75);
    return baseDuration * (1 - reduction);
  };

  // Reset timer
  resetAfter: 15;  // segundos sem CC
}

// Exemplo:
// Stun 1: 2s (100%)
// Stun 2: 1.5s (75%)
// Stun 3: 1s (50%)
// Stun 4: 0.5s (25%)
```

### CC Duration Caps

| Tipo de CC | Duracao Maxima | Notas |
|------------|----------------|-------|
| Stun | 2.0s | Hard CC |
| Root | 3.0s | Pode atacar |
| Knockup | 1.5s | Nao reduzivel |
| Slow | 5.0s | Soft CC |
| Silence | 3.0s | Pode mover |
| Fear | 2.0s | Perde controle |
| Charm | 2.0s | Move em direcao |

### Tenacity

```typescript
function calculateTenacity(
  baseTenacity: number,
  itemTenacity: number,
  buffTenacity: number
): number {
  // Multiplicativo, nao aditivo
  const totalReduction = (1 - baseTenacity) * (1 - itemTenacity) * (1 - buffTenacity);
  return 1 - totalReduction;
}

// Exemplo:
// Base: 0 (nenhuma)
// Item: 0.3 (30%)
// Buff: 0.2 (20%)
// Total: 1 - (1*0.7*0.8) = 1 - 0.56 = 44% tenacity
```

---

## Balanceamento de Dano

### Tipos de Dano

```typescript
enum DamageType {
  PHYSICAL = 'physical',
  MAGICAL = 'magical',
  TRUE = 'true',        // Ignora defesa
  PERCENT = 'percent',  // % do HP maximo
}

interface DamageCalculation {
  // Dano fisico
  physical: (base: number, armor: number) => {
    const reduction = armor / (armor + 100);
    return base * (1 - reduction);
  };

  // Dano magico
  magical: (base: number, magicResist: number) => {
    const reduction = magicResist / (magicResist + 100);
    return base * (1 - reduction);
  };

  // Dano verdadeiro
  true: (base: number) => base;

  // Dano percentual
  percent: (maxHp: number, percent: number, cap?: number) => {
    const damage = maxHp * percent;
    return cap ? Math.min(damage, cap) : damage;
  };
}
```

### Caps de Dano

```typescript
const DAMAGE_CAPS = {
  // Dano maximo por hit
  maxSingleHitDamage: (targetMaxHp: number) => targetMaxHp * 0.5,

  // Dano percentual max
  maxPercentDamage: {
    perHit: 0.2,      // 20% max HP por hit
    perSecond: 0.15,  // 15% max HP/s para DoTs
  },

  // Executes
  executeThreshold: 0.3,   // Funciona abaixo de 30% HP
  executeDamageCap: 0.5,   // Max 50% do HP atual

  // True damage
  trueDamageMultiplier: 0.7,  // 30% menos que equivalente
};
```

---

## Balanceamento de Sustain

### Healing Caps

```typescript
const HEALING_BALANCE = {
  // Healing recebido maximo por segundo
  maxHealingPerSecond: (maxHp: number) => maxHp * 0.15,

  // Lifesteal caps
  lifesteal: {
    maxPercent: 0.2,          // 20% max lifesteal
    aoeReduction: 0.33,       // 33% em AoE
    onHitEfficiency: 0.5,     // 50% em on-hit effects
  },

  // Grievous Wounds
  grievousWounds: {
    basic: 0.4,               // 40% reducao
    enhanced: 0.6,            // 60% quando empilhado
    duration: 3,              // segundos
  },
};
```

### Out of Combat Regeneration

```typescript
const OOC_REGEN = {
  // Tempo para considerar "fora de combate"
  outOfCombatTime: 5,  // segundos

  // Regeneracao passiva
  hpRegenRate: 0.02,   // 2% max HP/s
  manaRegenRate: 0.03, // 3% max mana/s

  // Bonus em base/fountain
  fountainMultiplier: 5,
};
```

---

## Balanceamento de Mobilidade

### Dash/Blink Limits

```typescript
const MOBILITY_BALANCE = {
  // Cooldowns minimos
  minDashCooldown: 6,      // segundos
  minBlinkCooldown: 12,    // segundos
  minFlashCooldown: 180,   // segundos (summoner)

  // Range limits
  maxDashRange: 600,       // pixels
  maxBlinkRange: 400,      // pixels

  // Charges
  maxDashCharges: 2,
  chargeRegenTime: 15,     // segundos por charge

  // Grounding (impede dashes)
  groundingDuration: {
    min: 1.5,
    max: 3.0,
  },
};
```

---

## Sistema de Patches

### Frequencia de Patches

| Tipo | Frequencia | Conteudo |
|------|------------|----------|
| Hotfix | Conforme necessario | Bug fixes criticos |
| Balance Patch | Bi-semanal | Ajustes numericos |
| Content Patch | Mensal | Novas habilidades/items |
| Season Update | A cada 3 meses | Grandes mudancas |

### Criterios para Nerf/Buff

```typescript
interface BalanceFlags {
  // Red flags (precisa nerf)
  needsNerf: {
    winRate: 54,           // >54% win rate
    pickRate: 25,          // >25% pick rate
    banRate: 40,           // >40% ban rate
    proPlayPresence: 90,   // >90% em pro play
  };

  // Green flags (precisa buff)
  needsBuff: {
    winRate: 46,           // <46% win rate
    pickRate: 1,           // <1% pick rate
    proPlayPresence: 0,    // 0% em pro play
  };

  // Prioridade de ajuste
  getPriority: (stats: BuildStats) => {
    let priority = 0;
    if (stats.winRate > 55) priority += 3;
    if (stats.banRate > 50) priority += 2;
    if (stats.pickRate > 30) priority += 1;
    return priority;
  };
}
```

### Tipos de Ajustes

```typescript
type BalanceAdjustment =
  | { type: 'damage', change: number }      // Ex: -10%
  | { type: 'cooldown', change: number }    // Ex: +2s
  | { type: 'cost', change: number }        // Ex: +20 mana
  | { type: 'range', change: number }       // Ex: -50 pixels
  | { type: 'duration', change: number }    // Ex: -0.5s
  | { type: 'ratio', change: number }       // Ex: -0.1 scaling
  | { type: 'mechanic', description: string } // Mudanca de mecanica
  ;

// Filosofia: Pequenos ajustes frequentes > Grandes mudancas raras
const MAX_CHANGE_PER_PATCH = {
  damage: 0.1,      // Max +-10%
  cooldown: 2,      // Max +-2s
  ratio: 0.1,       // Max +-0.1
};
```

---

## Metricas de Monitoramento

### Dashboard de Balanceamento

```typescript
interface BalanceMetrics {
  // Por build/arma
  perBuild: {
    winRate: number;
    pickRate: number;
    banRate: number;
    avgKDA: number;
    avgGold: number;
    avgDamageDealt: number;
    avgDamageTaken: number;
  };

  // Geral
  overall: {
    avgGameLength: number;
    firstBloodWinRate: number;
    comebackRate: number;
    surrenderRate: number;
    avgKillsPerGame: number;
  };

  // Por tier
  perTier: Map<Tier, {
    popularBuilds: string[];
    avgGameLength: number;
    diversityIndex: number;
  }>;
}
```

### Alertas Automaticos

```typescript
const BALANCE_ALERTS = {
  // Alertas criticos (notificacao imediata)
  critical: {
    winRateAbove: 58,
    winRateBelow: 42,
    pickRateAbove: 35,
    banRateAbove: 60,
  },

  // Alertas de atencao (review semanal)
  warning: {
    winRateAbove: 54,
    winRateBelow: 46,
    pickRateAbove: 25,
    banRateAbove: 40,
  },
};
```

---

## Testes de Balanceamento

### PBE (Public Beta Environment)

```typescript
interface PBEConfig {
  // Acesso
  access: 'opt-in',
  resetFrequency: 'per-patch',

  // Incentivos
  rewards: {
    gamesPlayed: 10,      // Min games para reward
    bugReported: true,    // Bonus por bug report
    feedbackGiven: true,  // Bonus por feedback
  };

  // Coleta de dados
  enhancedLogging: true,
  surveyAfterGame: true,
}
```

### Simulacoes

```typescript
interface BalanceSimulation {
  // Monte Carlo para win rates
  simulateGames: (build1: Build, build2: Build, iterations: number) => {
    wins1: number;
    wins2: number;
    avgGameLength: number;
    avgKills: number;
  };

  // Matchup matrix
  generateMatchupMatrix: (builds: Build[]) => Map<string, Map<string, number>>;

  // Diversity prediction
  predictPickRates: (patchChanges: BalanceAdjustment[]) => Map<string, number>;
}
```

---

## Documentos Relacionados

- [POWER-BUDGET.md](../balance/POWER-BUDGET.md) - Sistema de orcamento de poder
- [FORMULAS.md](../balance/FORMULAS.md) - Formulas de dano detalhadas
- [MATCHMAKING.md](./MATCHMAKING.md) - Sistema de matchmaking
- [RANKING.md](./RANKING.md) - Sistema de ranking

---

## Changelog de Balanceamento

### Versao 1.0.0 (Lancamento)
- Sistema de normalizacao implementado (fator 0.5)
- Diminishing returns para CC
- Anti-snowball mechanics
- Damage caps estabelecidos

### Futuras Consideracoes
- Seasonal balance resets
- Role-specific balancing
- Map-specific balancing
- Tournament-specific rulesets
