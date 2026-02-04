# Formulas de Balanceamento

## Visao Geral

Este documento contem todas as formulas matematicas usadas no calculo de stats, dano e progressao.

---

## Atributos para Stats

### Forca (STR)

```typescript
// Dano fisico bonus
const physicalDamageBonus = (str: number) => {
  const modifier = Math.floor((str - 10) / 2);
  return 1 + (modifier * 0.03);  // +3% por ponto de modifier
};

// Exemplo: STR 20 = modifier 5 = +15% dano fisico

// Capacidade de carga
const carryCapacity = (str: number) => {
  return 50 + (str * 5);  // Base 50 + 5 por STR
};
```

### Destreza (DEX)

```typescript
// Velocidade de movimento
const movementSpeed = (baseSPeed: number, dex: number) => {
  const modifier = Math.floor((dex - 10) / 2);
  return baseSpeed * (1 + modifier * 0.02);  // +2% por modifier
};

// Chance de critico
const critChance = (dex: number) => {
  const modifier = Math.floor((dex - 10) / 2);
  return 0.05 + (modifier * 0.015);  // 5% base + 1.5% por modifier
};

// Dano critico
const critDamage = (dex: number) => {
  const modifier = Math.floor((dex - 10) / 2);
  return 1.5 + (modifier * 0.05);  // 150% base + 5% por modifier
};

// Chance de esquiva
const dodgeChance = (dex: number) => {
  const modifier = Math.floor((dex - 10) / 2);
  return Math.min(modifier * 0.01, 0.15);  // Max 15%
};
```

### Constituicao (CON)

```typescript
// HP maximo
const maxHp = (con: number, level: number) => {
  const modifier = Math.floor((con - 10) / 2);
  const baseHp = 100 + (level * 10);
  return Math.floor(baseHp * (1 + modifier * 0.04));  // +4% por modifier
};

// Regeneracao HP
const hpRegen = (con: number) => {
  const modifier = Math.floor((con - 10) / 2);
  return 0.5 + (modifier * 0.2);  // HP/segundo base + bonus
};

// Resistencia a status
const statusResist = (con: number) => {
  const modifier = Math.floor((con - 10) / 2);
  return modifier * 0.02;  // 2% por modifier
};
```

### Inteligencia (INT)

```typescript
// Dano magico bonus
const magicDamageBonus = (int: number) => {
  const modifier = Math.floor((int - 10) / 2);
  return 1 + (modifier * 0.04);  // +4% por modifier
};

// Cooldown reduction
const cooldownReduction = (int: number) => {
  const modifier = Math.floor((int - 10) / 2);
  return Math.min(modifier * 0.02, 0.4);  // Max 40% CDR
};

// Mana maximo
const maxMana = (int: number, level: number) => {
  const modifier = Math.floor((int - 10) / 2);
  const baseMana = 50 + (level * 5);
  return Math.floor(baseMana * (1 + modifier * 0.05));
};
```

### Sabedoria (WIS)

```typescript
// Resistencia magica
const magicResist = (wis: number) => {
  const modifier = Math.floor((wis - 10) / 2);
  return 10 + (modifier * 3);  // 10 base + 3 por modifier
};

// Eficiencia de cura recebida
const healingReceived = (wis: number) => {
  const modifier = Math.floor((wis - 10) / 2);
  return 1 + (modifier * 0.03);  // +3% por modifier
};

// Regeneracao mana
const manaRegen = (wis: number) => {
  const modifier = Math.floor((wis - 10) / 2);
  return 1 + (modifier * 0.3);  // Mana/segundo
};
```

### Carisma (CHA)

```typescript
// Bonus de gold
const goldBonus = (cha: number) => {
  const modifier = Math.floor((cha - 10) / 2);
  return 1 + (modifier * 0.02);  // +2% por modifier
};

// Chance de drop raro
const rareDropBonus = (cha: number) => {
  const modifier = Math.floor((cha - 10) / 2);
  return modifier * 0.01;  // +1% por modifier
};

// Precos em NPC
const priceModifier = (cha: number) => {
  const modifier = Math.floor((cha - 10) / 2);
  return Math.max(0.8, 1 - (modifier * 0.02));  // Min 80% do preco
};
```

---

## Calculo de Dano

### Dano Fisico

```typescript
function calculatePhysicalDamage(
  attacker: Character,
  defender: Character,
  baseDamage: number,
  scaling: number = 0
): number {
  // Dano base + scaling
  const rawDamage = baseDamage + (attacker.str * scaling);

  // Bonus de STR
  const strBonus = physicalDamageBonus(attacker.str);

  // Critico
  const critMult = rollCrit(attacker) ? critDamage(attacker.dex) : 1;

  // Dano bruto
  let damage = rawDamage * strBonus * critMult;

  // Reducao por armadura
  const armorReduction = defender.armor / (defender.armor + 100);
  damage *= (1 - armorReduction);

  // Modificadores adicionais
  damage *= attacker.getDamageModifier();
  damage *= defender.getDamageReduction();

  return Math.floor(damage);
}
```

### Dano Magico

```typescript
function calculateMagicDamage(
  attacker: Character,
  defender: Character,
  baseDamage: number,
  scaling: number = 0
): number {
  // Dano base + scaling
  const rawDamage = baseDamage + (attacker.int * scaling);

  // Bonus de INT
  const intBonus = magicDamageBonus(attacker.int);

  // Dano bruto
  let damage = rawDamage * intBonus;

  // Reducao por resist magica
  const magicReduction = defender.magicResist / (defender.magicResist + 100);
  damage *= (1 - magicReduction);

  // Modificadores
  damage *= attacker.getAbilityModifier();
  damage *= defender.getMagicReduction();

  return Math.floor(damage);
}
```

### Dano Verdadeiro

```typescript
function calculateTrueDamage(
  baseDamage: number,
  scaling: number,
  attackerStat: number
): number {
  // Ignora toda defesa
  return Math.floor(baseDamage + (attackerStat * scaling));
}
```

### Dano Percentual

```typescript
function calculatePercentDamage(
  targetMaxHp: number,
  percent: number,
  cap: number = Infinity
): number {
  return Math.min(Math.floor(targetMaxHp * percent), cap);
}
```

---

## Reducao de Dano

### Armadura

```typescript
// Reducao = Armor / (Armor + 100)
// 100 Armor = 50% reducao
// 200 Armor = 66% reducao
// 300 Armor = 75% reducao

function armorReduction(armor: number): number {
  return armor / (armor + 100);
}

// Penetracao de armadura
function effectiveArmor(armor: number, armorPen: number, armorPenPercent: number): number {
  // Flat pen primeiro, depois %
  let effective = Math.max(0, armor - armorPen);
  effective *= (1 - armorPenPercent);
  return effective;
}
```

### Resist Magica

```typescript
// Mesma formula da armadura
function magicReduction(magicResist: number): number {
  return magicResist / (magicResist + 100);
}
```

---

## Progressao

### XP para Level

```typescript
// XP necessario para subir de level
function xpForLevel(currentLevel: number): number {
  return Math.floor(100 * Math.pow(1.15, currentLevel - 1));
}

// Level 1->2: 100 XP
// Level 10->11: 352 XP
// Level 30->31: 3,641 XP
// Level 50->51: 37,648 XP

// XP total acumulado ate level N
function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpForLevel(i);
  }
  return total;
}
```

### XP de Mobs

```typescript
function mobXp(mobLevel: number, playerLevel: number): number {
  const baseXp = 10 + (mobLevel * 5);
  const levelDiff = mobLevel - playerLevel;

  // Bonus/penalidade por diferenca de level
  let modifier = 1;
  if (levelDiff > 5) modifier = 1.5;        // Mob muito forte
  else if (levelDiff > 0) modifier = 1.2;   // Mob mais forte
  else if (levelDiff < -5) modifier = 0.5;  // Mob muito fraco
  else if (levelDiff < 0) modifier = 0.8;   // Mob mais fraco

  return Math.floor(baseXp * modifier);
}
```

---

## Economia

### Gold de Mobs

```typescript
function mobGold(mobLevel: number, rarity: Rarity): number {
  const base = 5 + (mobLevel * 2);
  const rarityMult = {
    common: 1,
    elite: 3,
    boss: 10,
    worldBoss: 50,
  };
  return Math.floor(base * rarityMult[rarity]);
}
```

### Precos de Items

```typescript
function itemValue(item: Item): number {
  const baseTierValue = {
    1: 100,
    2: 500,
    3: 2000,
    4: 8000,
    5: 30000,
  };

  const rarityMult = {
    common: 1,
    uncommon: 2,
    rare: 5,
    epic: 15,
    legendary: 50,
    mythic: 200,
  };

  return baseTierValue[item.tier] * rarityMult[item.rarity];
}

// Venda = 40% do valor
function sellPrice(item: Item): number {
  return Math.floor(itemValue(item) * 0.4);
}
```

---

## Arena

### MMR Change

```typescript
function calculateMmrChange(
  playerMmr: number,
  opponentMmr: number,
  won: boolean,
  kFactor: number = 32
): number {
  const expected = 1 / (1 + Math.pow(10, (opponentMmr - playerMmr) / 400));
  const actual = won ? 1 : 0;
  return Math.round(kFactor * (actual - expected));
}
```

### LP Gain

```typescript
function calculateLpGain(
  playerMmr: number,
  divisionMmr: number,
  won: boolean
): number {
  const mmrDiff = playerMmr - divisionMmr;

  if (won) {
    // Base 20, ajustado por MMR
    return Math.round(20 + (mmrDiff / 50));
  } else {
    // Base -18, ajustado por MMR
    return Math.round(-18 + (mmrDiff / 50));
  }
}
```

---

## Habilidades

### Cooldown Final

```typescript
function calculateCooldown(
  baseCooldown: number,
  cdrPercent: number,
  bonusFlat: number = 0
): number {
  // CDR cap de 40%
  const effectiveCdr = Math.min(cdrPercent, 0.4);
  return Math.max(1, (baseCooldown * (1 - effectiveCdr)) - bonusFlat);
}
```

### Dano de Habilidade

```typescript
function calculateAbilityDamage(
  ability: Ability,
  caster: Character,
  target?: Character
): number {
  let damage = ability.baseDamage;

  // Scaling
  if (ability.scaling.str) {
    damage += caster.str * ability.scaling.str;
  }
  if (ability.scaling.int) {
    damage += caster.int * ability.scaling.int;
  }
  if (ability.scaling.dex) {
    damage += caster.dex * ability.scaling.dex;
  }

  // Ability power modifier
  damage *= caster.getAbilityPowerMod();

  // Level scaling
  damage *= (1 + (caster.level * 0.02));

  return Math.floor(damage);
}
```

---

## Crowd Control

### Diminishing Returns

```typescript
function calculateCcDuration(
  baseDuration: number,
  recentCcCount: number
): number {
  const reduction = Math.min(recentCcCount * 0.25, 0.75);
  return baseDuration * (1 - reduction);
}

// 1st CC: 100% duration
// 2nd CC: 75% duration
// 3rd CC: 50% duration
// 4th+: 25% duration
```

### Tenacity

```typescript
function applyTenacity(
  duration: number,
  tenacity: number
): number {
  return duration * (1 - tenacity);
}

// Multiplicativo com multiplas fontes
function totalTenacity(sources: number[]): number {
  let result = 1;
  for (const t of sources) {
    result *= (1 - t);
  }
  return 1 - result;
}
```

---

## Documentos Relacionados

- [POWER-BUDGET.md](./POWER-BUDGET.md) - Sistema de budget
- [SPREADSHEETS.md](./SPREADSHEETS.md) - Templates
- [../character/ATTRIBUTES.md](../character/ATTRIBUTES.md) - Atributos
- [../arena/BALANCE.md](../arena/BALANCE.md) - Balanceamento arena
