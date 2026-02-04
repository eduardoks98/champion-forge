# Sistema de Atributos (D&D Inspired)

## Atributos Primarios

| Atributo | Sigla | Descricao | Impacto no Jogo |
|----------|-------|-----------|-----------------|
| **Forca (STR)** | STR | Poder fisico, capacidade de carga | Dano melee, knockback, carry weight |
| **Destreza (DEX)** | DEX | Agilidade, reflexos, precisao | Velocidade, esquiva, dano ranged, crit |
| **Constituicao (CON)** | CON | Resistencia fisica, vitalidade | HP maximo, regen, resistencia status |
| **Inteligencia (INT)** | INT | Raciocinio, memoria | Dano magico, CDR, XP bonus |
| **Sabedoria (WIS)** | WIS | Percepcao, intuicao | Resist magica, deteccao, cura recebida |
| **Carisma (CHA)** | CHA | Presenca, lideranca | Buff aliados, precos loja, drops raros |

---

## Formulas Base

```typescript
// ===== MODIFICADORES =====

// Modificador de atributo (D&D style)
// 10 = neutro, cada 2 pontos = +1/-1
const getModifier = (stat: number) => Math.floor((stat - 10) / 2);

// Exemplo:
// stat 6 = -2
// stat 8 = -1
// stat 10 = 0
// stat 12 = +1
// stat 14 = +2
// stat 16 = +3
// stat 18 = +4
// stat 20 = +5


// ===== STATS DERIVADOS =====

// HP Maximo
// Base: 100, escala com CON
const maxHp = (con: number, level: number) => {
  return 100 + (con * 5) + (level * getModifier(con) * 2);
};
// CON 10, Level 1 = 100 + 50 + 0 = 150 HP
// CON 16, Level 10 = 100 + 80 + 60 = 240 HP


// Mana Maxima (se usar magias)
const maxMana = (int: number, level: number) => {
  return 50 + (int * 3) + (level * getModifier(int));
};


// Stamina Maxima (para dodge, block, skills fisicas)
const maxStamina = (con: number, dex: number) => {
  return 100 + (getModifier(con) * 10) + (getModifier(dex) * 5);
};


// Velocidade de Movimento
const moveSpeed = (dex: number, armor: ArmorType) => {
  const baseSpeed = 300; // pixels/segundo
  const dexBonus = 1 + (getModifier(dex) * 0.03);
  const armorPenalty = {
    light: 1.0,
    medium: 0.9,
    heavy: 0.75,
  }[armor];

  return baseSpeed * dexBonus * armorPenalty;
};


// ===== DANO =====

// Dano Fisico (melee)
const physicalDamage = (baseDamage: number, str: number) => {
  return baseDamage * (1 + getModifier(str) * 0.1);
};

// Dano Fisico (ranged)
const rangedDamage = (baseDamage: number, dex: number) => {
  return baseDamage * (1 + getModifier(dex) * 0.1);
};

// Dano Magico
const magicDamage = (baseDamage: number, int: number) => {
  return baseDamage * (1 + getModifier(int) * 0.12);
};


// ===== CHANCES =====

// Chance de Critico
const critChance = (dex: number, bonusCrit: number = 0) => {
  return Math.min(0.5, 0.05 + (getModifier(dex) * 0.02) + bonusCrit);
};
// DEX 10 = 5%
// DEX 14 = 9%
// DEX 18 = 13%


// Dano Critico
const critDamage = (baseMult: number = 1.5, bonusCritDmg: number = 0) => {
  return baseMult + bonusCritDmg;
};


// Chance de Esquiva
const dodgeChance = (dex: number, bonusDodge: number = 0) => {
  return Math.min(0.3, (getModifier(dex) * 0.02) + bonusDodge);
};


// ===== DEFESA =====

// Reducao de Dano Fisico
const physicalReduction = (armor: number) => {
  // Diminishing returns: 100 armor = 50%, 200 armor = 66%
  return armor / (armor + 100);
};

// Reducao de Dano Magico
const magicReduction = (wis: number, magicResist: number) => {
  const wisBonus = getModifier(wis) * 5;
  const totalResist = magicResist + wisBonus;
  return totalResist / (totalResist + 100);
};


// ===== COOLDOWN =====

// Cooldown Reduction (max 40%)
const cooldownReduction = (int: number, bonusCDR: number = 0) => {
  return Math.min(0.4, (getModifier(int) * 0.03) + bonusCDR);
};

// Aplicar CDR
const applyCDR = (baseCooldown: number, cdr: number) => {
  return baseCooldown * (1 - cdr);
};


// ===== CURA =====

// Efetividade de Cura Recebida
const healingReceived = (wis: number, bonusHealing: number = 0) => {
  return 1 + (getModifier(wis) * 0.05) + bonusHealing;
};


// ===== DROPS E ECONOMIA =====

// Bonus de Drop Rate
const dropRateBonus = (cha: number) => {
  return 1 + (getModifier(cha) * 0.05);
};
// CHA 10 = 0% bonus
// CHA 16 = 15% bonus


// Desconto em Loja
const shopDiscount = (cha: number) => {
  return getModifier(cha) * 0.02;
};
// CHA 16 = 6% desconto
```

---

## Distribuicao Inicial de Pontos

### No Champion Forge (Sistema Modular)

**Cada personagem comeca com:**
- Total: 72 pontos de atributo
- Distribuicao base: 12 em cada (neutro)

**Ao criar personagem:**
- Pode redistribuir ate 6 pontos de um atributo para outro
- Minimo em qualquer atributo: 6
- Maximo inicial: 18

**Progressao:**
- A cada level de conta: +1 ponto de atributo para distribuir
- Level 50 (max): +50 pontos extras
- Total possivel: 122 pontos

### Exemplo de Distribuicoes

```typescript
// Build: Tank/Bruiser
const tankBuild = {
  STR: 16,  // Dano melee
  DEX: 10,  // Velocidade base
  CON: 18,  // HP alto
  INT: 8,   // Sem magias
  WIS: 12,  // Alguma resist magica
  CHA: 8,   // Nao prioriza drops
};

// Build: Glass Cannon Mage
const mageBuild = {
  STR: 6,   // Minimo
  DEX: 12,  // Alguma velocidade
  CON: 8,   // HP baixo
  INT: 18,  // Dano maximo
  WIS: 16,  // CDR + resist
  CHA: 12,  // Bonus drops
};

// Build: Assassino
const assassinBuild = {
  STR: 12,  // Dano decente
  DEX: 18,  // Velocidade + crit
  CON: 8,   // HP baixo
  INT: 14,  // Algum CDR
  WIS: 10,  // Base
  CHA: 10,  // Base
};

// Build: Suporte
const supportBuild = {
  STR: 8,   // Nao prioriza dano
  DEX: 10,  // Base
  CON: 14,  // Sobreviver
  INT: 12,  // CDR para skills
  WIS: 18,  // Cura + resist
  CHA: 16,  // Buffs e drops
};
```

---

## Atributos vs Equipamentos

### Como Interagem

```typescript
interface CharacterStats {
  // Base (dos pontos distribuidos)
  baseAttributes: Attributes;

  // Bonus de equipamentos
  equipmentBonus: Attributes;

  // Bonus de passivas
  passiveBonus: Attributes;

  // Total calculado
  get totalAttributes(): Attributes {
    return {
      STR: this.baseAttributes.STR + this.equipmentBonus.STR + this.passiveBonus.STR,
      DEX: this.baseAttributes.DEX + this.equipmentBonus.DEX + this.passiveBonus.DEX,
      // ... etc
    };
  }
}

// Exemplo de equipamento
const warriorSword = {
  name: "Espada de Aco",
  type: "weapon",
  baseDamage: 50,
  attributeBonus: {
    STR: +3,
    DEX: 0,
    CON: +1,
    INT: 0,
    WIS: 0,
    CHA: 0,
  },
};

const mageRobe = {
  name: "Manto Arcano",
  type: "armor",
  baseArmor: 20,
  attributeBonus: {
    STR: -2,  // Penalidade
    DEX: 0,
    CON: 0,
    INT: +5,
    WIS: +3,
    CHA: +1,
  },
};
```

---

## Soft Caps e Diminishing Returns

### Limites de Atributos

| Atributo | Soft Cap | Hard Cap | Apos Soft Cap |
|----------|----------|----------|---------------|
| STR | 30 | 50 | 50% efetividade |
| DEX | 30 | 50 | 50% efetividade |
| CON | 35 | 60 | 50% efetividade |
| INT | 30 | 50 | 50% efetividade |
| WIS | 30 | 50 | 50% efetividade |
| CHA | 25 | 40 | 50% efetividade |

```typescript
// Aplicar soft cap
const applyStatCap = (
  stat: number,
  softCap: number,
  hardCap: number
): number => {
  if (stat <= softCap) {
    return stat;
  }

  const overCap = stat - softCap;
  const diminished = overCap * 0.5;
  const result = softCap + diminished;

  return Math.min(result, hardCap);
};

// Exemplo:
// STR 25 -> 25 (abaixo do soft cap)
// STR 35 -> 30 + (5 * 0.5) = 32.5
// STR 50 -> 30 + (20 * 0.5) = 40 (hard cap)
```

---

## Balanceamento na Arena

### Normalizacao de Stats

Dentro da arena, stats sao parcialmente normalizados para balancear:

```typescript
const arenaStatNormalization = {
  // Fator de normalizacao (0 = full, 1 = nenhuma)
  normalizationFactor: 0.5,

  // Stats base (onde todos convergem)
  baseLine: {
    STR: 14,
    DEX: 14,
    CON: 14,
    INT: 14,
    WIS: 14,
    CHA: 14,
  },

  // Calcular stat na arena
  getArenaStat: (actual: number, baseline: number) => {
    const diff = actual - baseline;
    return baseline + (diff * 0.5);
  },
};

// Exemplo:
// Player tem STR 20 no mundo
// Na arena: 14 + ((20-14) * 0.5) = 14 + 3 = 17 STR
// Diferenca reduzida de 6 para 3
```

Isso significa que:
- Farm no mundo ainda importa
- Mas nao e impossivel competir para novos jogadores
- Skill > stats, mas stats ainda dao vantagem

---

## Proximos Documentos

- [WEAPONS.md](./WEAPONS.md) - Como armas escalam com atributos
- [ABILITIES.md](./ABILITIES.md) - Scaling de habilidades
- [BUILDS.md](./BUILDS.md) - Exemplos de builds otimizadas
