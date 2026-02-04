# Sistema de Acessorios

## Visao Geral

Acessorios fornecem bonus adicionais e efeitos unicos. Cada personagem pode equipar 2 acessorios.

---

## Tipos de Acessorios

### 1. Aneis

Focados em stats ofensivos.

| ID | Nome | Tier | Efeito | Origem |
|----|------|------|--------|--------|
| R01 | **Iron Ring** | 1 | +5% physical damage | Vendor |
| R02 | **Silver Ring** | 1 | +5% magic damage | Vendor |
| R03 | **Ring of Strength** | 2 | +3 STR | Quest |
| R04 | **Ring of Dexterity** | 2 | +3 DEX | Quest |
| R05 | **Ring of Intelligence** | 2 | +3 INT | Quest |
| R06 | **Critical Strike Ring** | 2 | +8% crit chance | Dungeon |
| R07 | **Vampiric Ring** | 3 | +5% lifesteal | Boss |
| R08 | **Ring of Fury** | 3 | +12% attack speed | Quest |
| R09 | **Assassin's Signet** | 3 | +20% backstab damage | Rare drop |
| R10 | **Berserker Band** | 4 | +15% damage when <50% HP | Boss |
| R11 | **Executioner's Ring** | 4 | +25% damage vs <25% HP | Arena |
| R12 | **Ring of the Void** | 5 | +10% true damage | Void Lord |

### 2. Amuletos

Focados em stats defensivos/utility.

| ID | Nome | Tier | Efeito | Origem |
|----|------|------|--------|--------|
| A01 | **Health Pendant** | 1 | +50 HP | Vendor |
| A02 | **Mana Pendant** | 1 | +30 Mana | Vendor |
| A03 | **Amulet of Constitution** | 2 | +3 CON | Quest |
| A04 | **Amulet of Wisdom** | 2 | +3 WIS | Quest |
| A05 | **Protective Charm** | 2 | +10 Defense | Dungeon |
| A06 | **Spirit Ward** | 2 | +15 Magic Resist | Quest |
| A07 | **Amulet of Regeneration** | 3 | +2% HP/s out of combat | Boss |
| A08 | **Cleansing Charm** | 3 | -20% CC duration | Quest |
| A09 | **Lucky Charm** | 3 | +10% drop rate | Rare |
| A10 | **Amulet of Fortitude** | 4 | +150 HP, +5% damage reduction | Boss |
| A11 | **Phoenix Feather** | 4 | Revive with 20% HP (5min CD) | Phoenix |
| A12 | **Heart of the Void** | 5 | +200 HP, immune to % HP damage | Void Lord |

### 3. Braceletes

Focados em cooldowns e recursos.

| ID | Nome | Tier | Efeito | Origem |
|----|------|------|--------|--------|
| B01 | **Leather Bracer** | 1 | +10 Mana | Vendor |
| B02 | **Copper Bracer** | 1 | -3% CDR | Vendor |
| B03 | **Bracer of Haste** | 2 | -5% CDR | Quest |
| B04 | **Mana Bracer** | 2 | +40 Mana | Quest |
| B05 | **Stamina Band** | 2 | +20 Stamina | Dungeon |
| B06 | **Essence Bracer** | 3 | +3% mana leech | Boss |
| B07 | **Bracer of Swiftness** | 3 | -8% CDR, +5% speed | Quest |
| B08 | **Energy Conduit** | 3 | +2 resource/s regen | Rare |
| B09 | **Arcane Bracer** | 4 | -12% CDR, +60 Mana | Boss |
| B10 | **Time Warper** | 4 | On kill, -3s all CDs | Arena |
| B11 | **Primordial Shackle** | 5 | -15% CDR, first ability free | Final |

### 4. Cintos

Focados em utility variada.

| ID | Nome | Tier | Efeito | Origem |
|----|------|------|--------|--------|
| BT01 | **Utility Belt** | 1 | +2 potion slots | Vendor |
| BT02 | **Pouch of Holding** | 2 | +10 inventory slots | Quest |
| BT03 | **Adventurer's Belt** | 2 | +5% XP gain | Quest |
| BT04 | **Merchant's Sash** | 2 | +10% gold from mobs | Dungeon |
| BT05 | **Combat Belt** | 3 | Potions +20% effective | Boss |
| BT06 | **Explorer's Girdle** | 3 | +15% speed out of combat | Quest |
| BT07 | **Champion's Belt** | 4 | +5% all stats | Arena |
| BT08 | **Belt of Giants** | 4 | +200 HP, +20 Stamina | Boss |
| BT09 | **Void Sash** | 5 | +10% all stats, -10% HP | Void |

---

## Sets de Acessorios

### Set: Assassin's Collection

**Pecas:**
- Assassin's Signet (Ring)
- Shadow Pendant (Amulet)

**Bonus (2 pecas):** +10% crit damage, backstabs silence for 1s

### Set: Berserker's Rage

**Pecas:**
- Berserker Band (Ring)
- Blood Pendant (Amulet)

**Bonus (2 pecas):** Below 30% HP, +20% attack speed

### Set: Archmage's Focus

**Pecas:**
- Ring of Intelligence (Ring)
- Arcane Bracer (Bracer)

**Bonus (2 pecas):** +10% ability damage, -5% CDR

### Set: Tank's Resolve

**Pecas:**
- Amulet of Fortitude (Amulet)
- Belt of Giants (Belt)

**Bonus (2 pecas):** +10% damage reduction, taunt +1s

### Set: Void Touched

**Pecas:**
- Ring of the Void (Ring)
- Heart of the Void (Amulet)
- Void Sash (Belt)

**Bonus (2 pecas):** +5% true damage
**Bonus (3 pecas):** Abilities deal additional 5% max HP damage

---

## Acessorios Unicos (Legendary)

### Ring of the Champion
- **Efeito:** +10% all damage, +5% all defenses
- **Unico:** Kills extend buff duration by 2s
- **Origem:** Season reward

### Amulet of Immortality
- **Efeito:** On fatal damage, become invulnerable for 3s
- **Cooldown:** 300s
- **Origem:** Final boss

### Bracer of Time
- **Efeito:** Every 30s, next ability is instant cast
- **Origem:** Temporal rift event

### Belt of the Cosmos
- **Efeito:** +15% all stats during ultimate
- **Origem:** World boss

---

## Crafting de Acessorios

### Receitas

```typescript
const ACCESSORY_RECIPES = {
  // Tier 2
  ring_of_strength: {
    materials: [
      { item: 'iron_ingot', qty: 5 },
      { item: 'strength_essence', qty: 1 },
    ],
    station: 'jeweler',
    skill: 15,
  },

  // Tier 3
  vampiric_ring: {
    materials: [
      { item: 'silver_ingot', qty: 5 },
      { item: 'blood_essence', qty: 3 },
      { item: 'ruby', qty: 1 },
    ],
    station: 'jeweler',
    skill: 35,
  },

  // Tier 4
  executioners_ring: {
    materials: [
      { item: 'gold_ingot', qty: 10 },
      { item: 'death_essence', qty: 5 },
      { item: 'diamond', qty: 1 },
    ],
    station: 'jeweler',
    skill: 60,
  },
};
```

---

## Encantamentos de Acessorios

| Encantamento | Efeito | Custo |
|--------------|--------|-------|
| Power | +3-10% damage | Crystal x3 |
| Vitality | +30-100 HP | Crystal x3 |
| Haste | +2-6% CDR | Wind Essence |
| Fortune | +3-10% gold | Luck Essence |
| Tenacity | +5-15% CC resist | Earth Essence |

---

## Documentos Relacionados

- [ARMOR.md](./ARMOR.md) - Armaduras
- [RARITY.md](./RARITY.md) - Raridade
- [LOOT-TABLES.md](./LOOT-TABLES.md) - Drops
- [../character/BUILDS.md](../character/BUILDS.md) - Builds
