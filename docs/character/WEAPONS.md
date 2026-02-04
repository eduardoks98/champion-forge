# Sistema de Armas (30+)

## Visao Geral

Armas definem o estilo de combate base do personagem.
Cada arma tem ataque basico unico e stats diferentes.

---

## Categorias

| Categoria | Quantidade | Tipo | Range |
|-----------|------------|------|-------|
| Espadas | 8 | Melee | Curto |
| Machados | 4 | Melee | Curto |
| Martelos | 4 | Melee | Curto |
| Lancas | 4 | Melee | Medio |
| Arcos | 4 | Ranged | Longo |
| Cajados | 4 | Ranged | Medio |
| Adagas | 4 | Melee | Muito curto |
| Escudos | 4 | Defesa | - |

**Total: 36 armas**

---

## ESPADAS (8)

### Espadas Curtas

| ID | Nome | Dano | Speed | Range | Especial | Scaling |
|----|------|------|-------|-------|----------|---------|
| SWD01 | **Short Sword** | 30 | 1.2 | 100px | Combo 3 hits | STR 0.8 |
| SWD02 | **Gladius** | 35 | 1.1 | 90px | +10% crit | STR 0.9 |
| SWD03 | **Rapier** | 25 | 1.5 | 120px | Thrust, pierce | DEX 1.0 |
| SWD04 | **Scimitar** | 32 | 1.3 | 100px | Bleed on crit | STR 0.8, DEX 0.3 |

### Espadas Longas

| ID | Nome | Dano | Speed | Range | Especial | Scaling |
|----|------|------|-------|-------|----------|---------|
| SWD05 | **Longsword** | 45 | 0.9 | 140px | Cleave arc | STR 1.0 |
| SWD06 | **Bastard Sword** | 50 | 0.8 | 150px | 2H or 1H+shield | STR 1.1 |
| SWD07 | **Claymore** | 60 | 0.7 | 180px | Wide sweep | STR 1.2 |
| SWD08 | **Flamberge** | 55 | 0.75 | 170px | Armor penetration | STR 1.1 |

### Detalhes de Espadas

```typescript
const shortSword: Weapon = {
  id: 'SWD01',
  name: 'Short Sword',
  type: 'melee',
  subtype: 'sword',

  stats: {
    baseDamage: 30,
    attackSpeed: 1.2, // ataques por segundo
    range: 100,       // pixels
  },

  scaling: {
    STR: 0.8,  // +0.8% dano por ponto STR acima de 10
    DEX: 0.0,
  },

  special: {
    name: 'Combo Master',
    effect: 'Ataques em sequencia (3) = +50% dano no 3o hit',
  },

  animation: {
    type: 'slash',
    frames: 4,
    duration: 250, // ms por ataque
  },
};
```

---

## MACHADOS (4)

| ID | Nome | Dano | Speed | Range | Especial | Scaling |
|----|------|------|-------|-------|----------|---------|
| AXE01 | **Hatchet** | 40 | 0.9 | 90px | Throwable | STR 0.9 |
| AXE02 | **Battle Axe** | 55 | 0.7 | 120px | Armor break 20% | STR 1.1 |
| AXE03 | **Great Axe** | 70 | 0.5 | 160px | Cleave 2 targets | STR 1.3 |
| AXE04 | **Double Axe** | 45 | 1.0 | 100px | Dual wield, 2 hits | STR 1.0, DEX 0.4 |

### Detalhes de Machados

```typescript
const battleAxe: Weapon = {
  id: 'AXE02',
  name: 'Battle Axe',
  type: 'melee',
  subtype: 'axe',

  stats: {
    baseDamage: 55,
    attackSpeed: 0.7,
    range: 120,
  },

  scaling: {
    STR: 1.1,
    DEX: 0.0,
  },

  special: {
    name: 'Armor Break',
    effect: 'Ataques reduzem armor do alvo em 20% por 3s',
  },

  animation: {
    type: 'overhead_swing',
    frames: 5,
    duration: 400,
  },
};
```

---

## MARTELOS (4)

| ID | Nome | Dano | Speed | Range | Especial | Scaling |
|----|------|------|-------|-------|----------|---------|
| HAM01 | **Mace** | 45 | 0.8 | 80px | Stun 0.3s on hit | STR 1.0 |
| HAM02 | **War Hammer** | 65 | 0.5 | 100px | Stun 0.5s, knockback | STR 1.2 |
| HAM03 | **Great Hammer** | 80 | 0.4 | 140px | AoE impact, stun 1s | STR 1.4 |
| HAM04 | **Flail** | 50 | 0.7 | 130px | Ignora shield block | STR 1.0 |

### Detalhes de Martelos

```typescript
const warHammer: Weapon = {
  id: 'HAM02',
  name: 'War Hammer',
  type: 'melee',
  subtype: 'hammer',

  stats: {
    baseDamage: 65,
    attackSpeed: 0.5,
    range: 100,
  },

  scaling: {
    STR: 1.2,
    DEX: 0.0,
  },

  special: {
    name: 'Crushing Blow',
    effect: 'Stun 0.5s + knockback pequeno em cada hit',
  },

  animation: {
    type: 'slam',
    frames: 6,
    duration: 500,
    screenShake: true,
  },
};
```

---

## LANCAS (4)

| ID | Nome | Dano | Speed | Range | Especial | Scaling |
|----|------|------|-------|-------|----------|---------|
| SPR01 | **Spear** | 35 | 1.0 | 180px | Thrust only | DEX 0.7, STR 0.5 |
| SPR02 | **Pike** | 45 | 0.8 | 220px | Extra range, slow | STR 0.8, DEX 0.4 |
| SPR03 | **Halberd** | 55 | 0.6 | 200px | Slash + thrust combo | STR 1.0, DEX 0.2 |
| SPR04 | **Trident** | 40 | 0.9 | 190px | Throwable, pull | DEX 0.9, STR 0.4 |

---

## ARCOS (4)

| ID | Nome | Dano | Speed | Range | Especial | Scaling |
|----|------|------|-------|-------|----------|---------|
| BOW01 | **Short Bow** | 25 | 1.3 | 400px | Fast shots | DEX 0.9 |
| BOW02 | **Long Bow** | 40 | 0.7 | 600px | Charge for +damage | DEX 1.1 |
| BOW03 | **Composite Bow** | 35 | 1.0 | 500px | Balanced | DEX 1.0 |
| BOW04 | **Crossbow** | 55 | 0.5 | 550px | High damage, reload | DEX 0.8, STR 0.4 |

### Detalhes de Arcos

```typescript
const longBow: Weapon = {
  id: 'BOW02',
  name: 'Long Bow',
  type: 'ranged',
  subtype: 'bow',

  stats: {
    baseDamage: 40,
    attackSpeed: 0.7,
    range: 600,
    projectileSpeed: 800, // pixels/s
  },

  scaling: {
    DEX: 1.1,
    STR: 0.0,
  },

  special: {
    name: 'Power Draw',
    effect: 'Segurar ataque por 1s = +100% dano',
  },

  animation: {
    type: 'draw_release',
    drawFrames: 3,
    releaseFrames: 2,
    maxDrawTime: 1500,
  },
};
```

---

## CAJADOS (4)

| ID | Nome | Dano | Speed | Range | Especial | Scaling |
|----|------|------|-------|-------|----------|---------|
| STF01 | **Wooden Staff** | 20 | 1.2 | 350px | +10% mana regen | INT 0.8 |
| STF02 | **Crystal Staff** | 35 | 0.9 | 400px | Projectile pierces | INT 1.1 |
| STF03 | **Fire Staff** | 30 | 1.0 | 380px | Burn on hit | INT 1.0 |
| STF04 | **Ice Staff** | 30 | 1.0 | 380px | Slow on hit | INT 1.0 |

### Detalhes de Cajados

```typescript
const fireStaff: Weapon = {
  id: 'STF03',
  name: 'Fire Staff',
  type: 'ranged',
  subtype: 'staff',

  stats: {
    baseDamage: 30,
    attackSpeed: 1.0,
    range: 380,
    projectileSpeed: 600,
  },

  scaling: {
    INT: 1.0,
    WIS: 0.2,
  },

  special: {
    name: 'Burning Touch',
    effect: 'Ataques basicos aplicam burn (5 dano/s por 2s)',
  },

  projectile: {
    type: 'fireball_small',
    color: '#ff6600',
    trail: true,
  },
};
```

---

## ADAGAS (4)

| ID | Nome | Dano | Speed | Range | Especial | Scaling |
|----|------|------|-------|-------|----------|---------|
| DAG01 | **Dagger** | 15 | 2.0 | 60px | Very fast | DEX 1.0 |
| DAG02 | **Kris** | 20 | 1.8 | 70px | +25% crit damage | DEX 1.1 |
| DAG03 | **Stiletto** | 25 | 1.5 | 80px | Armor penetration | DEX 0.9, STR 0.3 |
| DAG04 | **Dual Daggers** | 12x2 | 2.2 | 65px | Two hits per attack | DEX 1.2 |

### Detalhes de Adagas

```typescript
const dualDaggers: Weapon = {
  id: 'DAG04',
  name: 'Dual Daggers',
  type: 'melee',
  subtype: 'dagger',

  stats: {
    baseDamage: 12,
    hitsPerAttack: 2,
    attackSpeed: 2.2,
    range: 65,
  },

  scaling: {
    DEX: 1.2,
    STR: 0.0,
  },

  special: {
    name: 'Flurry',
    effect: 'Cada ataque sao 2 hits. Backstab bonus aplica em ambos.',
  },

  animation: {
    type: 'dual_slash',
    frames: 3,
    duration: 200,
  },
};
```

---

## ESCUDOS (4)

Escudos sao equipados na mao secundaria (com armas 1H).

| ID | Nome | Block | Weight | Especial | Req |
|----|------|-------|--------|----------|-----|
| SHD01 | **Buckler** | 40% | Light | Parry window +0.2s | - |
| SHD02 | **Round Shield** | 60% | Medium | Block arc 180° | STR 12 |
| SHD03 | **Kite Shield** | 70% | Heavy | Block arc 220° | STR 14 |
| SHD04 | **Tower Shield** | 90% | Very Heavy | Full front block, -30% speed | STR 16 |

### Mecanica de Block

```typescript
interface ShieldMechanics {
  // Block reduz dano baseado em %
  blockReduction: number;

  // Angulo de block (de frente)
  blockArc: number;

  // Stamina drenada por segundo enquanto bloqueia
  staminaDrain: number;

  // Stamina perdida por hit bloqueado
  staminaPerBlock: number;

  // Tempo de parry perfeito (bonus damage reflect)
  parryWindow: number;
}

const roundShield: Shield = {
  id: 'SHD02',
  name: 'Round Shield',
  type: 'shield',

  block: {
    reduction: 0.6,      // 60% damage reduction
    arc: 180,            // graus
    staminaDrain: 10,    // por segundo
    staminaPerBlock: 15, // por hit
    parryWindow: 0.15,   // segundos
  },

  weight: 'medium',
  movementPenalty: 0.1,  // -10% speed enquanto equipa

  requirement: {
    STR: 12,
  },
};
```

---

## Raridades

Cada arma pode ter diferentes raridades que afetam stats:

| Raridade | Drop Rate | Stat Bonus | Visual |
|----------|-----------|------------|--------|
| Common | 60% | +0% | Cinza |
| Uncommon | 25% | +10% | Verde |
| Rare | 10% | +25% | Azul |
| Epic | 4% | +40% | Roxo |
| Legendary | 1% | +60% + especial unico | Dourado |

### Exemplo de Arma Rara

```typescript
const rareLongsword: Weapon = {
  ...baseLongsword,
  rarity: 'rare',

  stats: {
    baseDamage: 45 * 1.25, // 56.25
    attackSpeed: 0.9,
    range: 140,
  },

  // Bonus aleatorio de raridade
  bonusStats: {
    critChance: 0.05, // +5% crit
  },
};
```

---

## Armas Legendarias (Exemplos)

| Nome | Base | Efeito Especial |
|------|------|-----------------|
| **Excalibur** | Longsword | Cura 5% do dano causado |
| **Mjolnir** | War Hammer | Chance de chain lightning |
| **Gungnir** | Pike | Sempre acerta (ignora dodge) |
| **Apollon** | Long Bow | Projeteis explodem ao acertar |
| **Frostmourne** | Claymore | Slow stacking em hits |

---

## Como Obter

| Metodo | Armas Disponiveis |
|--------|-------------------|
| Loja (gold) | Common, Uncommon |
| Mob drops | Common-Rare |
| Boss drops | Rare-Epic |
| Dungeons | Epic-Legendary |
| Crafting | Qualquer (com materiais) |
| Arena tokens | Especiais de PvP |

---

## Crafting

```typescript
interface WeaponRecipe {
  result: WeaponId;
  materials: {
    item: MaterialId;
    quantity: number;
  }[];
  goldCost: number;
  craftTime: number; // segundos
}

const longswordRecipe: WeaponRecipe = {
  result: 'SWD05',
  materials: [
    { item: 'iron_ingot', quantity: 5 },
    { item: 'leather_strip', quantity: 2 },
  ],
  goldCost: 100,
  craftTime: 30,
};
```

---

## Balanceamento DPS

Todas as armas visam DPS similar em sustained combat:

| Arma | Dano | Speed | DPS Teorico |
|------|------|-------|-------------|
| Short Sword | 30 | 1.2 | 36 |
| Longsword | 45 | 0.9 | 40.5 |
| Great Axe | 70 | 0.5 | 35 |
| Short Bow | 25 | 1.3 | 32.5 |
| Dual Daggers | 24 (12x2) | 2.2 | 52.8* |

*Dual Daggers tem DPS maior mas range muito curto (risco)

### Formula de DPS

```typescript
const calculateDPS = (weapon: Weapon, character: Character) => {
  const scalingBonus = calculateScaling(weapon.scaling, character.attributes);
  const effectiveDamage = weapon.stats.baseDamage * (1 + scalingBonus);
  const critMultiplier = 1 + (character.critChance * (character.critDamage - 1));

  return effectiveDamage * weapon.stats.attackSpeed * critMultiplier;
};
```

---

## Proximos Documentos

- [ARMOR.md](../equipment/ARMOR.md) - Armaduras
- [ACCESSORIES.md](../equipment/ACCESSORIES.md) - Aneis, amuletos
- [BUILDS.md](./BUILDS.md) - Combinacoes otimizadas
