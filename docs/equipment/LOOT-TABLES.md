# Loot Tables (Tabelas de Drop)

## Visao Geral

Este documento define as tabelas de drop para todas as fontes de loot no jogo.

---

## Estrutura de Loot Table

```typescript
interface LootTable {
  id: string;
  source: 'mob' | 'boss' | 'chest' | 'quest' | 'crafting';
  guaranteed: LootEntry[];     // Sempre dropa
  random: RandomLootPool[];    // Pool aleatorio
  bonuses?: LootModifier[];    // Modificadores
}

interface LootEntry {
  item: string;
  quantity: number | [number, number];  // Fixo ou range
  chance?: number;                      // 0-1
}

interface RandomLootPool {
  pool: LootEntry[];
  picks: number;                // Quantos items do pool
  allowDuplicates: boolean;
}
```

---

## Mobs por Zona

### Floresta Inicial (Level 1-10)

#### Slime
```typescript
const SLIME_LOOT: LootTable = {
  id: 'slime',
  source: 'mob',
  guaranteed: [
    { item: 'gold', quantity: [1, 5] },
    { item: 'slime_goo', quantity: [1, 2], chance: 0.5 },
  ],
  random: [
    {
      pool: [
        { item: 'health_potion_small', chance: 0.1 },
        { item: 'mana_potion_small', chance: 0.1 },
        { item: 'common_ring', chance: 0.01 },
      ],
      picks: 1,
      allowDuplicates: false,
    },
  ],
};
```

#### Wolf
```typescript
const WOLF_LOOT: LootTable = {
  id: 'wolf',
  source: 'mob',
  guaranteed: [
    { item: 'gold', quantity: [3, 8] },
    { item: 'wolf_pelt', quantity: 1, chance: 0.3 },
    { item: 'wolf_fang', quantity: [1, 2], chance: 0.15 },
  ],
  random: [
    {
      pool: [
        { item: 'leather_cap', chance: 0.05 },
        { item: 'leather_boots', chance: 0.05 },
        { item: 'iron_dagger', chance: 0.03 },
      ],
      picks: 1,
      allowDuplicates: false,
    },
  ],
};
```

#### Forest Guardian (Boss)
```typescript
const FOREST_GUARDIAN_LOOT: LootTable = {
  id: 'forest_guardian',
  source: 'boss',
  guaranteed: [
    { item: 'gold', quantity: [100, 200] },
    { item: 'guardian_essence', quantity: 1 },
    { item: 'xp_orb_large', quantity: 1 },
  ],
  random: [
    {
      pool: [
        { item: 'guardian_sword', chance: 0.15 },
        { item: 'guardian_shield', chance: 0.15 },
        { item: 'forest_set_piece', chance: 0.25 },
        { item: 'ability_tome_dash', chance: 0.1 },
        { item: 'passive_first_strike', chance: 0.1 },
      ],
      picks: 2,
      allowDuplicates: false,
    },
  ],
};
```

---

### Cavernas (Level 10-20)

#### Spider
```typescript
const SPIDER_LOOT: LootTable = {
  id: 'spider',
  source: 'mob',
  guaranteed: [
    { item: 'gold', quantity: [5, 12] },
    { item: 'spider_silk', quantity: [1, 3], chance: 0.4 },
    { item: 'spider_venom', quantity: 1, chance: 0.2 },
  ],
  random: [
    {
      pool: [
        { item: 'hunter_vest', chance: 0.03 },
        { item: 'poison_dagger', chance: 0.02 },
        { item: 'silk_cloth', chance: 0.1 },
      ],
      picks: 1,
      allowDuplicates: false,
    },
  ],
};
```

#### Crystal Golem (Boss)
```typescript
const CRYSTAL_GOLEM_LOOT: LootTable = {
  id: 'crystal_golem',
  source: 'boss',
  guaranteed: [
    { item: 'gold', quantity: [200, 400] },
    { item: 'crystal_core', quantity: 1 },
    { item: 'crystal_shard', quantity: [3, 5] },
  ],
  random: [
    {
      pool: [
        { item: 'crystal_sword', chance: 0.12 },
        { item: 'crystal_staff', chance: 0.12 },
        { item: 'golem_armor_piece', chance: 0.2 },
        { item: 'passive_iron_skin', chance: 0.08 },
        { item: 'ability_tome_earth_shield', chance: 0.1 },
      ],
      picks: 2,
      allowDuplicates: false,
    },
  ],
};
```

---

### Deserto (Level 20-30)

#### Sand Scorpion
```typescript
const SAND_SCORPION_LOOT: LootTable = {
  id: 'sand_scorpion',
  source: 'mob',
  guaranteed: [
    { item: 'gold', quantity: [10, 20] },
    { item: 'scorpion_carapace', quantity: 1, chance: 0.35 },
    { item: 'scorpion_stinger', quantity: 1, chance: 0.15 },
  ],
  random: [
    {
      pool: [
        { item: 'desert_armor_piece', chance: 0.04 },
        { item: 'venom_blade', chance: 0.02 },
        { item: 'antivenom', chance: 0.08 },
      ],
      picks: 1,
      allowDuplicates: false,
    },
  ],
};
```

#### Sand Emperor (Boss)
```typescript
const SAND_EMPEROR_LOOT: LootTable = {
  id: 'sand_emperor',
  source: 'boss',
  guaranteed: [
    { item: 'gold', quantity: [500, 800] },
    { item: 'emperor_scarab', quantity: 1 },
    { item: 'ancient_relic_fragment', quantity: [1, 2] },
  ],
  random: [
    {
      pool: [
        { item: 'emperors_blade', chance: 0.1 },
        { item: 'pharaoh_staff', chance: 0.1 },
        { item: 'desert_king_armor', chance: 0.15 },
        { item: 'passive_berserker', chance: 0.05 },
        { item: 'ability_sand_storm', chance: 0.08 },
        { item: 'shadow_set_piece', chance: 0.12 },
      ],
      picks: 3,
      allowDuplicates: false,
    },
  ],
};
```

---

### Ruinas (Level 30-40)

#### Ancient Construct (Boss)
```typescript
const ANCIENT_CONSTRUCT_LOOT: LootTable = {
  id: 'ancient_construct',
  source: 'boss',
  guaranteed: [
    { item: 'gold', quantity: [800, 1200] },
    { item: 'ancient_power_core', quantity: 1 },
    { item: 'arcane_dust', quantity: [5, 10] },
  ],
  random: [
    {
      pool: [
        { item: 'construct_blade', chance: 0.08 },
        { item: 'arcane_staff', chance: 0.08 },
        { item: 'ancient_armor_piece', chance: 0.12 },
        { item: 'passive_magic_penetration', chance: 0.07 },
        { item: 'ability_arcane_bolt', chance: 0.1 },
        { item: 'legendary_accessory', chance: 0.03 },
      ],
      picks: 3,
      allowDuplicates: false,
    },
  ],
};
```

---

### Vulcao (Level 40-50)

#### Volcanic Titan (Boss)
```typescript
const VOLCANIC_TITAN_LOOT: LootTable = {
  id: 'volcanic_titan',
  source: 'boss',
  guaranteed: [
    { item: 'gold', quantity: [1500, 2500] },
    { item: 'titan_heart', quantity: 1 },
    { item: 'molten_core', quantity: [2, 4] },
    { item: 'phoenix_feather', quantity: 1, chance: 0.3 },
  ],
  random: [
    {
      pool: [
        { item: 'titans_greatsword', chance: 0.06 },
        { item: 'inferno_staff', chance: 0.06 },
        { item: 'titan_armor_piece', chance: 0.1 },
        { item: 'passive_fire_affinity', chance: 0.1 },
        { item: 'ability_meteor', chance: 0.05 },
        { item: 'mythic_weapon', chance: 0.01 },
      ],
      picks: 4,
      allowDuplicates: false,
    },
  ],
};
```

---

### Abismo (Level 50+)

#### Void Lord (Final Boss)
```typescript
const VOID_LORD_LOOT: LootTable = {
  id: 'void_lord',
  source: 'boss',
  guaranteed: [
    { item: 'gold', quantity: [3000, 5000] },
    { item: 'void_core', quantity: 1 },
    { item: 'primordial_essence', quantity: [3, 5] },
    { item: 'legendary_equipment', quantity: 1 },
  ],
  random: [
    {
      pool: [
        { item: 'void_reaver', chance: 0.05 },
        { item: 'staff_of_annihilation', chance: 0.05 },
        { item: 'void_armor_piece', chance: 0.08 },
        { item: 'passive_void_affinity', chance: 0.15 },
        { item: 'passive_legendary', chance: 0.03 },
        { item: 'mythic_armor', chance: 0.02 },
        { item: 'title_voidwalker', chance: 1.0 },  // First kill only
      ],
      picks: 5,
      allowDuplicates: false,
    },
  ],
};
```

---

## Dungeon Chests

### Normal Chest
```typescript
const DUNGEON_CHEST_NORMAL: LootTable = {
  id: 'dungeon_chest_normal',
  source: 'chest',
  guaranteed: [
    { item: 'gold', quantity: [50, 150] },
  ],
  random: [
    {
      pool: [
        { item: 'health_potion', chance: 0.4 },
        { item: 'mana_potion', chance: 0.4 },
        { item: 'crafting_material_common', chance: 0.3 },
        { item: 'equipment_uncommon', chance: 0.15 },
        { item: 'equipment_rare', chance: 0.05 },
      ],
      picks: 2,
      allowDuplicates: true,
    },
  ],
};
```

### Elite Chest
```typescript
const DUNGEON_CHEST_ELITE: LootTable = {
  id: 'dungeon_chest_elite',
  source: 'chest',
  guaranteed: [
    { item: 'gold', quantity: [150, 350] },
    { item: 'crafting_material_uncommon', quantity: [2, 4] },
  ],
  random: [
    {
      pool: [
        { item: 'equipment_rare', chance: 0.25 },
        { item: 'equipment_epic', chance: 0.1 },
        { item: 'ability_scroll', chance: 0.08 },
        { item: 'enchanting_material', chance: 0.2 },
      ],
      picks: 3,
      allowDuplicates: false,
    },
  ],
};
```

### Boss Chest
```typescript
const DUNGEON_CHEST_BOSS: LootTable = {
  id: 'dungeon_chest_boss',
  source: 'chest',
  guaranteed: [
    { item: 'gold', quantity: [300, 600] },
    { item: 'crafting_material_rare', quantity: [1, 3] },
    { item: 'equipment_rare_or_better', quantity: 1 },
  ],
  random: [
    {
      pool: [
        { item: 'equipment_epic', chance: 0.2 },
        { item: 'equipment_legendary', chance: 0.05 },
        { item: 'passive_scroll', chance: 0.08 },
        { item: 'set_piece', chance: 0.15 },
        { item: 'unique_accessory', chance: 0.1 },
      ],
      picks: 4,
      allowDuplicates: false,
    },
  ],
};
```

---

## Modificadores de Loot

### Lucky Passive
```typescript
const LUCKY_MODIFIER = {
  dropChanceBonus: 0.05,      // +5% chance geral
  rarityBonus: 0.1,           // +10% chance de raridade maior
  quantityBonus: 0.15,        // +15% quantidade
};
```

### Party Bonus
```typescript
const PARTY_LOOT_BONUS = {
  2: { dropChance: 1.1 },     // +10%
  3: { dropChance: 1.2 },     // +20%
  4: { dropChance: 1.3 },     // +30%
};
```

### World Events
```typescript
const EVENT_MODIFIERS = {
  double_drops: { quantityMultiplier: 2.0 },
  rare_weekend: { rarityBonus: 0.25 },
  gold_rush: { goldMultiplier: 2.0 },
};
```

---

## Documentos Relacionados

- [RARITY.md](./RARITY.md) - Sistema de raridade
- [ARMOR.md](./ARMOR.md) - Armaduras
- [ACCESSORIES.md](./ACCESSORIES.md) - Acessorios
- [../world/MOBS.md](../world/MOBS.md) - Lista de mobs
- [../world/BOSSES.md](../world/BOSSES.md) - Lista de bosses
