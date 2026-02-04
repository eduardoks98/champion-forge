# Sistema de Progressao de Conta

## Visao Geral

A conta do jogador tem um nivel separado dos personagens.
O nivel de conta desbloqueia features e da recompensas.

---

## Niveis de Conta

### Range: 1-100

```
Level 1   ████░░░░░░░░░░░░░░░░ Tutorial
Level 10  ████████░░░░░░░░░░░░ Iniciante
Level 20  ████████████░░░░░░░░ Intermediario
Level 30  ████████████████░░░░ Avancado
Level 50  ████████████████████ Veterano
Level 100 ████████████████████ Mestre
```

---

## Fontes de XP

### PvE (Mundo Aberto)

| Atividade | XP Base | Bonus |
|-----------|---------|-------|
| Matar mob comum | 10 | +50% first kill |
| Matar mob elite | 50 | +100% first kill |
| Matar boss | 500 | +200% first kill |
| Completar quest | 100-500 | Varia por quest |
| Limpar dungeon | 1000 | +50% com party |
| World boss | 2000 | Baseado em contribuicao |

### PvP (Arena)

| Resultado | XP | Bonus |
|-----------|----|----|
| Vitoria | 200 | +50% se ranked |
| Derrota | 50 | +25% se ranked |
| MVP | +100 | - |
| First Blood | +25 | - |
| Win Streak (3+) | +10% por win | - |

### Daily/Weekly

| Atividade | XP | Reset |
|-----------|----|----|
| Primeiro login | 50 | Diario |
| 3 arenas | 150 | Diario |
| 10 quests | 500 | Semanal |
| 1 dungeon | 300 | Semanal |
| 5 vitorias ranked | 1000 | Semanal |

---

## Tabela de XP

### XP Necessario por Level

```typescript
const xpForLevel = (level: number): number => {
  // Formula: 100 * level^1.5
  return Math.floor(100 * Math.pow(level, 1.5));
};

// Exemplos:
// Level 2: 141 XP
// Level 5: 559 XP
// Level 10: 1,581 XP
// Level 20: 4,472 XP
// Level 30: 8,216 XP
// Level 50: 17,677 XP
// Level 100: 50,000 XP
```

### XP Total Acumulado

| Level | XP Total | Tempo Estimado |
|-------|----------|----------------|
| 10 | ~10,000 | 5-10 horas |
| 20 | ~35,000 | 20-30 horas |
| 30 | ~80,000 | 50-70 horas |
| 50 | ~200,000 | 150-200 horas |
| 100 | ~700,000 | 500+ horas |

---

## Desbloqueios por Level

### Levels 1-10 (Tutorial)

| Level | Desbloqueia |
|-------|-------------|
| 1 | Movimento basico, ataque |
| 2 | Primeira habilidade (Q) |
| 3 | Segunda habilidade (W) |
| 4 | Sistema de equipamento |
| 5 | **Arena PvP (Casual)** |
| 6 | Terceira habilidade (E) |
| 7 | Sistema de crafting |
| 8 | Party system |
| 9 | Banco/Stash |
| 10 | **Segunda slot de personagem** |

### Levels 11-20 (Iniciante)

| Level | Desbloqueia |
|-------|-------------|
| 11 | Ultimate (R) |
| 12 | Trading com outros jogadores |
| 13 | Guild system |
| 14 | Zona: Cavernas |
| 15 | **Arena Ranked** |
| 16 | Daily quests |
| 17 | Passivas (slot 1) |
| 18 | Marketplace |
| 19 | Cosmeticos |
| 20 | **Terceira slot de personagem** |

### Levels 21-30 (Intermediario)

| Level | Desbloqueia |
|-------|-------------|
| 21 | Zona: Deserto |
| 22 | Dungeons basicas |
| 23 | Passivas (slot 2) |
| 24 | Respec de atributos |
| 25 | Weekly challenges |
| 26 | Crafting avancado |
| 27 | Zona: Ruinas |
| 28 | Passivas (slot 3) |
| 29 | Titulo customizado |
| 30 | **Quarta slot de personagem** |

### Levels 31-50 (Avancado)

| Level | Desbloqueia |
|-------|-------------|
| 35 | Zona: Vulcao |
| 40 | Dungeons avancadas |
| 45 | Raids |
| 50 | **Zona: Abismo** + **Quinta slot** |

### Levels 51-100 (Veterano)

| Level | Desbloqueia |
|-------|-------------|
| 60 | Infinite dungeon |
| 70 | Sexta slot de personagem |
| 80 | Challenge modes |
| 90 | Setima slot de personagem |
| 100 | Titulo "Mestre" + Efeitos visuais |

---

## Recompensas por Level

### Rewards Garantidos

```typescript
const levelRewards = {
  // A cada level
  everyLevel: {
    gold: (level) => level * 50,
    skill_points: 1,
  },

  // A cada 5 levels
  every5Levels: {
    attribute_point: 1,
    rare_material: 1,
  },

  // A cada 10 levels
  every10Levels: {
    epic_material: 1,
    cosmetic_box: 1,
  },

  // Milestones
  milestones: {
    10: { reward: 'character_slot', title: 'Novato' },
    20: { reward: 'character_slot', title: 'Explorador' },
    30: { reward: 'character_slot', title: 'Aventureiro' },
    50: { reward: 'character_slot', title: 'Veterano', aura: 'bronze' },
    100: { reward: 'character_slot', title: 'Mestre', aura: 'gold' },
  },
};
```

### Rewards de Slot

| Level | Slots de Personagem |
|-------|---------------------|
| 1 | 1 |
| 10 | 2 |
| 20 | 3 |
| 30 | 4 |
| 50 | 5 |
| 70 | 6 |
| 90 | 7 |

---

## Pontos de Atributo

### Sistema de Pontos

```typescript
interface AttributePoints {
  // Pontos livres para distribuir
  freePoints: number;

  // Ganho por level de conta
  perAccountLevel: 0.5;  // 1 ponto a cada 2 levels

  // Ganho total no level 100
  totalAtMax: 50;

  // Respec
  respec: {
    cost: 1000,          // Gold
    freeAfterLevel: 24,  // Primeiro respec gratis
    cooldown: '24h',
  };
}
```

### Calculo de Pontos

```typescript
const getAttributePoints = (accountLevel: number): number => {
  // Base: 72 pontos (12 em cada atributo)
  const basePoints = 72;

  // Bonus por level: 0.5 por level
  const levelBonus = Math.floor(accountLevel * 0.5);

  // Bonus de milestones
  const milestoneBonus =
    (accountLevel >= 10 ? 2 : 0) +
    (accountLevel >= 20 ? 2 : 0) +
    (accountLevel >= 30 ? 3 : 0) +
    (accountLevel >= 50 ? 5 : 0) +
    (accountLevel >= 100 ? 8 : 0);

  return basePoints + levelBonus + milestoneBonus;
};

// Exemplos:
// Level 1: 72 pontos
// Level 10: 72 + 5 + 2 = 79 pontos
// Level 50: 72 + 25 + 12 = 109 pontos
// Level 100: 72 + 50 + 20 = 142 pontos
```

---

## XP Boost

### Tipos de Boost

| Tipo | Bonus | Duracao | Obtencao |
|------|-------|---------|----------|
| Daily Login | +20% | 24h | Gratis |
| Win Streak | +10-50% | Per game | Performance |
| Party Bonus | +25% | While in party | Jogar em grupo |
| Premium | +50% | Subscription | Compra |
| Event | +100% | Evento | Eventos especiais |

### Stacking de Boost

```typescript
const calculateXPMultiplier = (boosts: Boost[]): number => {
  // Boosts sao aditivos
  const totalBonus = boosts.reduce((sum, b) => sum + b.bonus, 0);

  // Cap em 300% (3x XP)
  return Math.min(3.0, 1.0 + totalBonus);
};

// Exemplo:
// Daily (20%) + Party (25%) + Win Streak (30%) = 75% bonus
// XP final: 175% do normal
```

---

## Achievements de Level

### Por Milestone

| Achievement | Requisito | Reward |
|-------------|-----------|--------|
| First Steps | Level 5 | Icon "Novato" |
| Getting Serious | Level 10 | Border Bronze |
| Dedicated | Level 20 | Border Silver |
| Veteran | Level 50 | Border Gold + Aura |
| Master | Level 100 | Border Platina + Aura + Titulo |

### Por Tempo

| Achievement | Requisito | Reward |
|-------------|-----------|--------|
| Quick Learner | Level 10 em 24h | Icon especial |
| No Life | Level 50 em 1 semana | Titulo |
| Grinder | 1000 horas jogadas | Aura especial |

---

## Prestigio (Futuro)

### Sistema de Prestigio

Apos level 100, jogadores podem "prestigiar":

```typescript
interface PrestigeSystem {
  // Requisitos
  requirement: {
    accountLevel: 100,
    confirmAction: true,
  };

  // O que reseta
  resets: [
    'account_level', // Volta para 1
  ];

  // O que mantem
  keeps: [
    'characters',
    'equipment',
    'abilities_unlocked',
    'cosmetics',
    'currency',
  ];

  // Rewards
  rewards: {
    prestigeLevel: number;
    permanentXPBonus: 0.05; // +5% por prestigio
    exclusiveCosmetics: true;
    prestigeBorder: true;
  };

  // Max prestiges
  maxPrestige: 10;
}
```

---

## UI de Progressao

### Tela de Level Up

```
┌─────────────────────────────────────────────────────────────┐
│                    LEVEL UP!                                │
│                                                             │
│                       ⭐ 25 ⭐                               │
│                                                             │
│   Recompensas:                                              │
│   • +1250 Gold                                              │
│   • +1 Skill Point                                          │
│   • Weekly Challenges desbloqueado!                         │
│                                                             │
│                    [Continuar]                              │
└─────────────────────────────────────────────────────────────┘
```

### Barra de XP

```
┌─────────────────────────────────────────────────────────────┐
│  Lv 24 ████████████████████░░░░░░░░░░ Lv 25                 │
│         3,450 / 5,200 XP (66%)                              │
│                                                             │
│  Proximo desbloqueia: Respec de Atributos                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Proximos Documentos

- [UNLOCKS.md](./UNLOCKS.md) - Lista completa de desbloqueios
- [ACHIEVEMENTS.md](./ACHIEVEMENTS.md) - Sistema de conquistas
- [technical/DATABASE.md](../technical/DATABASE.md) - Estrutura de dados
