# Sistema de Armaduras

## Visao Geral

Armaduras definem a defesa e estilo de jogo do personagem, divididas em tres categorias principais.

---

## Categorias de Armadura

### 1. Light Armor (Couro)

**Caracteristicas:**
- Baixa defesa fisica
- Media defesa magica
- Bonus de mobilidade
- Ideal para: Assassinos, Rangers

```typescript
interface LightArmor {
  baseDefense: 'low';        // 10-30
  magicResist: 'medium';     // 15-35
  movementBonus: '+10%';
  dodgeChance: '+5%';
  restriction: 'none';
}
```

### 2. Medium Armor (Cota de Malha)

**Caracteristicas:**
- Defesa fisica media
- Defesa magica media
- Sem bonus/penalidade de movimento
- Ideal para: Bruisers, Duelistas

```typescript
interface MediumArmor {
  baseDefense: 'medium';     // 25-50
  magicResist: 'medium';     // 20-40
  movementBonus: '0%';
  restriction: 'none';
}
```

### 3. Heavy Armor (Placa)

**Caracteristicas:**
- Alta defesa fisica
- Baixa defesa magica
- Penalidade de movimento
- Ideal para: Tanks, Frontline

```typescript
interface HeavyArmor {
  baseDefense: 'high';       // 40-80
  magicResist: 'low';        // 10-25
  movementPenalty: '-10%';
  dodgePenalty: '-5%';
  restriction: 'CON >= 15';
}
```

### 4. Cloth Armor (Robes)

**Caracteristicas:**
- Minima defesa fisica
- Alta defesa magica
- Bonus de mana/CDR
- Ideal para: Mages, Supports

```typescript
interface ClothArmor {
  baseDefense: 'minimal';    // 5-15
  magicResist: 'high';       // 30-60
  manaBonus: '+10%';
  cdrBonus: '+5%';
  restriction: 'none';
}
```

---

## Sets de Armadura

### Tier 1 (Level 1-10)

#### Leather Set (Light)
| Peca | Defesa | Bonus | Drop |
|------|--------|-------|------|
| Leather Cap | 5 | +2% dodge | Wolf |
| Leather Vest | 10 | +3% speed | Boar |
| Leather Pants | 7 | +2% speed | Wolf |
| Leather Boots | 5 | +5% speed | Vendor |

**Set Bonus (4 pecas):** +10% attack speed

#### Chain Set (Medium)
| Peca | Defesa | Bonus | Drop |
|------|--------|-------|------|
| Chain Coif | 8 | +10 HP | Bandit |
| Chain Hauberk | 15 | +20 HP | Quest |
| Chain Leggings | 10 | +15 HP | Bandit |
| Chain Boots | 7 | +5 HP | Vendor |

**Set Bonus (4 pecas):** +50 HP

#### Iron Set (Heavy)
| Peca | Defesa | Bonus | Drop |
|------|--------|-------|------|
| Iron Helm | 12 | +5% block | Quest |
| Iron Plate | 25 | +10% block | Boss |
| Iron Greaves | 18 | - | Quest |
| Iron Boots | 12 | -3% speed | Vendor |

**Set Bonus (4 pecas):** +15% damage reduction

#### Novice Robes (Cloth)
| Peca | Defesa | MRes | Bonus | Drop |
|------|--------|------|-------|------|
| Novice Hood | 2 | 8 | +5 mana | Quest |
| Novice Robe | 5 | 15 | +10 mana | Vendor |
| Novice Pants | 3 | 10 | +5 mana | Vendor |
| Novice Shoes | 2 | 7 | +2% CDR | Vendor |

**Set Bonus (4 pecas):** +20% mana regen

---

### Tier 2 (Level 10-20)

#### Hunter Set (Light)
| Peca | Defesa | Bonus | Drop |
|------|--------|-------|------|
| Hunter Cap | 10 | +5% crit | Spider |
| Hunter Vest | 18 | +8% speed | Quest |
| Hunter Pants | 14 | +5% dodge | Spider |
| Hunter Boots | 10 | +8% speed | Vendor |

**Set Bonus:** +15% ranged damage

#### Warrior Set (Medium)
| Peca | Defesa | Bonus | Drop |
|------|--------|-------|------|
| Warrior Helm | 15 | +25 HP | Crystal Golem |
| Warrior Armor | 28 | +50 HP | Quest |
| Warrior Leggings | 20 | +30 HP | Dungeon |
| Warrior Boots | 12 | +20 HP | Vendor |

**Set Bonus:** +10% melee damage

#### Knight Set (Heavy)
| Peca | Defesa | Bonus | Drop |
|------|--------|-------|------|
| Knight Helm | 22 | +10% block | Boss |
| Knight Plate | 45 | +15% block | Quest |
| Knight Greaves | 32 | +100 HP | Dungeon |
| Knight Boots | 20 | - | Vendor |

**Set Bonus:** Taunt duration +1s

#### Mage Robes (Cloth)
| Peca | Defesa | MRes | Bonus | Drop |
|------|--------|------|-------|------|
| Mage Hood | 5 | 18 | +10 mana | Elemental |
| Mage Robe | 10 | 30 | +25 mana | Quest |
| Mage Pants | 7 | 22 | +15 mana | Dungeon |
| Mage Shoes | 5 | 15 | +5% CDR | Vendor |

**Set Bonus:** +15% ability damage

---

### Tier 3 (Level 20-35)

#### Shadow Set (Light)
| Peca | Defesa | Bonus | Drop |
|------|--------|-------|------|
| Shadow Hood | 18 | +10% crit, +5% dodge | Desert |
| Shadow Vest | 30 | +15% backstab | Sand Emperor |
| Shadow Pants | 24 | +10% speed | Dungeon |
| Shadow Boots | 16 | +12% speed | Quest |

**Set Bonus:** +2s invisibility duration

#### Gladiator Set (Medium)
| Peca | Defesa | Bonus | Drop |
|------|--------|-------|------|
| Gladiator Helm | 28 | +5% lifesteal | Arena |
| Gladiator Armor | 50 | +100 HP, +10% damage | Quest |
| Gladiator Leggings | 38 | +75 HP | Desert |
| Gladiator Boots | 24 | +50 HP, +5% speed | Arena |

**Set Bonus:** +10% damage when below 50% HP

#### Fortress Set (Heavy)
| Peca | Defesa | Bonus | Drop |
|------|--------|-------|------|
| Fortress Helm | 40 | +20% block | Pyramid |
| Fortress Plate | 75 | +25% block, -15% speed | Boss |
| Fortress Greaves | 55 | +200 HP | Dungeon |
| Fortress Boots | 35 | -8% speed | Quest |

**Set Bonus:** Reflect 20% melee damage

#### Archmage Robes (Cloth)
| Peca | Defesa | MRes | Bonus | Drop |
|------|--------|------|-------|------|
| Archmage Hood | 10 | 35 | +30 mana | Ruinas |
| Archmage Robe | 18 | 55 | +50 mana, +10% CDR | Boss |
| Archmage Pants | 14 | 42 | +40 mana | Quest |
| Archmage Shoes | 10 | 28 | +8% CDR | Dungeon |

**Set Bonus:** Abilities cost 20% less mana

---

### Tier 4 (Level 35-50)

#### Assassin Set (Light)
| Peca | Defesa | Bonus | Drop |
|------|--------|-------|------|
| Assassin Mask | 28 | +15% crit, +10% crit dmg | Vulcao |
| Assassin Vest | 45 | +25% backstab | Boss |
| Assassin Pants | 36 | +15% speed | Dungeon |
| Assassin Boots | 25 | +15% speed, +5% dodge | Quest |

**Set Bonus:** First attack after stealth +50% damage

#### Champion Set (Medium)
| Peca | Defesa | Bonus | Drop |
|------|--------|-------|------|
| Champion Helm | 42 | +10% all damage | Raid |
| Champion Armor | 72 | +200 HP, +8% lifesteal | Boss |
| Champion Leggings | 55 | +150 HP | Vulcao |
| Champion Boots | 38 | +100 HP, +8% speed | Quest |

**Set Bonus:** On kill, restore 15% HP/Mana

#### Titan Set (Heavy)
| Peca | Defesa | Bonus | Drop |
|------|--------|-------|------|
| Titan Helm | 60 | +25% CC resist | Volcanic Titan |
| Titan Plate | 110 | +30% block, +400 HP | Raid |
| Titan Greaves | 82 | +300 HP | Dungeon |
| Titan Boots | 55 | +150 HP, -10% speed | Quest |

**Set Bonus:** When below 30% HP, +50% armor for 5s

#### Void Weaver Robes (Cloth)
| Peca | Defesa | MRes | Bonus | Drop |
|------|--------|------|-------|------|
| Void Hood | 18 | 55 | +60 mana, +20% ability dmg | Abismo |
| Void Robe | 30 | 85 | +100 mana, +15% CDR | Void Lord |
| Void Pants | 24 | 68 | +80 mana | Dungeon |
| Void Shoes | 18 | 50 | +12% CDR | Quest |

**Set Bonus:** Abilities have 10% chance to reset cooldown

---

### Tier 5 (Level 50+) - Legendary

#### Phantom Set (Light)
| Peca | Defesa | Bonus | Drop |
|------|--------|-------|------|
| Phantom Cowl | 40 | +20% crit, +15% dodge | World Boss |
| Phantom Coat | 65 | +30% backstab, +20% speed | Raid |
| Phantom Leggings | 52 | +20% speed | Mythic Dungeon |
| Phantom Boots | 38 | +20% speed, +10% dodge | Event |

**Set Bonus:** Every 3rd attack from stealth deals true damage

#### Warlord Set (Medium)
| Peca | Defesa | Bonus | Drop |
|------|--------|-------|------|
| Warlord Helm | 60 | +15% all damage | World Boss |
| Warlord Armor | 100 | +300 HP, +12% lifesteal | Raid |
| Warlord Leggings | 78 | +200 HP | Mythic |
| Warlord Boots | 55 | +150 HP, +12% speed | Event |

**Set Bonus:** Killing blow heals for 25% max HP

#### Immortal Set (Heavy)
| Peca | Defesa | Bonus | Drop |
|------|--------|-------|------|
| Immortal Helm | 85 | +40% CC resist | World Boss |
| Immortal Plate | 150 | +40% block, +600 HP | Final Boss |
| Immortal Greaves | 115 | +450 HP | Raid |
| Immortal Boots | 78 | +300 HP | Mythic |

**Set Bonus:** Once per fight, revive with 30% HP on death

#### Primordial Robes (Cloth)
| Peca | Defesa | MRes | Bonus | Drop |
|------|--------|------|-------|------|
| Primordial Crown | 28 | 78 | +100 mana, +30% ability | Final Boss |
| Primordial Robe | 45 | 120 | +150 mana, +20% CDR | World Boss |
| Primordial Pants | 36 | 95 | +120 mana | Raid |
| Primordial Shoes | 28 | 70 | +15% CDR | Mythic |

**Set Bonus:** Casting ultimate resets Q cooldown

---

## Upgrade e Encantamento

### Upgrade de Armadura

```typescript
const ARMOR_UPGRADE = {
  // Materiais por tier
  materials: {
    '+1': { fragments: 5, gold: 100 },
    '+2': { fragments: 10, gold: 250 },
    '+3': { fragments: 20, gold: 500 },
    '+4': { fragments: 40, gold: 1000 },
    '+5': { fragments: 80, gold: 2500 },
  },

  // Bonus por upgrade
  bonus: {
    defense: '+5%',
    magicResist: '+5%',
    setBonus: 'Unchanged',
  },

  // Chance de sucesso
  successRate: {
    '+1': 100,
    '+2': 90,
    '+3': 75,
    '+4': 50,
    '+5': 30,
  },
};
```

### Encantamentos de Armadura

| Encantamento | Efeito | Materiais |
|--------------|--------|-----------|
| Fortitude | +50-150 HP | Iron + Crystal |
| Resilience | +10-25 Defense | Steel + Crystal |
| Warding | +15-35 Magic Resist | Silver + Mana Essence |
| Swiftness | +5-12% Speed | Wind Essence |
| Vitality | +3-8% HP Regen | Nature Essence |

---

## Documentos Relacionados

- [ACCESSORIES.md](./ACCESSORIES.md) - Acessorios
- [RARITY.md](./RARITY.md) - Sistema de raridade
- [LOOT-TABLES.md](./LOOT-TABLES.md) - Tabelas de drop
- [../character/BUILDS.md](../character/BUILDS.md) - Builds
