# Sistema de Bosses

## Visao Geral

Bosses sao encontros especiais com mecanicas unicas.
Total: 6 bosses de zona + 3 world bosses + 5 dungeon bosses.

---

## Tipos de Boss

| Tipo | Players | Respawn | Recompensa |
|------|---------|---------|------------|
| **Zone Boss** | 1-4 | 5 min | XP + Loot raro |
| **World Boss** | 10-50 | 4h | Loot epico (contribuicao) |
| **Dungeon Boss** | 4 | Por run | Set pieces |
| **Raid Boss** | 8-12 | Semanal | Loot lendario |

---

## ZONE BOSSES

### 1. Treant Anciao (Floresta, Level 10)

```typescript
const treantAnciao: Boss = {
  id: 'ancient_treant',
  name: 'Treant Anciao',
  zone: 'forest',
  level: 10,
  type: 'zone_boss',

  stats: {
    hp: 500,
    damage: 40,
    armor: 20,
    speed: 30,
  },

  phases: [
    {
      name: 'Phase 1',
      hpThreshold: 1.0, // 100-70%
      abilities: ['root_slam', 'summon_saplings'],
    },
    {
      name: 'Phase 2',
      hpThreshold: 0.7, // 70-30%
      abilities: ['root_slam', 'summon_saplings', 'forest_wrath'],
    },
    {
      name: 'Phase 3 (Enrage)',
      hpThreshold: 0.3, // 30-0%
      abilities: ['root_slam', 'summon_saplings', 'forest_wrath', 'nature_fury'],
      enrage: { damageBonus: 0.5, speedBonus: 0.3 },
    },
  ],

  abilities: {
    root_slam: {
      type: 'ground_aoe',
      damage: 60,
      radius: 150,
      telegraph: 1.5, // Aviso antes
      effect: 'root 2s',
      cooldown: 12,
    },
    summon_saplings: {
      type: 'summon',
      count: 3,
      mobId: 'sapling',
      cooldown: 20,
    },
    forest_wrath: {
      type: 'cone',
      damage: 80,
      angle: 90,
      range: 200,
      telegraph: 2,
      cooldown: 15,
    },
    nature_fury: {
      type: 'room_wide',
      damage: 30,
      duration: 5,
      safeZones: 3, // Areas seguras
      cooldown: 25,
    },
  },

  rewards: {
    xp: 500,
    gold: [100, 200],
    guaranteed: ['treant_heart'],
    drops: [
      { item: 'living_wood_sword', chance: 0.1 },
      { item: 'bark_armor', chance: 0.15 },
      { item: 'nature_skill_tome', chance: 0.05 },
    ],
  },
};
```

**Estrategia:**
1. Evitar Root Slam (circulo vermelho no chao)
2. Matar Saplings rapidamente (curam o boss)
3. Ficar atras para evitar Forest Wrath
4. Na Phase 3, correr para safe zones durante Nature Fury

---

### 2. Senhor da Forja (Cavernas, Level 20)

```typescript
const senhorForja: Boss = {
  id: 'forge_lord',
  name: 'Senhor da Forja',
  zone: 'caves',
  level: 20,
  type: 'zone_boss',

  stats: {
    hp: 1000,
    damage: 60,
    armor: 40,
    speed: 50,
  },

  phases: [
    {
      name: 'Phase 1',
      hpThreshold: 1.0,
      abilities: ['hammer_strike', 'molten_spray'],
      environment: 'normal',
    },
    {
      name: 'Phase 2',
      hpThreshold: 0.6,
      abilities: ['hammer_strike', 'molten_spray', 'summon_golems'],
      environment: 'lava_rising', // Lava sobe
    },
    {
      name: 'Phase 3',
      hpThreshold: 0.3,
      abilities: ['hammer_strike', 'molten_spray', 'forge_breath', 'anvil_drop'],
      environment: 'lava_high',
      enrage: { damageBonus: 0.3 },
    },
  ],

  abilities: {
    hammer_strike: {
      type: 'melee_cleave',
      damage: 100,
      arc: 180,
      knockback: 100,
      telegraph: 1,
      cooldown: 8,
    },
    molten_spray: {
      type: 'cone',
      damage: 50,
      burn: { damage: 10, duration: 5 },
      angle: 60,
      range: 250,
      telegraph: 1.5,
      cooldown: 10,
    },
    summon_golems: {
      type: 'summon',
      count: 2,
      mobId: 'fire_golem',
      cooldown: 25,
    },
    forge_breath: {
      type: 'channel',
      damage: 30,
      duration: 4,
      sweepAngle: 360, // Gira enquanto usa
      cooldown: 20,
    },
    anvil_drop: {
      type: 'targeted_aoe',
      damage: 150,
      radius: 80,
      count: 3, // 3 locais
      telegraph: 2,
      cooldown: 15,
    },
  },

  mechanics: {
    lavaRising: {
      description: 'Lava sobe, reduzindo area de luta',
      platforms: 4, // Plataformas seguras
      fallDamage: 50, // Por segundo na lava
    },
  },

  rewards: {
    xp: 1000,
    gold: [200, 400],
    guaranteed: ['forge_core'],
    drops: [
      { item: 'forgemaster_hammer', chance: 0.08 },
      { item: 'volcanic_armor_piece', chance: 0.2 },
      { item: 'fire_skill_tome', chance: 0.05 },
    ],
  },
};
```

**Estrategia:**
1. Ficar nos lados para evitar Hammer Strike
2. Recuar durante Molten Spray
3. Priorizar Fire Golems
4. Na Phase 3, ficar em plataformas e evitar Anvil Drops

---

### 3. Farao Amaldicoado (Deserto, Level 30)

```typescript
const faraoAmaldicoado: Boss = {
  id: 'cursed_pharaoh',
  name: 'Farao Amaldicoado',
  zone: 'desert',
  level: 30,
  type: 'zone_boss',

  stats: {
    hp: 1500,
    damage: 80,
    armor: 35,
    speed: 70,
  },

  phases: [
    {
      name: 'Phase 1 - The Ruler',
      hpThreshold: 1.0,
      abilities: ['scepter_beam', 'summon_servants', 'sand_tomb'],
    },
    {
      name: 'Phase 2 - The Curse',
      hpThreshold: 0.5,
      abilities: ['scepter_beam', 'plague_of_locusts', 'curse_of_ages'],
      transform: 'decayed_form',
    },
    {
      name: 'Phase 3 - The Wrath',
      hpThreshold: 0.2,
      abilities: ['all_previous', 'apocalypse'],
      enrage: { damageBonus: 0.5, castSpeedBonus: 0.3 },
    },
  ],

  abilities: {
    scepter_beam: {
      type: 'line',
      damage: 100,
      width: 50,
      range: 400,
      telegraph: 1,
      cooldown: 6,
    },
    summon_servants: {
      type: 'summon',
      count: 4,
      mobId: 'mummy_servant',
      positions: 'corners',
      cooldown: 30,
    },
    sand_tomb: {
      type: 'targeted',
      target: 'random_player',
      effect: 'trapped 3s, damage 20/s',
      breakable: true, // Aliados podem quebrar
      cooldown: 15,
    },
    plague_of_locusts: {
      type: 'room_aoe',
      damage: 15,
      duration: 8,
      safeZone: 'near_boss', // Perto do boss e seguro
      cooldown: 25,
    },
    curse_of_ages: {
      type: 'debuff',
      target: 'all_players',
      effect: '-50% healing, +50% damage taken',
      duration: 10,
      dispellable: true, // Pode ser removido com Cleanse
      cooldown: 40,
    },
    apocalypse: {
      type: 'enrage_ultimate',
      damage: 200,
      chargeTime: 5, // Tempo para interromper ou se preparar
      interruptable: true, // Pode ser interrompido com CC
    },
  },

  rewards: {
    xp: 2000,
    gold: [400, 700],
    guaranteed: ['pharaoh_seal'],
    drops: [
      { item: 'pharaohs_scepter', chance: 0.06 },
      { item: 'desert_king_crown', chance: 0.08 },
      { item: 'ultimate_skill_tome', chance: 0.03 },
    ],
  },
};
```

---

### 4. Imperador Caido (Ruinas, Level 40)

```typescript
const imperadorCaido: Boss = {
  id: 'fallen_emperor',
  name: 'Imperador Caido',
  zone: 'ruins',
  level: 40,
  type: 'zone_boss',

  stats: {
    hp: 2500,
    damage: 100,
    armor: 50,
    speed: 80,
  },

  phases: [
    {
      name: 'Phase 1 - Ghostly Form',
      hpThreshold: 1.0,
      form: 'ghost',
      abilities: ['spectral_slash', 'soul_drain', 'phantom_knights'],
    },
    {
      name: 'Phase 2 - Corporeal',
      hpThreshold: 0.6,
      form: 'physical',
      abilities: ['imperial_strike', 'royal_guard', 'decree_of_death'],
    },
    {
      name: 'Phase 3 - Hybrid',
      hpThreshold: 0.3,
      form: 'both', // Alterna
      abilities: ['all_abilities'],
      mechanic: 'phase_shift', // Muda de forma durante luta
    },
  ],

  abilities: {
    // Ghost form
    spectral_slash: {
      type: 'dash_attack',
      damage: 120,
      range: 300,
      passesThrough: true, // Atravessa jogadores
      telegraph: 0.5,
      cooldown: 8,
    },
    soul_drain: {
      type: 'channel',
      target: 'nearest',
      damage: 40,
      heal: 40, // Cura o boss
      duration: 3,
      interruptable: true,
      cooldown: 15,
    },
    phantom_knights: {
      type: 'summon',
      count: 2,
      mobId: 'phantom_knight',
      cooldown: 25,
    },

    // Physical form
    imperial_strike: {
      type: 'combo',
      hits: 3,
      damage: [60, 80, 120],
      telegraph: [0.5, 0.3, 1],
      cooldown: 10,
    },
    royal_guard: {
      type: 'buff',
      effect: 'Immune to damage for 3s',
      trigger: 'at 50% hp once',
    },
    decree_of_death: {
      type: 'mark',
      target: 'highest_damage',
      effect: 'Marked for 10s. If not healed to full, instant kill',
      cooldown: 45,
    },
  },

  rewards: {
    xp: 5000,
    gold: [800, 1200],
    guaranteed: ['imperial_crest'],
    drops: [
      { item: 'emperors_blade', chance: 0.05 },
      { item: 'crown_of_shadows', chance: 0.05 },
      { item: 'legendary_passive', chance: 0.02 },
    ],
  },
};
```

---

### 5. Senhor do Fogo (Vulcao, Level 50)

```typescript
const senhorFogo: Boss = {
  id: 'lord_of_fire',
  name: 'Senhor do Fogo',
  zone: 'volcano',
  level: 50,
  type: 'zone_boss',

  stats: {
    hp: 5000,
    damage: 150,
    armor: 60,
    speed: 100,
  },

  phases: [
    {
      name: 'Phase 1 - Inferno',
      hpThreshold: 1.0,
      abilities: ['hellfire_blast', 'meteor_shower', 'lava_wave'],
    },
    {
      name: 'Phase 2 - Ascension',
      hpThreshold: 0.5,
      mechanic: 'flight', // Boss voa
      abilities: ['aerial_bombardment', 'phoenix_dive', 'flame_tornado'],
    },
    {
      name: 'Phase 3 - Apocalypse',
      hpThreshold: 0.2,
      mechanic: 'soft_enrage',
      abilities: ['all_abilities', 'world_burn'],
      enrage: { damageBonus: 1.0, hpRegenPerSecond: 50 },
    },
  ],

  abilities: {
    hellfire_blast: {
      type: 'cone',
      damage: 200,
      angle: 90,
      range: 300,
      burn: { damage: 30, duration: 5 },
      telegraph: 1.5,
      cooldown: 10,
    },
    meteor_shower: {
      type: 'random_aoe',
      damage: 150,
      count: 8,
      radius: 100,
      duration: 5,
      telegraph: 1,
      cooldown: 20,
    },
    lava_wave: {
      type: 'expanding_ring',
      damage: 100,
      speed: 200,
      jumpable: true, // Pode pular para evitar
      cooldown: 15,
    },
    aerial_bombardment: {
      type: 'strafe',
      damage: 80,
      width: 150,
      passes: 3,
      telegraph: 2,
      cooldown: 12,
    },
    phoenix_dive: {
      type: 'targeted_aoe',
      damage: 250,
      radius: 200,
      telegraph: 2.5,
      afterEffect: 'fire_pool 10s',
      cooldown: 25,
    },
    flame_tornado: {
      type: 'moving_hazard',
      damage: 50,
      count: 2,
      duration: 15,
      speed: 100,
      cooldown: 30,
    },
    world_burn: {
      type: 'soft_enrage',
      description: 'Damage increases every 10s',
      stackDamageBonus: 0.1,
    },
  },

  rewards: {
    xp: 10000,
    gold: [1500, 2500],
    guaranteed: ['heart_of_fire', 'arena_access_token'],
    drops: [
      { item: 'infernal_blade', chance: 0.04 },
      { item: 'phoenix_wings', chance: 0.03 },
      { item: 'legendary_ultimate', chance: 0.01 },
    ],
  },
};
```

---

### 6. Entidade do Vazio (Abismo, Level 60+)

```typescript
const entidadeVazio: Boss = {
  id: 'void_entity',
  name: 'Entidade do Vazio',
  zone: 'abyss',
  level: 60,
  type: 'zone_boss',
  scaling: true, // Escala infinitamente

  stats: {
    hp: 10000,
    damage: 300,
    armor: 80,
    speed: 120,
  },

  phases: [
    {
      name: 'Phase 1 - Manifestation',
      hpThreshold: 1.0,
      abilities: ['void_tendrils', 'reality_warp', 'corruption_pulse'],
    },
    {
      name: 'Phase 2 - Split',
      hpThreshold: 0.6,
      mechanic: 'split_into_3', // Divide em 3 versoes menores
      abilities: ['void_tendrils', 'synchronized_attack'],
    },
    {
      name: 'Phase 3 - Reunion',
      hpThreshold: 0.3,
      mechanic: 'merge_back',
      abilities: ['all_abilities', 'existential_crisis', 'void_collapse'],
    },
  ],

  abilities: {
    void_tendrils: {
      type: 'multi_target',
      targets: 'all_players',
      damage: 100,
      pull: true, // Puxa jogadores
      breakable: { hp: 200 },
      cooldown: 18,
    },
    reality_warp: {
      type: 'teleport_all',
      description: 'Teleporta todos players para posicoes aleatorias',
      followUp: 'aoe_at_each_position',
      damage: 150,
      telegraph: 2,
      cooldown: 30,
    },
    corruption_pulse: {
      type: 'expanding_ring',
      damage: 80,
      rings: 3,
      delay: 1, // Entre rings
      cooldown: 12,
    },
    synchronized_attack: {
      type: 'split_form_attack',
      description: 'Todas 3 formas atacam simultaneamente',
      damage: 200,
      telegraph: 1.5,
      avoidance: 'spread_out',
    },
    existential_crisis: {
      type: 'debuff',
      effect: 'Inverted controls for 5s',
      cooldown: 45,
    },
    void_collapse: {
      type: 'enrage_ultimate',
      description: 'Arena shrinks, instant kill outside',
      duration: 30, // 30s para matar
      finalDamage: 9999,
    },
  },

  rewards: {
    xp: 20000,
    gold: [3000, 5000],
    guaranteed: ['void_essence_x5'],
    drops: [
      { item: 'void_blade', chance: 0.03 },
      { item: 'reality_shard', chance: 0.02 },
      { item: 'unique_legendary', chance: 0.005 },
    ],
  },
};
```

---

## WORLD BOSSES

### Dragao Anciao

```typescript
const dragaoAnciao: WorldBoss = {
  id: 'ancient_dragon',
  name: 'Dragao Anciao',
  type: 'world_boss',
  level: 55,

  schedule: {
    spawnTime: 'every_4_hours',
    announcement: '15_min_before',
    duration: '30_min', // Despawna se nao morrer
  },

  stats: {
    hp: 50000,
    damage: 200,
    armor: 100,
  },

  minPlayers: 10,
  maxPlayers: 50,
  scaling: {
    hpPerPlayer: 1000,
    damagePerPlayer: 5,
  },

  lootDistribution: 'contribution_based',
  // Top 10 = garantido epico
  // Top 50% = chance epico
  // Participou = garantido raro
};
```

---

## Mecanicas Comuns

### Telegraph System

```typescript
const telegraphTypes = {
  // Visual no chao
  ground_indicator: {
    circle: 'area de impacto',
    cone: 'direcao de ataque',
    line: 'caminho de projetil',
    ring: 'onda expandindo',
  },

  // Animacao do boss
  boss_animation: {
    windup: 'preparacao visivel',
    glow: 'brilho antes do ataque',
    sound: 'som de aviso',
  },

  // Tempo de aviso
  timings: {
    fast: 0.5,    // Dificil de reagir
    normal: 1.5,  // Tempo adequado
    slow: 2.5,    // Facil de evitar
  },
};
```

### Enrage System

```typescript
interface EnrageMechanic {
  // Soft enrage: fica mais forte com tempo
  soft: {
    triggerTime: number;     // Segundos
    damageIncreasePerStack: number;
    stackInterval: number;
  };

  // Hard enrage: instant kill
  hard: {
    triggerTime: number;
    effect: 'instant_kill' | 'massive_damage';
  };
}
```

---

## Recompensas

### Tabela de Drops por Boss

| Boss | Level | XP | Gold | Epico Chance | Lendario Chance |
|------|-------|----|------|--------------|-----------------|
| Treant | 10 | 500 | 150 | 10% | 1% |
| Forja | 20 | 1000 | 300 | 12% | 2% |
| Farao | 30 | 2000 | 550 | 15% | 3% |
| Imperador | 40 | 5000 | 1000 | 18% | 4% |
| Fogo | 50 | 10000 | 2000 | 20% | 5% |
| Vazio | 60+ | 20000+ | 4000+ | 25% | 8% |

---

## Proximos Documentos

- [QUESTS.md](./QUESTS.md) - Missoes e progressao
- [RESOURCES.md](./RESOURCES.md) - Crafting materials
- [arena/RANKING.md](../arena/RANKING.md) - Sistema competitivo
