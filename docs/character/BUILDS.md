# Builds e Combinacoes

## Visao Geral

Este documento apresenta builds otimizadas para diferentes estilos de jogo, tanto no mundo aberto quanto na arena PvP.

---

## Arquetipos de Build

### 1. Burst Assassin

**Filosofia:** Eliminar alvos rapidamente, alto risco/recompensa.

```typescript
const burstAssassin = {
  // Atributos (72 pontos base)
  attributes: {
    STR: 12,  // Dano base
    DEX: 25,  // Crit, speed
    CON: 10,  // Minimo survival
    INT: 10,  // Base
    WIS: 5,   // Minimo
    CHA: 10,  // Base
  },

  // Arma
  weapon: 'shadow_dagger',  // Alta crit chance

  // Habilidades
  abilities: {
    Q: 'shadow_step',       // Teleport atras do alvo
    W: 'backstab',          // +200% dano pelas costas
    E: 'smoke_bomb',        // Escape + invisibilidade
    R: 'death_mark',        // Execute
  },

  // Passivas
  passives: [
    'critical_master',      // +15% crit
    'dagger_mastery',       // +30% backstab
    'first_strike',         // +50% primeiro hit
  ],

  // Arena Items (prioridade)
  arenaItems: [
    'serrated_blade',       // +crit damage
    'boots_of_swiftness',   // Mobilidade
    'quicksilver_sash',     // Anti-CC
  ],

  // Playstyle
  playstyle: {
    strength: 'One-shot squishies',
    weakness: 'Vulneravel a CC, tanks',
    combo: 'E stealth -> Q behind -> W -> Auto -> R if needed',
  },
};
```

**Matchups:**
- Forte contra: Mages, Supports, Archers
- Fraco contra: Tanks, Bruisers, CC-heavy

---

### 2. Tank Frontline

**Filosofia:** Absorver dano, proteger aliados, controlar area.

```typescript
const tankFrontline = {
  attributes: {
    STR: 15,  // Algum dano
    DEX: 8,   // Minimo
    CON: 30,  // Maximo survival
    INT: 5,   // Minimo
    WIS: 9,   // Resist magica
    CHA: 5,   // Minimo
  },

  weapon: 'tower_shield_sword',  // Max block

  abilities: {
    Q: 'shield_bash',       // Stun + knockback
    W: 'taunt',             // Forca inimigos atacar
    E: 'iron_fortress',     // Damage reduction
    R: 'earthquake',        // AoE CC
  },

  passives: [
    'iron_skin',            // +10% damage reduction
    'shield_mastery',       // +25% block
    'thorns',               // Reflect damage
  ],

  arenaItems: [
    'warmogs_armor',        // +500 HP, regen
    'thornmail',            // Reflect
    'spirit_visage',        // Magic resist
  ],

  playstyle: {
    strength: 'Unkillable, zone control',
    weakness: 'Low damage, kitable',
    combo: 'W taunt -> E fortress -> Q stun -> R if grouped',
  },
};
```

---

### 3. Battlemage

**Filosofia:** Dano magico sustentado com alguma sobrevivencia.

```typescript
const battlemage = {
  attributes: {
    STR: 5,
    DEX: 12,  // Mobilidade
    CON: 15,  // Sobreviver
    INT: 28,  // Dano magico
    WIS: 10,  // Resist
    CHA: 2,
  },

  weapon: 'arcane_staff',

  abilities: {
    Q: 'fireball',          // Burst + AoE
    W: 'frost_armor',       // Shield + slow attackers
    E: 'arcane_shift',      // Mobility
    R: 'meteor',            // Big AoE
  },

  passives: [
    'magic_penetration',
    'staff_mastery',
    'mana_leech',
  ],

  arenaItems: [
    'void_staff',           // Magic pen
    'zhonyas_hourglass',    // Invulnerability
    'rabadons_deathcap',    // +AP
  ],

  playstyle: {
    strength: 'AoE damage, teamfight',
    weakness: 'Assassins, dive',
    combo: 'E position -> Q poke -> W when engaged -> R on grouped',
  },
};
```

---

### 4. Duelist (1v1 Specialist)

**Filosofia:** Vencer confrontos diretos, sustain em fight.

```typescript
const duelist = {
  attributes: {
    STR: 20,  // Dano
    DEX: 18,  // Speed, crit
    CON: 18,  // Survival
    INT: 8,
    WIS: 8,
    CHA: 0,
  },

  weapon: 'longsword',

  abilities: {
    Q: 'lunge',             // Gap closer
    W: 'parry',             // Block + counter
    E: 'vital_strike',      // High single target
    R: 'blade_dance',       // Multiple hits + lifesteal
  },

  passives: [
    'lifesteal',
    'sword_mastery',
    'berserker',
  ],

  arenaItems: [
    'blade_of_the_ruined_king',
    'deaths_dance',
    'bloodthirster',
  ],

  playstyle: {
    strength: 'Extended fights, 1v1',
    weakness: 'Getting kited, CC chains',
    combo: 'Q engage -> E -> W when they attack -> R to finish',
  },
};
```

---

### 5. Support Healer

**Filosofia:** Manter time vivo, utility, buffs.

```typescript
const supportHealer = {
  attributes: {
    STR: 5,
    DEX: 10,  // Mobilidade
    CON: 15,  // Sobreviver
    INT: 15,  // Poder de cura
    WIS: 22,  // Cura recebida/dada
    CHA: 5,
  },

  weapon: 'healing_staff',

  abilities: {
    Q: 'heal',              // Single target heal
    W: 'protective_aura',   // AoE damage reduction
    E: 'cleanse',           // Remove CC
    R: 'mass_resurrection', // Revive/heal all
  },

  passives: [
    'nature_affinity',      // +30% healing
    'overheal',             // Shield from overheal
    'team_player',          // +10% stats nearby
  ],

  arenaItems: [
    'redemption',           // AoE heal item
    'mikaels_blessing',     // Cleanse ally
    'ardent_censer',        // Buff healed allies
  ],

  playstyle: {
    strength: 'Keep team alive, clutch saves',
    weakness: 'Low damage, target of assassins',
    combo: 'W aura always up -> Q priority target -> E peel CC -> R when multiple low',
  },
};
```

---

### 6. Ranged DPS (Archer)

**Filosofia:** Dano constante a distancia, kiting.

```typescript
const rangedDPS = {
  attributes: {
    STR: 5,
    DEX: 30,  // Attack speed, crit, damage
    CON: 12,  // Algum survival
    INT: 5,
    WIS: 10,
    CHA: 10,
  },

  weapon: 'compound_bow',

  abilities: {
    Q: 'volley',            // Multiple arrows
    W: 'trap',              // Zone control
    E: 'disengage',         // Dash back + slow
    R: 'rain_of_arrows',    // AoE damage
  },

  passives: [
    'bow_mastery',
    'critical_master',
    'hit_and_run',
  ],

  arenaItems: [
    'infinity_edge',        // Crit damage
    'rapid_firecannon',     // Range + attack speed
    'galeforce',            // Extra dash
  ],

  playstyle: {
    strength: 'Sustained damage, kiting',
    weakness: 'Divers, assassins',
    combo: 'Auto -> Q -> Auto -> E if engaged -> W to zone -> R teamfight',
  },
};
```

---

### 7. Bruiser

**Filosofia:** Hibrido dano/tank, fighter de linha de frente.

```typescript
const bruiser = {
  attributes: {
    STR: 22,  // Dano
    DEX: 10,
    CON: 22,  // Tanky
    INT: 8,
    WIS: 8,
    CHA: 2,
  },

  weapon: 'battle_axe',

  abilities: {
    Q: 'leap_strike',       // Gap close + damage
    W: 'empower',           // Next attack +damage
    E: 'counter_strike',    // Dodge + stun
    R: 'grandmasters_might',// Bonus stats + AoE
  },

  passives: [
    'axe_mastery',
    'berserker',
    'lifesteal',
  ],

  arenaItems: [
    'goredrinker',          // Sustain + damage
    'steraks_gage',         // Shield when low
    'black_cleaver',        // Armor shred
  ],

  playstyle: {
    strength: 'Frontline that does damage',
    weakness: 'Kiting, true damage',
    combo: 'Q dive -> W empower -> E counter -> R all-in',
  },
};
```

---

## Builds para o Mundo (PvE)

### Speed Farm Build

```typescript
const speedFarm = {
  focus: 'Maximizar clear speed e gold/hora',

  attributes: {
    STR: 20,
    DEX: 20,
    CON: 12,
    INT: 10,
    WIS: 5,
    CHA: 5,  // Bonus gold/drops
  },

  weapon: 'any_aoe_weapon',

  abilities: {
    Q: 'whirlwind',         // AoE clear
    W: 'sprint',            // Movement
    E: 'any_aoe',
    R: 'any_aoe',
  },

  passives: [
    'treasure_hunter',      // +15% gold
    'fast_learner',         // +10% XP
    'scavenger',            // +20% drops
  ],

  tips: [
    'Foco em mobs densos',
    'Ignorar mobs solitarios',
    'Usar potions liberalmente',
  ],
};
```

### Boss Killer Build

```typescript
const bossKiller = {
  focus: 'Maximizar DPS single target, sustain',

  attributes: {
    STR: 25,
    DEX: 15,
    CON: 20,
    INT: 5,
    WIS: 7,
    CHA: 0,
  },

  weapon: 'high_damage_single_target',

  abilities: {
    Q: 'execute_skill',
    W: 'sustain_skill',
    E: 'dodge_skill',
    R: 'burst_skill',
  },

  passives: [
    'berserker',
    'executioner',
    'lifesteal',
  ],

  tips: [
    'Aprender patterns do boss',
    'Burst nas windows de vulnerabilidade',
    'Sempre ter escape pronto',
  ],
};
```

---

## Tier List de Builds (Arena Ranked)

### S Tier (Meta dominante)
- **Burst Assassin (Dagger)** - One-shot potential
- **Battlemage (Staff)** - AoE dominance

### A Tier (Muito forte)
- **Duelist (Sword)** - Consistent 1v1
- **Bruiser (Axe)** - Versatile frontline
- **Ranged DPS (Bow)** - Safe damage

### B Tier (Viavel)
- **Tank (Shield)** - Team dependent
- **Support Healer** - Needs protection
- **CC Mage** - Setup for team

### C Tier (Situacional)
- **Full Tank** - No damage
- **Glass Cannon Mage** - Too squishy
- **Hybrid builds** - Jack of all trades

---

## Build Counters

```
Counter Chart:
==============

Build              | Countered by           | Counters
-------------------|------------------------|------------------
Burst Assassin     | Tank, CC Mage          | Mages, Supports
Tank               | % HP damage, Kiting    | Assassins, Melee
Battlemage         | Assassins, Divers      | Grouped enemies
Duelist            | Kiting, CC chains      | Most 1v1
Support            | Assassins, Dive        | Sustain comps
Ranged DPS         | Assassins, Gap closers | Tanks, Bruisers
Bruiser            | Kiting, True damage    | Squishies
```

---

## Build Calculator

### Power Rating Formula

```typescript
function calculateBuildPower(build: Build): BuildRating {
  const damage = calculateDamageOutput(build);
  const survival = calculateSurvivability(build);
  const utility = calculateUtility(build);
  const mobility = calculateMobility(build);

  return {
    damage,      // 0-100
    survival,    // 0-100
    utility,     // 0-100
    mobility,    // 0-100
    overall: (damage + survival + utility + mobility) / 4,

    // Categoria
    archetype: determineArchetype(build),

    // Warnings
    warnings: getWarnings(build),
  };
}

function getWarnings(build: Build): string[] {
  const warnings = [];

  if (build.attributes.CON < 10) {
    warnings.push('Very squishy, will die fast');
  }

  if (build.survival < 30 && build.mobility < 30) {
    warnings.push('No escape options');
  }

  if (build.damage < 40 && build.utility < 40) {
    warnings.push('Low impact in fights');
  }

  return warnings;
}
```

---

## Documentos Relacionados

- [ABILITIES.md](./ABILITIES.md) - Lista de habilidades
- [WEAPONS.md](./WEAPONS.md) - Lista de armas
- [PASSIVES.md](./PASSIVES.md) - Lista de passivas
- [ATTRIBUTES.md](./ATTRIBUTES.md) - Sistema de atributos
- [../arena/ARENA-ITEMS.md](../arena/ARENA-ITEMS.md) - Items de arena
