# Sistema de Recursos e Crafting

## Visao Geral

O sistema de recursos conecta o farm no mundo aberto com a progressao do personagem atraves do crafting.

---

## Tipos de Recursos

### 1. Materiais Basicos

| Recurso | Zona | Uso | Raridade |
|---------|------|-----|----------|
| **Wood** | Floresta | Crafting basico, flechas | Comum |
| **Stone** | Todas | Crafting basico | Comum |
| **Iron Ore** | Cavernas | Armas/Armaduras tier 1-2 | Comum |
| **Copper Ore** | Cavernas | Acessorios, conducao | Comum |
| **Leather** | Todas (drop) | Armadura leve | Comum |
| **Cloth** | Drop de humanoides | Armadura magica | Comum |

### 2. Materiais Intermediarios

| Recurso | Zona | Uso | Raridade |
|---------|------|-----|----------|
| **Steel** | Craftado | Armas/Armaduras tier 2-3 | Incomum |
| **Silver Ore** | Cavernas fundo | Anti-undead, acessorios | Incomum |
| **Gold Ore** | Cavernas raras | Joias, encantamentos | Incomum |
| **Mithril Ore** | Ruinas | Armas/Armaduras tier 3-4 | Raro |
| **Crystal Shard** | Cavernas boss | Encantamentos | Raro |
| **Enchanted Silk** | Deserto | Armadura magica tier 3+ | Raro |

### 3. Materiais Avancados

| Recurso | Zona | Uso | Raridade |
|---------|------|-----|----------|
| **Adamantite Ore** | Vulcao | Tier 4-5 | Epico |
| **Dragon Scale** | Boss drop | Armadura epica | Epico |
| **Phoenix Feather** | Vulcao boss | Armas de fogo | Epico |
| **Void Essence** | Abismo | Tier 5+ | Lendario |
| **Starfall Fragment** | Evento especial | Tier maximo | Lendario |
| **Primordial Core** | Final boss | Items unicos | Mitico |

### 4. Ervas e Reagentes

| Recurso | Zona | Uso | Raridade |
|---------|------|-----|----------|
| **Healing Herb** | Floresta | Pocoes HP | Comum |
| **Mana Blossom** | Floresta/Cavernas | Pocoes Mana | Comum |
| **Poison Root** | Pantano | Venenos | Incomum |
| **Fire Lotus** | Vulcao | Pocoes de fogo | Raro |
| **Frost Lily** | Cavernas gelo | Pocoes de gelo | Raro |
| **Void Mushroom** | Abismo | Pocoes endgame | Epico |

---

## Sistema de Coleta

### Nodes de Recursos

```typescript
interface ResourceNode {
  type: ResourceType;
  tier: 1 | 2 | 3 | 4 | 5;
  hp: number;           // "HP" para minerar/coletar
  respawnTime: number;  // segundos
  requiredTool?: ToolType;
  minimumSkill?: number;
  drops: LootTable;
}

// Exemplo: Veio de Ferro
const ironVein: ResourceNode = {
  type: 'iron_ore',
  tier: 1,
  hp: 100,
  respawnTime: 300,  // 5 minutos
  requiredTool: 'pickaxe',
  minimumSkill: 0,
  drops: {
    guaranteed: [{ item: 'iron_ore', quantity: [3, 5] }],
    bonus: [
      { item: 'copper_ore', chance: 0.2, quantity: [1, 2] },
      { item: 'gem_rough', chance: 0.05, quantity: 1 },
    ],
  },
};
```

### Ferramentas

| Ferramenta | Uso | Tiers |
|------------|-----|-------|
| **Pickaxe** | Mineracao | Wood → Iron → Steel → Mithril → Adamantite |
| **Axe** | Lenhador | Wood → Iron → Steel → Mithril → Adamantite |
| **Sickle** | Ervas | Wood → Iron → Steel → Enchanted |
| **Fishing Rod** | Pesca | Basic → Good → Great → Legendary |
| **Skinning Knife** | Couro | Basic → Sharp → Master |

### Eficiencia de Coleta

```typescript
const GATHERING_EFFICIENCY = {
  // Bonus por tier de ferramenta
  toolTierBonus: {
    1: 1.0,    // 100% base
    2: 1.15,   // +15%
    3: 1.30,   // +30%
    4: 1.50,   // +50%
    5: 1.75,   // +75%
  },

  // Bonus por skill
  getSkillBonus: (skill: number) => {
    return 1 + (skill / 100) * 0.5;  // Max +50% no skill 100
  },

  // Speed bonus
  getSpeedBonus: (toolTier: number, skill: number) => {
    return (toolTier * 0.1) + (skill / 200);  // Max ~+60% speed
  },
};
```

---

## Skills de Coleta

### Profissoes de Gathering

```typescript
interface GatheringProfession {
  name: string;
  maxLevel: 100;
  xpPerAction: (nodeTier: number, playerSkill: number) => number;
  bonuses: {
    level: number;
    bonus: string;
  }[];
}

const MINING: GatheringProfession = {
  name: 'Mining',
  maxLevel: 100,
  xpPerAction: (tier, skill) => (tier * 10) * (1 + Math.max(0, tier - skill/20) * 0.5),
  bonuses: [
    { level: 10, bonus: '+5% yield' },
    { level: 25, bonus: 'Find gems more often' },
    { level: 50, bonus: '+15% yield, -20% gather time' },
    { level: 75, bonus: 'Chance for double ore' },
    { level: 100, bonus: 'Master Miner title, +30% yield' },
  ],
};
```

### XP por Acao

| Profissao | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Tier 5 |
|-----------|--------|--------|--------|--------|--------|
| Mining | 10 | 25 | 50 | 100 | 200 |
| Logging | 8 | 20 | 45 | 90 | 180 |
| Herbalism | 12 | 30 | 60 | 120 | 240 |
| Skinning | 5/mob | 10/mob | 20/mob | 40/mob | 80/mob |

---

## Sistema de Crafting

### Estacoes de Crafting

| Estacao | Localizacao | Crafts |
|---------|-------------|--------|
| **Forge** | Cidade Hub | Armas, Armaduras metal |
| **Workbench** | Cidade Hub | Items gerais, ferramentas |
| **Alchemy Lab** | Cidade Hub | Pocoes, venenos |
| **Enchanting Table** | Cidade Hub (L20) | Encantamentos |
| **Tailor Station** | Cidade Hub | Armaduras de cloth/leather |
| **Jeweler Bench** | Cidade Hub (L30) | Acessorios, joias |

### Receitas

```typescript
interface CraftingRecipe {
  id: string;
  name: string;
  station: CraftingStation;
  requiredSkill: number;
  materials: { item: string; quantity: number }[];
  result: { item: string; quantity: number };
  craftTime: number;  // segundos
  xpGained: number;
}

// Exemplo: Espada de Aco
const steelSwordRecipe: CraftingRecipe = {
  id: 'steel_sword',
  name: 'Steel Sword',
  station: 'forge',
  requiredSkill: 25,
  materials: [
    { item: 'steel_ingot', quantity: 3 },
    { item: 'leather', quantity: 1 },
    { item: 'iron_ore', quantity: 2 },
  ],
  result: { item: 'steel_sword', quantity: 1 },
  craftTime: 30,
  xpGained: 50,
};
```

### Skills de Crafting

| Profissao | Crafts | Max Level |
|-----------|--------|-----------|
| **Blacksmithing** | Armas, Armaduras metal | 100 |
| **Alchemy** | Pocoes, Elixires | 100 |
| **Leatherworking** | Armadura leather | 100 |
| **Tailoring** | Armadura cloth | 100 |
| **Enchanting** | Encantamentos | 100 |
| **Jewelcrafting** | Acessorios | 100 |

---

## Refinamento

### Converter Materiais

```typescript
const REFINEMENT_RECIPES = {
  // Ores -> Ingots
  iron_ingot: { input: { iron_ore: 2 }, output: 1, station: 'forge' },
  steel_ingot: { input: { iron_ingot: 2, coal: 1 }, output: 1, station: 'forge' },
  mithril_ingot: { input: { mithril_ore: 3 }, output: 1, station: 'forge' },

  // Leather processing
  fine_leather: { input: { leather: 3 }, output: 1, station: 'workbench' },
  hardened_leather: { input: { fine_leather: 2, oil: 1 }, output: 1, station: 'workbench' },

  // Cloth processing
  silk_cloth: { input: { raw_silk: 3 }, output: 1, station: 'tailor' },
  enchanted_silk: { input: { silk_cloth: 2, mana_essence: 1 }, output: 1, station: 'tailor' },

  // Gems
  cut_ruby: { input: { rough_ruby: 1 }, output: 1, station: 'jeweler', skill: 25 },
  cut_diamond: { input: { rough_diamond: 1 }, output: 1, station: 'jeweler', skill: 75 },
};
```

---

## Qualidade de Craft

### Sistema de Qualidade

```typescript
type CraftQuality = 'normal' | 'good' | 'great' | 'masterwork';

interface QualityBonus {
  normal: 1.0;       // Stats base
  good: 1.1;         // +10% stats
  great: 1.2;        // +20% stats
  masterwork: 1.35;  // +35% stats
}

function determineCraftQuality(
  playerSkill: number,
  recipeSkill: number,
  toolQuality: number
): CraftQuality {
  const skillDiff = playerSkill - recipeSkill;
  const roll = Math.random() * 100;

  // Base chances
  let masterworkChance = Math.min(skillDiff * 0.5, 15);
  let greatChance = Math.min(skillDiff * 1, 30);
  let goodChance = Math.min(skillDiff * 1.5, 40);

  // Tool bonus
  masterworkChance += toolQuality * 2;
  greatChance += toolQuality * 3;
  goodChance += toolQuality * 5;

  if (roll < masterworkChance) return 'masterwork';
  if (roll < masterworkChance + greatChance) return 'great';
  if (roll < masterworkChance + greatChance + goodChance) return 'good';
  return 'normal';
}
```

---

## Encantamentos

### Tipos de Encantamento

| Encantamento | Efeito | Materiais |
|--------------|--------|-----------|
| **Sharpness** | +Dano fisico | Crystal Shard + Iron |
| **Protection** | +Defesa | Crystal Shard + Leather |
| **Swiftness** | +Velocidade | Wind Essence + Feather |
| **Vampiric** | Lifesteal | Blood Essence + Ruby |
| **Burning** | +Dano fogo | Fire Essence + Coal |
| **Freezing** | +Slow on hit | Frost Essence + Sapphire |
| **Wisdom** | +XP ganho | Mana Essence + Emerald |

### Niveis de Encantamento

```typescript
const ENCHANT_LEVELS = {
  1: { modifier: 0.05, cost: { crystals: 1 } },
  2: { modifier: 0.10, cost: { crystals: 3 } },
  3: { modifier: 0.15, cost: { crystals: 7 } },
  4: { modifier: 0.20, cost: { crystals: 15 } },
  5: { modifier: 0.30, cost: { crystals: 30, essence: 1 } },
};
```

---

## Storage

### Inventario

```typescript
const INVENTORY_SLOTS = {
  // Inventario pessoal
  personal: {
    base: 30,
    expandable: true,
    maxSlots: 100,
    expansionCost: (current: number) => Math.pow(2, (current - 30) / 10) * 1000,
  },

  // Banco na cidade
  bank: {
    base: 50,
    expandable: true,
    maxSlots: 500,
    tabs: 10,
    tabCost: 5000,
  },

  // Shared entre personagens da conta
  accountBank: {
    slots: 20,
    expandable: true,
    maxSlots: 100,
  },
};
```

### Stacking

| Tipo | Stack Max |
|------|-----------|
| Materiais comuns | 999 |
| Materiais raros | 99 |
| Pocoes | 50 |
| Equipamentos | 1 |
| Consumiveis especiais | 20 |

---

## Economia

### Vendendo Recursos

```typescript
const SELL_PRICES = {
  // Base prices (gold)
  common: 1,
  uncommon: 5,
  rare: 25,
  epic: 100,
  legendary: 500,

  // Specific items
  iron_ore: 2,
  steel_ingot: 10,
  mithril_ore: 50,
  crystal_shard: 100,
  void_essence: 1000,
};

// Buy prices = Sell * 2.5
const getBuyPrice = (sellPrice: number) => Math.floor(sellPrice * 2.5);
```

### Marketplace

```typescript
interface MarketplaceListing {
  sellerId: string;
  itemId: string;
  quantity: number;
  pricePerUnit: number;
  listedAt: Date;
  expiresAt: Date;
  fee: number;  // 5% do preco
}

const MARKETPLACE_CONFIG = {
  listingFee: 0.01,      // 1% ao listar
  saleFee: 0.05,         // 5% ao vender
  maxListings: 20,
  listingDuration: 48,   // horas
  minPrice: 1,
  maxPrice: 999999,
};
```

---

## Spawn de Recursos

### Distribuicao por Zona

```typescript
const RESOURCE_SPAWNS = {
  floresta: {
    nodes: [
      { type: 'tree', density: 'high', tier: [1, 2] },
      { type: 'herb', density: 'medium', tier: [1] },
      { type: 'stone', density: 'low', tier: [1] },
    ],
    mobs: [
      { type: 'wolf', skinnable: true, tier: 1 },
      { type: 'boar', skinnable: true, tier: 1 },
    ],
  },

  cavernas: {
    nodes: [
      { type: 'ore', density: 'high', tier: [1, 2, 3] },
      { type: 'crystal', density: 'low', tier: [2, 3] },
      { type: 'mushroom', density: 'medium', tier: [1, 2] },
    ],
    mobs: [
      { type: 'spider', skinnable: true, tier: 2 },
      { type: 'bat', skinnable: false, tier: 1 },
    ],
  },

  // ... outras zonas
};
```

---

## Documentos Relacionados

- [ZONES.md](./ZONES.md) - Zonas do mundo
- [QUESTS.md](./QUESTS.md) - Sistema de missoes
- [equipment/ARMOR.md](../equipment/ARMOR.md) - Armaduras
- [character/WEAPONS.md](../character/WEAPONS.md) - Armas
