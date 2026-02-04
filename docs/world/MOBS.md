# Sistema de Mobs (Inimigos)

## Visao Geral

Mobs sao inimigos controlados por IA no mundo aberto.
Total: 40+ tipos unicos distribuidos pelas 6 zonas.

---

## Tipos de Mob

| Tipo | Quantidade | HP | Dano | Especial |
|------|------------|----|----|----------|
| **Comum** | Muitos | Baixo | Baixo | Nenhum |
| **Elite** | Poucos | Alto | Alto | Habilidade especial |
| **Mini-Boss** | Raro | Muito Alto | Alto | Multiplas habilidades |
| **Boss** | Unico | Massivo | Massivo | Mecanicas complexas |

---

## FLORESTA (Level 1-10)

### Slime Verde
```typescript
const slimeVerde: Mob = {
  id: 'slime_green',
  name: 'Slime Verde',
  type: 'comum',
  level: { min: 1, max: 3 },

  stats: {
    hp: 30,
    damage: 5,
    armor: 0,
    speed: 50,
  },

  behavior: {
    ai: 'melee_chase',
    aggroRange: 100,
    attackRange: 30,
    attackSpeed: 1.0,
  },

  drops: [
    { item: 'slime_goo', chance: 0.5, quantity: [1, 2] },
    { item: 'gold', chance: 1.0, quantity: [1, 5] },
  ],

  xp: 10,
};
```

### Lobo
```typescript
const lobo: Mob = {
  id: 'wolf',
  name: 'Lobo',
  type: 'comum',
  level: { min: 3, max: 5 },

  stats: {
    hp: 50,
    damage: 10,
    armor: 5,
    speed: 120, // Rapido
  },

  behavior: {
    ai: 'pack_hunter', // Ataca em grupo
    aggroRange: 150,
    attackRange: 40,
    attackSpeed: 1.5,
    packSize: [2, 4],
  },

  abilities: [
    {
      name: 'Howl',
      effect: 'Chama mais lobos se HP < 50%',
      cooldown: 30,
    },
  ],

  drops: [
    { item: 'wolf_pelt', chance: 0.4, quantity: 1 },
    { item: 'wolf_fang', chance: 0.2, quantity: [1, 2] },
    { item: 'gold', chance: 1.0, quantity: [5, 15] },
  ],

  xp: 25,
};
```

### Goblin
```typescript
const goblin: Mob = {
  id: 'goblin',
  name: 'Goblin',
  type: 'comum',
  level: { min: 4, max: 6 },

  stats: {
    hp: 40,
    damage: 12,
    armor: 3,
    speed: 90,
  },

  behavior: {
    ai: 'ranged_kite', // Atira e recua
    aggroRange: 180,
    attackRange: 150,
    attackSpeed: 1.2,
  },

  abilities: [
    {
      name: 'Throw Rock',
      type: 'projectile',
      damage: 8,
      cooldown: 3,
    },
  ],

  drops: [
    { item: 'goblin_ear', chance: 0.3, quantity: 1 },
    { item: 'crude_dagger', chance: 0.05, quantity: 1 },
    { item: 'gold', chance: 1.0, quantity: [10, 25] },
  ],

  xp: 30,
};
```

### Urso (Elite)
```typescript
const urso: Mob = {
  id: 'bear',
  name: 'Urso',
  type: 'elite',
  level: { min: 6, max: 8 },

  stats: {
    hp: 120,
    damage: 20,
    armor: 15,
    speed: 80,
  },

  behavior: {
    ai: 'aggressive_tank',
    aggroRange: 120,
    attackRange: 50,
    attackSpeed: 0.8,
  },

  abilities: [
    {
      name: 'Swipe',
      type: 'melee_aoe',
      damage: 30,
      arc: 120,
      cooldown: 8,
    },
    {
      name: 'Roar',
      type: 'debuff',
      effect: 'Fear 2s',
      cooldown: 15,
    },
  ],

  drops: [
    { item: 'bear_pelt', chance: 0.6, quantity: 1 },
    { item: 'bear_claw', chance: 0.3, quantity: [1, 2] },
    { item: 'rare_herb', chance: 0.1, quantity: 1 },
    { item: 'gold', chance: 1.0, quantity: [30, 50] },
  ],

  xp: 80,
};
```

---

## CAVERNAS (Level 10-20)

### Morcego
```typescript
const morcego: Mob = {
  id: 'bat',
  name: 'Morcego',
  type: 'comum',
  level: { min: 10, max: 12 },

  stats: {
    hp: 60,
    damage: 15,
    armor: 0,
    speed: 150, // Muito rapido
  },

  behavior: {
    ai: 'swooping', // Ataca e recua
    aggroRange: 200,
    attackRange: 30,
    attackSpeed: 2.0,
    flightPattern: 'erratic',
  },

  drops: [
    { item: 'bat_wing', chance: 0.4, quantity: [1, 2] },
    { item: 'gold', chance: 1.0, quantity: [15, 25] },
  ],

  xp: 35,
};
```

### Esqueleto
```typescript
const esqueleto: Mob = {
  id: 'skeleton',
  name: 'Esqueleto',
  type: 'comum',
  level: { min: 11, max: 14 },

  stats: {
    hp: 80,
    damage: 18,
    armor: 10,
    speed: 70,
  },

  behavior: {
    ai: 'melee_shield', // Bloqueia ataques frontais
    aggroRange: 150,
    attackRange: 40,
    attackSpeed: 1.0,
    blockChance: 0.3,
  },

  resistances: {
    physical: 0,
    fire: -0.5, // Fraco a fogo
    ice: 0.3,   // Resiste gelo
    holy: -0.8, // Muito fraco a holy
  },

  drops: [
    { item: 'bone', chance: 0.6, quantity: [1, 3] },
    { item: 'rusty_sword', chance: 0.1, quantity: 1 },
    { item: 'gold', chance: 1.0, quantity: [20, 40] },
  ],

  xp: 45,
};
```

### Golem de Pedra (Elite)
```typescript
const golemPedra: Mob = {
  id: 'stone_golem',
  name: 'Golem de Pedra',
  type: 'elite',
  level: { min: 14, max: 16 },

  stats: {
    hp: 200,
    damage: 30,
    armor: 40, // Muito alto
    speed: 40, // Muito lento
  },

  behavior: {
    ai: 'slow_tank',
    aggroRange: 100,
    attackRange: 60,
    attackSpeed: 0.5,
  },

  abilities: [
    {
      name: 'Ground Slam',
      type: 'aoe',
      damage: 50,
      radius: 100,
      stun: 1,
      cooldown: 12,
    },
    {
      name: 'Rock Throw',
      type: 'projectile',
      damage: 40,
      range: 200,
      cooldown: 8,
    },
  ],

  resistances: {
    physical: 0.5,  // Resiste fisico
    fire: 0,
    ice: 0,
    lightning: -0.3, // Fraco a raio
  },

  drops: [
    { item: 'stone_core', chance: 0.5, quantity: 1 },
    { item: 'iron_ore', chance: 0.8, quantity: [2, 5] },
    { item: 'gold', chance: 1.0, quantity: [50, 80] },
  ],

  xp: 120,
};
```

---

## DESERTO (Level 20-30)

### Escorpiao
```typescript
const escorpiao: Mob = {
  id: 'scorpion',
  name: 'Escorpiao',
  type: 'comum',
  level: { min: 20, max: 23 },

  stats: {
    hp: 100,
    damage: 25,
    armor: 20,
    speed: 100,
  },

  behavior: {
    ai: 'ambush', // Fica enterrado, ataca quando proximo
    aggroRange: 80,
    attackRange: 40,
    attackSpeed: 1.2,
    burrowTime: 5, // Segundos enterrado
  },

  abilities: [
    {
      name: 'Poison Sting',
      type: 'melee',
      damage: 15,
      dot: { damage: 5, duration: 8 },
      cooldown: 5,
    },
  ],

  drops: [
    { item: 'scorpion_tail', chance: 0.4, quantity: 1 },
    { item: 'poison_gland', chance: 0.2, quantity: 1 },
    { item: 'gold', chance: 1.0, quantity: [40, 70] },
  ],

  xp: 70,
};
```

### Mumia (Elite)
```typescript
const mumia: Mob = {
  id: 'mummy',
  name: 'Mumia',
  type: 'elite',
  level: { min: 24, max: 27 },

  stats: {
    hp: 250,
    damage: 40,
    armor: 25,
    speed: 60,
  },

  behavior: {
    ai: 'relentless', // Nunca para de perseguir
    aggroRange: 200,
    attackRange: 50,
    attackSpeed: 0.8,
  },

  abilities: [
    {
      name: 'Curse',
      type: 'debuff',
      effect: '-30% healing received',
      duration: 10,
      cooldown: 15,
    },
    {
      name: 'Summon Scarabs',
      type: 'summon',
      count: [3, 5],
      cooldown: 20,
    },
  ],

  resistances: {
    physical: 0.2,
    fire: -0.5,
    holy: -0.8,
  },

  drops: [
    { item: 'mummy_wrap', chance: 0.5, quantity: [1, 2] },
    { item: 'ancient_coin', chance: 0.3, quantity: [1, 3] },
    { item: 'cursed_amulet', chance: 0.05, quantity: 1 },
    { item: 'gold', chance: 1.0, quantity: [80, 120] },
  ],

  xp: 150,
};
```

---

## RUINAS (Level 30-40)

### Guardiao Antigo (Elite)
```typescript
const guardiaoAntigo: Mob = {
  id: 'ancient_guardian',
  name: 'Guardiao Antigo',
  type: 'elite',
  level: { min: 34, max: 37 },

  stats: {
    hp: 400,
    damage: 60,
    armor: 50,
    speed: 70,
  },

  behavior: {
    ai: 'patrol_guard',
    patrolPath: true,
    aggroRange: 180,
    attackRange: 60,
    attackSpeed: 0.7,
    resetOnLeash: true,
  },

  abilities: [
    {
      name: 'Shield Bash',
      type: 'melee',
      damage: 80,
      stun: 1.5,
      cooldown: 10,
    },
    {
      name: 'Defensive Stance',
      type: 'buff',
      effect: '+100% armor, -50% speed',
      duration: 5,
      cooldown: 20,
    },
    {
      name: 'Ancient Shout',
      type: 'aoe',
      effect: 'Slow 50% 3s',
      radius: 150,
      cooldown: 15,
    },
  ],

  drops: [
    { item: 'ancient_core', chance: 0.4, quantity: 1 },
    { item: 'guardian_shield', chance: 0.05, quantity: 1 },
    { item: 'gold', chance: 1.0, quantity: [150, 250] },
  ],

  xp: 250,
};
```

---

## VULCAO (Level 40-50)

### Demonio Menor
```typescript
const demonioMenor: Mob = {
  id: 'lesser_demon',
  name: 'Demonio Menor',
  type: 'elite',
  level: { min: 44, max: 47 },

  stats: {
    hp: 500,
    damage: 80,
    armor: 30,
    speed: 110,
  },

  behavior: {
    ai: 'aggressive_caster',
    aggroRange: 250,
    attackRange: 200,
    attackSpeed: 1.0,
    preferRange: true,
  },

  abilities: [
    {
      name: 'Fireball',
      type: 'projectile',
      damage: 60,
      aoeRadius: 50,
      cooldown: 4,
    },
    {
      name: 'Hellfire',
      type: 'ground_aoe',
      damage: 30,
      duration: 5,
      radius: 100,
      cooldown: 12,
    },
    {
      name: 'Blink',
      type: 'movement',
      range: 150,
      cooldown: 8,
    },
  ],

  resistances: {
    fire: 0.8,    // Quase imune
    ice: -0.5,    // Fraco
    physical: 0,
  },

  drops: [
    { item: 'demon_horn', chance: 0.4, quantity: 1 },
    { item: 'infernal_essence', chance: 0.3, quantity: [1, 2] },
    { item: 'rare_weapon', chance: 0.02, quantity: 1 },
    { item: 'gold', chance: 1.0, quantity: [200, 350] },
  ],

  xp: 350,
};
```

---

## ABISMO (Level 50+)

### Void Walker (Elite)
```typescript
const voidWalker: Mob = {
  id: 'void_walker',
  name: 'Void Walker',
  type: 'elite',
  level: { min: 55, max: 60 },

  stats: {
    hp: 1000,
    damage: 150,
    armor: 40,
    speed: 130,
  },

  behavior: {
    ai: 'phase_shifter',
    aggroRange: 300,
    attackRange: 100,
    attackSpeed: 1.2,
    canPhase: true, // Atravessa paredes
  },

  abilities: [
    {
      name: 'Void Strike',
      type: 'melee',
      damage: 200,
      ignoresArmor: true, // Dano verdadeiro
      cooldown: 6,
    },
    {
      name: 'Phase Shift',
      type: 'movement',
      effect: 'Fica intangivel 2s',
      cooldown: 10,
    },
    {
      name: 'Reality Tear',
      type: 'projectile',
      damage: 150,
      effect: 'Silence 3s',
      cooldown: 15,
    },
    {
      name: 'Void Zone',
      type: 'ground_aoe',
      damage: 50,
      duration: 8,
      effect: '-50% healing',
      cooldown: 20,
    },
  ],

  resistances: {
    physical: 0.3,
    fire: 0,
    ice: 0,
    void: 0.9, // Quase imune a void
    holy: -0.5,
  },

  drops: [
    { item: 'void_essence', chance: 0.5, quantity: [1, 3] },
    { item: 'void_shard', chance: 0.2, quantity: 1 },
    { item: 'legendary_material', chance: 0.01, quantity: 1 },
    { item: 'gold', chance: 1.0, quantity: [400, 600] },
  ],

  xp: 600,
};
```

---

## Comportamentos de IA

### Tipos de AI

```typescript
enum MobAI {
  // Basicos
  MELEE_CHASE = 'melee_chase',       // Persegue e ataca melee
  RANGED_KITE = 'ranged_kite',       // Mantem distancia, atira
  MELEE_SHIELD = 'melee_shield',     // Bloqueia, ataca melee

  // Avancados
  PACK_HUNTER = 'pack_hunter',       // Ataca em grupo
  AMBUSH = 'ambush',                 // Fica escondido, emboscada
  SWOOPING = 'swooping',             // Voa, ataca e recua
  AGGRESSIVE_CASTER = 'aggressive_caster', // Mago agressivo

  // Especiais
  SLOW_TANK = 'slow_tank',           // Lento mas resistente
  RELENTLESS = 'relentless',         // Nunca para
  PATROL_GUARD = 'patrol_guard',     // Patrulha area
  PHASE_SHIFTER = 'phase_shifter',   // Muda de fase
}
```

### Parametros de Comportamento

```typescript
interface MobBehavior {
  ai: MobAI;

  // Deteccao
  aggroRange: number;        // Distancia para detectar player
  leashRange?: number;       // Distancia maxima da spawn

  // Combate
  attackRange: number;       // Distancia para atacar
  attackSpeed: number;       // Ataques por segundo
  preferRange?: boolean;     // Prefere manter distancia

  // Movimento
  patrolPath?: boolean;      // Segue rota de patrulha
  canPhase?: boolean;        // Atravessa paredes
  flightPattern?: string;    // Padrao de voo

  // Grupo
  packSize?: [number, number]; // Min/max do grupo
  callForHelp?: boolean;       // Chama aliados

  // Reset
  resetOnLeash?: boolean;    // Reseta ao sair do leash
  healOutOfCombat?: boolean; // Cura fora de combate
}
```

---

## Sistema de Spawn

### Spawn Points

```typescript
interface SpawnPoint {
  id: string;
  position: Vector2;
  mobPool: MobSpawnEntry[];
  respawnTime: number;       // Segundos
  maxMobs: number;           // Maximo na area
  radius: number;            // Raio de spawn
}

interface MobSpawnEntry {
  mobId: string;
  weight: number;            // Peso para sorteio
  minLevel?: number;
  maxLevel?: number;
}
```

### Spawn Scaling

```typescript
const spawnScaling = {
  // Baseado em players na instancia
  mobCountMultiplier: (players: number) => {
    return 1 + (players - 1) * 0.3; // +30% mobs por player
  },

  // Baseado no level medio
  levelAdjustment: (avgPlayerLevel: number, zoneLevel: number) => {
    const diff = avgPlayerLevel - zoneLevel;
    return Math.min(5, Math.max(-2, diff)); // -2 a +5 levels
  },
};
```

---

## Loot System

### Drop Tables

```typescript
interface DropTable {
  guaranteed: LootEntry[];   // Sempre dropa
  common: LootEntry[];       // Alta chance
  uncommon: LootEntry[];     // Media chance
  rare: LootEntry[];         // Baixa chance
  legendary: LootEntry[];    // Muito rara
}

interface LootEntry {
  item: string;
  quantity: number | [number, number];
  chance: number;            // 0-1
  levelRequirement?: number;
}
```

### Calculo de Loot

```typescript
const calculateLoot = (
  mob: Mob,
  player: Player,
  partySize: number
): Item[] => {
  const loot: Item[] = [];

  // Bonus de CHA
  const chaBonus = 1 + getModifier(player.cha) * 0.05;

  // Bonus de party
  const partyBonus = 1 + (partySize - 1) * 0.25;

  for (const drop of mob.drops) {
    const finalChance = drop.chance * chaBonus * partyBonus;

    if (Math.random() < finalChance) {
      const qty = Array.isArray(drop.quantity)
        ? randomInt(drop.quantity[0], drop.quantity[1])
        : drop.quantity;

      loot.push({ id: drop.item, quantity: qty });
    }
  }

  return loot;
};
```

---

## Proximos Documentos

- [BOSSES.md](./BOSSES.md) - Mecanicas detalhadas de boss
- [QUESTS.md](./QUESTS.md) - Missoes e objetivos
- [RESOURCES.md](./RESOURCES.md) - Recursos para crafting
