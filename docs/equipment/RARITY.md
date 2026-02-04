# Sistema de Raridade

## Visao Geral

A raridade define o poder base e a disponibilidade de items no jogo.

---

## Niveis de Raridade

| Raridade | Cor | Multiplicador | Drop Chance |
|----------|-----|---------------|-------------|
| **Common** | Branco | 1.0x | 60% |
| **Uncommon** | Verde | 1.15x | 25% |
| **Rare** | Azul | 1.30x | 10% |
| **Epic** | Roxo | 1.50x | 4% |
| **Legendary** | Laranja | 1.75x | 0.9% |
| **Mythic** | Vermelho | 2.0x | 0.1% |

---

## Bonus por Raridade

### Stats Base

```typescript
const RARITY_MULTIPLIER = {
  common: 1.0,
  uncommon: 1.15,
  rare: 1.30,
  epic: 1.50,
  legendary: 1.75,
  mythic: 2.0,
};

// Exemplo: Espada com 50 de dano base
// Common: 50 damage
// Uncommon: 57 damage
// Rare: 65 damage
// Epic: 75 damage
// Legendary: 87 damage
// Mythic: 100 damage
```

### Slots de Encantamento

| Raridade | Slots | Bonus Stats |
|----------|-------|-------------|
| Common | 0 | Nenhum |
| Uncommon | 1 | +1 stat secundario |
| Rare | 2 | +2 stats secundarios |
| Epic | 3 | +2 stats + 1 especial |
| Legendary | 4 | +3 stats + 1 unico |
| Mythic | 5 | +3 stats + 2 unicos |

---

## Cores Visuais

```css
/* Cores de texto/borda por raridade */
.common { color: #FFFFFF; }      /* Branco */
.uncommon { color: #1EFF00; }    /* Verde */
.rare { color: #0070DD; }        /* Azul */
.epic { color: #A335EE; }        /* Roxo */
.legendary { color: #FF8000; }   /* Laranja */
.mythic { color: #E6CC80; }      /* Dourado/Vermelho */
```

### Efeitos Visuais

| Raridade | Efeito no Item |
|----------|----------------|
| Common | Nenhum |
| Uncommon | Leve brilho |
| Rare | Particulas azuis |
| Epic | Aura roxa pulsante |
| Legendary | Chamas laranja |
| Mythic | Raios + particulas douradas |

---

## Drop Rates por Fonte

### Mobs Normais

| Raridade | Taxa Base | Com Lucky Passive |
|----------|-----------|-------------------|
| Common | 60% | 55% |
| Uncommon | 25% | 26% |
| Rare | 10% | 12% |
| Epic | 4% | 5.5% |
| Legendary | 0.9% | 1.3% |
| Mythic | 0.1% | 0.2% |

### Bosses

| Raridade | Taxa Base |
|----------|-----------|
| Common | 0% |
| Uncommon | 20% |
| Rare | 45% |
| Epic | 25% |
| Legendary | 9% |
| Mythic | 1% |

### Dungeon Chests

| Tipo Chest | Common | Uncommon | Rare | Epic | Legend | Mythic |
|------------|--------|----------|------|------|--------|--------|
| Normal | 40% | 35% | 20% | 4.5% | 0.5% | 0% |
| Elite | 10% | 30% | 40% | 15% | 4.5% | 0.5% |
| Boss | 0% | 15% | 35% | 35% | 12% | 3% |

### Crafting

| Skill Level | Rare | Epic | Legend |
|-------------|------|------|--------|
| 1-25 | 5% | 1% | 0% |
| 26-50 | 15% | 5% | 0.5% |
| 51-75 | 30% | 15% | 2% |
| 76-99 | 45% | 30% | 5% |
| 100 | 50% | 40% | 10% |

---

## Upgrade de Raridade

### Transmutacao

```typescript
const TRANSMUTATION = {
  // Combinar items para upgrade
  recipe: {
    '3 common -> 1 uncommon': { cost: 100 },
    '3 uncommon -> 1 rare': { cost: 500 },
    '3 rare -> 1 epic': { cost: 2000 },
    '3 epic -> 1 legendary': { cost: 10000 },
    // Mythic nao pode ser criado por transmutacao
  },

  // Item resultante e aleatorio do mesmo tier
  randomResult: true,
};
```

### Upgrade Direto (Raro)

```typescript
const DIRECT_UPGRADE = {
  // Consumivel raro
  rarity_stone: {
    effect: 'Aumenta raridade em 1 nivel',
    maxRarity: 'legendary',
    dropRate: 0.001,  // 0.1% de world bosses
  },
};
```

---

## Salvage (Desmanche)

### Materiais por Raridade

| Raridade | Fragments | Essence | Gold |
|----------|-----------|---------|------|
| Common | 1 | 0 | 5 |
| Uncommon | 3 | 0 | 15 |
| Rare | 5 | 1 | 50 |
| Epic | 10 | 3 | 200 |
| Legendary | 25 | 10 | 1000 |
| Mythic | 50 | 25 | 5000 |

---

## Nomes de Items

### Prefixos por Raridade

| Raridade | Prefixos Possiveis |
|----------|-------------------|
| Common | - |
| Uncommon | Fine, Sturdy, Sharp |
| Rare | Superior, Masterwork, Reinforced |
| Epic | Ancient, Enchanted, Blessed |
| Legendary | Heroic, Divine, Legendary |
| Mythic | Primordial, Cosmic, Mythical |

### Exemplo

```
Common:      Iron Sword
Uncommon:    Fine Iron Sword
Rare:        Superior Steel Sword
Epic:        Ancient Mithril Blade
Legendary:   Heroic Dragonslayer
Mythic:      Primordial Void Reaver
```

---

## Documentos Relacionados

- [ARMOR.md](./ARMOR.md) - Armaduras
- [ACCESSORIES.md](./ACCESSORIES.md) - Acessorios
- [LOOT-TABLES.md](./LOOT-TABLES.md) - Tabelas de drop
- [../character/WEAPONS.md](../character/WEAPONS.md) - Armas
