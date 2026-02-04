# Sistema de Passivas

## Visao Geral

Passivas sao habilidades que funcionam automaticamente, sem ativacao. Cada personagem pode equipar ate 3 passivas.

---

## Categorias de Passivas

### 1. Passivas de Combate

#### Ofensivas

| ID | Nome | Efeito | Origem |
|----|------|--------|--------|
| P001 | **Critical Master** | +15% chance critico, +25% dano critico | Quest L30 |
| P002 | **Berserker** | +2% dano por cada 10% HP perdido | Boss drop |
| P003 | **Executioner** | +30% dano contra alvos <25% HP | Arena reward |
| P004 | **First Strike** | Primeiro ataque em combate +50% dano | Quest L20 |
| P005 | **Combo Master** | Cada hit consecutivo +3% dano (max 15%) | Dungeon drop |
| P006 | **Armor Breaker** | Ataques ignoram 15% da armadura | Crafting |
| P007 | **Magic Penetration** | Habilidades ignoram 15% resist magica | Crafting |
| P008 | **Bleed Mastery** | Ataques causam bleed (2% HP/s por 3s) | Boss drop |
| P009 | **Poison Touch** | 20% chance de envenenar (3% HP/s por 4s) | Quest |
| P010 | **Burning Strikes** | Ataques de fogo +20% dano, spread em AoE | Vulcao boss |

#### Defensivas

| ID | Nome | Efeito | Origem |
|----|------|--------|--------|
| P011 | **Iron Skin** | +10% dano reduzido de todas fontes | Quest L25 |
| P012 | **Evasion** | 10% chance de esquivar ataques | Dungeon |
| P013 | **Shield Mastery** | Bloqueio absorve +25% mais dano | Quest |
| P014 | **Thorns** | Reflete 15% do dano recebido | Boss drop |
| P015 | **Regeneration** | +1% HP/s fora de combate | Quest L15 |
| P016 | **Second Wind** | Ao cair abaixo de 30% HP, cura 15% (1x/fight) | Boss drop |
| P017 | **Damage Shield** | Primeiro hit a cada 10s absorvido | Rare drop |
| P018 | **Magic Ward** | +25% resistencia a dano magico | Crafting |
| P019 | **Physical Ward** | +25% resistencia a dano fisico | Crafting |
| P020 | **Tenacity** | -20% duracao de CC | Arena reward |

### 2. Passivas de Utilidade

#### Mobilidade

| ID | Nome | Efeito | Origem |
|----|------|--------|--------|
| P021 | **Swift Foot** | +10% velocidade de movimento | Quest L10 |
| P022 | **Wind Walker** | Dashes tem +20% range | Dungeon |
| P023 | **Ghost** | Atravessa unidades ao usar dash | Boss drop |
| P024 | **Momentum** | Apos dash, +30% attack speed por 3s | Quest |
| P025 | **Hit and Run** | Apos hit, +15% speed por 2s | Arena reward |

#### Sustain

| ID | Nome | Efeito | Origem |
|----|------|--------|--------|
| P026 | **Lifesteal** | 5% de dano causado vira HP | Quest L25 |
| P027 | **Mana Leech** | 3% de dano causado vira Mana | Quest |
| P028 | **Kill Restore** | Matar inimigo restaura 10% HP/Mana | Boss drop |
| P029 | **Meditation** | +50% regen mana fora de combate | Quest |
| P030 | **Overheal** | Cura excessiva vira escudo (max 20% HP) | Rare drop |

### 3. Passivas de Recursos

#### Gold/XP

| ID | Nome | Efeito | Origem |
|----|------|--------|--------|
| P031 | **Treasure Hunter** | +15% gold de mobs | Quest |
| P032 | **Fast Learner** | +10% XP de todas fontes | Quest L5 |
| P033 | **Scavenger** | +20% chance de drop adicional | Dungeon |
| P034 | **Lucky** | +5% chance de raridade maior em drops | Boss drop |
| P035 | **Bounty Hunter** | +50% gold de players na arena | Arena reward |

#### Cooldowns

| ID | Nome | Efeito | Origem |
|----|------|--------|--------|
| P036 | **Quick Fingers** | -10% cooldown em todas habilidades | Quest L35 |
| P037 | **Reset** | Kill reduz cooldowns em 2s | Boss drop |
| P038 | **Preparation** | Primeira habilidade sem cooldown | Rare drop |
| P039 | **Efficiency** | -20% custo de mana | Quest |
| P040 | **Overflow** | Mana acima de 100% aumenta dano | Dungeon |

### 4. Passivas Condicionais

| ID | Nome | Condicao | Efeito | Origem |
|----|------|----------|--------|--------|
| P041 | **Underdog** | HP < 50% | +20% dano, +10% speed | Boss drop |
| P042 | **Overkill** | HP > 90% | +15% dano | Quest |
| P043 | **Solo Fighter** | Sem aliados em 500px | +25% dano e defesa | Arena |
| P044 | **Team Player** | 2+ aliados em 300px | +10% stats para todos | Quest |
| P045 | **Night Stalker** | A noite no mundo | +30% dano, invisibilidade | Rare |
| P046 | **Day Walker** | De dia no mundo | +20% HP regen, +10% speed | Quest |
| P047 | **Last Stand** | HP < 20% | Imune a CC, +50% dano | Legendary |
| P048 | **Bloodlust** | Apos kill | +30% attack speed por 5s | Boss |
| P049 | **Marked** | Atacando mesmo alvo 3x | +25% dano contra ele | Quest |
| P050 | **Fresh** | Sem dano nos ultimos 5s | Primeiro hit +100% dano | Dungeon |

### 5. Passivas Elementais

| ID | Nome | Efeito | Origem |
|----|------|--------|--------|
| P051 | **Fire Affinity** | +20% dano de fogo, -10% fire damage taken | Vulcao |
| P052 | **Ice Affinity** | +20% dano de gelo, slows duram +50% | Cavernas gelo |
| P053 | **Lightning Affinity** | +20% dano de raio, +10% attack speed | Ruinas |
| P054 | **Nature Affinity** | +30% healing, poison dura +50% | Floresta |
| P055 | **Void Affinity** | +25% dano true, -10% HP max | Abismo |
| P056 | **Holy Affinity** | +20% dano contra undead/demons | Ruinas |
| P057 | **Shadow Affinity** | +15% dano de shadow, stealth +2s | Abismo |

### 6. Passivas de Arma

| ID | Nome | Requisito | Efeito | Origem |
|----|------|-----------|--------|--------|
| P058 | **Sword Mastery** | Usando espada | +15% dano, +10% crit | Quest |
| P059 | **Axe Mastery** | Usando machado | +20% dano, cleave | Quest |
| P060 | **Hammer Mastery** | Usando martelo | +10% stun duration | Quest |
| P061 | **Spear Mastery** | Usando lanca | +20% range | Quest |
| P062 | **Bow Mastery** | Usando arco | +15% dano, arrow pierce | Quest |
| P063 | **Staff Mastery** | Usando cajado | +20% ability damage | Quest |
| P064 | **Dagger Mastery** | Usando adaga | +30% backstab damage | Quest |
| P065 | **Shield Mastery** | Usando escudo | +20% block, reflect | Quest |

---

## Obtendo Passivas

### Fontes

```typescript
const PASSIVE_SOURCES = {
  quest: {
    guaranteed: true,
    description: 'Completar quests especificas',
    difficulty: 'varies',
  },

  boss_drop: {
    guaranteed: false,
    dropChance: 0.05,  // 5% base
    description: 'Drop raro de bosses',
  },

  dungeon: {
    guaranteed: false,
    dropChance: 0.02,  // 2% por chest
    description: 'Chests de dungeon',
  },

  arena_reward: {
    guaranteed: true,
    description: 'Ranking rewards, achievement',
    requirement: 'rank/wins',
  },

  crafting: {
    guaranteed: true,
    description: 'Receita especial',
    materials: 'varies',
  },

  rare_drop: {
    guaranteed: false,
    dropChance: 0.001,  // 0.1% de mobs raros
    description: 'Drop muito raro',
  },

  legendary: {
    guaranteed: true,
    description: 'Evento/Boss final',
    requirement: 'endgame',
  },
};
```

### Drop Chance por Boss

| Boss | Passiva | Chance |
|------|---------|--------|
| Forest Guardian | First Strike | 10% |
| Crystal Golem | Iron Skin | 8% |
| Sand Emperor | Berserker | 5% |
| Ancient Construct | Magic Penetration | 7% |
| Volcanic Titan | Fire Affinity | 10% |
| Void Lord | Void Affinity | 15% |

---

## Sistema de Slots

### Desbloqueio

```typescript
const PASSIVE_SLOTS = {
  slot1: { unlockedAt: 1 },      // Inicio
  slot2: { unlockedAt: 15 },     // Level 15
  slot3: { unlockedAt: 30 },     // Level 30
};
```

### Restricoes

```typescript
const PASSIVE_RESTRICTIONS = {
  // Passivas mutuamente exclusivas
  exclusive: [
    ['fire_affinity', 'ice_affinity'],
    ['lifesteal', 'mana_leech'],  // So pode ter uma
    ['iron_skin', 'evasion'],
  ],

  // Stacking nao permitido
  noStack: true,  // Mesma passiva nao pode ser equipada 2x

  // Limite por categoria
  maxPerCategory: {
    offensive: 2,
    defensive: 2,
    utility: 3,
    elemental: 1,
  },
};
```

---

## Passivas na Arena

### Normalizacao

```typescript
const ARENA_PASSIVE_RULES = {
  // Passivas de farm nao funcionam
  disabled: [
    'treasure_hunter',
    'fast_learner',
    'scavenger',
  ],

  // Passivas reduzidas
  reduced: {
    'lucky': 0.5,           // Metade do efeito
    'lifesteal': 0.7,       // 70% do efeito
    'regeneration': 0.5,    // Metade
  },

  // Passivas normais
  fullEffect: [
    'critical_master',
    'berserker',
    'tenacity',
    // ... maioria das passivas de combate
  ],
};
```

---

## Passivas Legendarias

### Raras e Poderosas

| ID | Nome | Efeito | Obtencao |
|----|------|--------|----------|
| PL01 | **Phoenix Rebirth** | Ao morrer, revive com 50% HP (180s CD) | Phoenix boss |
| PL02 | **Time Dilation** | Primeira habilidade a cada 30s e instantanea | Ancient boss |
| PL03 | **Avatar of War** | +50% todos stats por 10s ao entrar em combate (60s CD) | Raid boss |
| PL04 | **Soul Collector** | Cada kill +5 HP permanente (max +100) | Void Lord |
| PL05 | **Mirror Image** | 25% chance de criar copia que ataca (3s) | Rare world drop |

---

## Interface de Passivas

```
┌─────────────────────────────────────────────────┐
│ PASSIVAS                              [X]       │
├─────────────────────────────────────────────────┤
│                                                 │
│  SLOT 1 [Desbloqueado]     SLOT 2 [L15]        │
│  ┌─────────┐               ┌─────────┐         │
│  │ Critical│               │  ????   │         │
│  │ Master  │               │         │         │
│  │ +15%crit│               │ Level15 │         │
│  └─────────┘               └─────────┘         │
│                                                 │
│  SLOT 3 [L30]                                  │
│  ┌─────────┐                                   │
│  │  ????   │                                   │
│  │         │                                   │
│  │ Level30 │                                   │
│  └─────────┘                                   │
│                                                 │
├─────────────────────────────────────────────────┤
│ PASSIVAS DISPONIVEIS (12)                       │
│                                                 │
│ [Critical Master] [Swift Foot] [Lifesteal]      │
│ [Iron Skin] [First Strike] [Regeneration]       │
│ [Treasure Hunter] [Fast Learner] [Tenacity]     │
│ [Sword Mastery] [Berserker] [Fire Affinity]     │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Documentos Relacionados

- [ABILITIES.md](./ABILITIES.md) - Habilidades ativas
- [BUILDS.md](./BUILDS.md) - Combinacoes otimizadas
- [ATTRIBUTES.md](./ATTRIBUTES.md) - Sistema de atributos
- [../balance/POWER-BUDGET.md](../balance/POWER-BUDGET.md) - Balanceamento
