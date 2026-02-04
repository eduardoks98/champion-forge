# Sistema de Itens de Arena (Counter-Play)

## Conceito

Durante partidas de arena, jogadores ganham gold e podem comprar itens **TEMPORARIOS** para counterar builds inimigas. Estes itens RESETAM ao final de cada partida.

---

## Gold na Arena

### Fontes de Gold

| Fonte | Gold |
|-------|------|
| Kill | 300 |
| Assist | 150 |
| Passivo (por segundo) | 5 |
| Primeiro sangue (bonus) | +100 |
| Objetivo (se houver) | 100 |

### Gold Medio por Partida

```
Partida de 12 min = 720s
- Passivo: 720 * 5 = 3600 gold
- Kills (5): 5 * 300 = 1500 gold
- Assists (3): 3 * 150 = 450 gold
- Total: ~5500 gold medio
```

---

## Categorias de Itens

| Categoria | Funcao | Counter |
|-----------|--------|---------|
| Ofensivo | Aumenta dano | Builds tanky |
| Defensivo | Aumenta sobrevivencia | Builds burst |
| Utilidade | Efeitos especiais | Situacional |
| Consumiveis | Efeitos temporarios | Imediato |

---

## ITENS OFENSIVOS (15)

### Dano Fisico

| ID | Nome | Custo | Efeito | Contra |
|----|------|-------|--------|--------|
| OFF01 | **Long Blade** | 400 | +15% physical damage | - |
| OFF02 | **Serrated Edge** | 600 | +10% damage, +5% bleed | Sustain |
| OFF03 | **Armor Piercer** | 800 | Ignora 20% armor | Tanks |
| OFF04 | **Executioner** | 1000 | +30% damage vs <40% HP | Tanks |
| OFF05 | **Berserker's Axe** | 1200 | +25% damage, -10% def | Glass cannon |

### Dano Magico

| ID | Nome | Custo | Efeito | Contra |
|----|------|-------|--------|--------|
| OFF06 | **Arcane Amplifier** | 500 | +15% ability damage | - |
| OFF07 | **Spell Penetration** | 800 | Ignora 20% magic resist | Magic resist |
| OFF08 | **Mana Crystal** | 600 | +100 mana, +10% ability | - |
| OFF09 | **Void Staff** | 1000 | +25% magic pen | Heavy MR |
| OFF10 | **Deathcap** | 1500 | +40% ability power | - |

### Critical/Attack Speed

| ID | Nome | Custo | Efeito | Contra |
|----|------|-------|--------|--------|
| OFF11 | **Critical Edge** | 700 | +15% crit chance | - |
| OFF12 | **Infinity Edge** | 1200 | +25% crit chance, +20% crit dmg | - |
| OFF13 | **Attack Speed Gloves** | 500 | +20% attack speed | - |
| OFF14 | **Phantom Blade** | 900 | +15% AS, +10% crit | - |
| OFF15 | **Bloodthirster** | 1300 | +20% damage, +15% lifesteal | - |

---

## ITENS DEFENSIVOS (15)

### Armor (Counter Physical)

| ID | Nome | Custo | Efeito | Contra |
|----|------|-------|--------|--------|
| DEF01 | **Steel Plate** | 500 | +30 armor | Phys damage |
| DEF02 | **Chain Mail** | 700 | +50 armor | Phys damage |
| DEF03 | **Thornmail** | 1000 | +40 armor, reflete 15% phys | ADC/Melee |
| DEF04 | **Frozen Heart** | 1200 | +60 armor, -15% AS inimigos proximo | Attack speed |
| DEF05 | **Randuin's Omen** | 1100 | +50 armor, -20% crit damage recebido | Crit builds |

### Magic Resist (Counter Magic)

| ID | Nome | Custo | Efeito | Contra |
|----|------|-------|--------|--------|
| DEF06 | **Spirit Visage** | 600 | +30 MR, +20% healing recebido | Mages |
| DEF07 | **Null-Magic Mantle** | 400 | +25 MR | Mages |
| DEF08 | **Adaptive Helm** | 900 | +50 MR, -20% repeated magic dmg | DoT mages |
| DEF09 | **Banshee's Veil** | 1100 | +40 MR, bloqueia proximo spell (30s CD) | Burst mages |
| DEF10 | **Force of Nature** | 1300 | +70 MR, +5% move speed | Heavy magic |

### HP/Sustain

| ID | Nome | Custo | Efeito | Contra |
|----|------|-------|--------|--------|
| DEF11 | **Giant's Belt** | 500 | +200 HP | - |
| DEF12 | **Warmog's Armor** | 1200 | +400 HP, regen 3% HP/s fora de combate | Poke |
| DEF13 | **Sterak's Gage** | 1000 | +300 HP, shield 20% HP quando <30% | Burst |
| DEF14 | **Guardian Angel** | 1500 | +200 HP, revive com 30% HP (180s CD) | Assassins |
| DEF15 | **Dead Man's Plate** | 900 | +250 HP, +30 armor, momentum speed | - |

---

## ITENS DE UTILIDADE (15)

### Anti-CC

| ID | Nome | Custo | Efeito | Contra |
|----|------|-------|--------|--------|
| UTL01 | **Quicksilver Sash** | 1000 | Ativo: remove CC (90s CD) | CC heavy |
| UTL02 | **Mercury's Treads** | 700 | -30% duracao de CC | CC heavy |
| UTL03 | **Unflinching** | 800 | Tenacity aumenta quando baixo HP | Engage CC |

### Anti-Heal

| ID | Nome | Custo | Efeito | Contra |
|----|------|-------|--------|--------|
| UTL04 | **Grievous Wounds** | 600 | Hits reduzem cura inimigo em 40% | Healers, lifesteal |
| UTL05 | **Mortal Reminder** | 1100 | +20% armor pen, grievous wounds | Tank + heal |
| UTL06 | **Ignite Charm** | 800 | Ativo: aplica grievous 60% por 3s | Heavy sustain |

### Deteccao

| ID | Nome | Custo | Efeito | Contra |
|----|------|-------|--------|--------|
| UTL07 | **Oracle Lens** | 500 | Ativo: revela invisiveis 5s (60s CD) | Stealth |
| UTL08 | **True Sight** | 900 | Passivo: ve invisiveis em 300px | Stealth builds |

### Mobilidade

| ID | Nome | Custo | Efeito | Contra |
|----|------|-------|--------|--------|
| UTL09 | **Boots of Swiftness** | 400 | +15% move speed | - |
| UTL10 | **Flash Stone** | 1000 | Ativo: blink 300px (90s CD) | Engage/escape |
| UTL11 | **Phantom Dancer** | 1200 | +7% MS, ignora colisao com unidades | Kiting |
| UTL12 | **Dash Boots** | 800 | Ativo: dash curto (30s CD) | Engage |

### Outros

| ID | Nome | Custo | Efeito | Contra |
|----|------|-------|--------|--------|
| UTL13 | **Zhonya's Hourglass** | 1300 | Ativo: invulneravel 2.5s (120s CD) | Burst |
| UTL14 | **Hextech Gunblade** | 1100 | +15% omnivamp (heals from all damage) | - |
| UTL15 | **Edge of Night** | 900 | Ativo: spell shield 5s (40s CD) | Pick comps |

---

## CONSUMIVEIS (10)

| ID | Nome | Custo | Efeito | Duracao |
|----|------|-------|--------|---------|
| CON01 | **Health Potion** | 50 | Cura 150 HP | 10s |
| CON02 | **Mana Potion** | 50 | Restaura 100 mana | instant |
| CON03 | **Refillable Potion** | 150 | 2 charges, 100 HP cada, recarrega | - |
| CON04 | **Elixir of Wrath** | 400 | +20% damage por 2 min | 2 min |
| CON05 | **Elixir of Iron** | 400 | +25% max HP por 2 min | 2 min |
| CON06 | **Elixir of Sorcery** | 400 | +30% ability power por 2 min | 2 min |
| CON07 | **Oracle's Elixir** | 300 | True sight por 3 min | 3 min |
| CON08 | **Speed Elixir** | 250 | +30% MS por 1 min | 1 min |
| CON09 | **Control Ward** | 75 | Coloca ward que revela area | - |
| CON10 | **Stopwatch** | 600 | Uso unico: Zhonya 2.5s | 1 use |

---

## Slots de Itens

```
┌─────────────────────────────────────┐
│  INVENTARIO DE ARENA (6 slots)      │
│                                     │
│  [Item 1] [Item 2] [Item 3]         │
│  [Item 4] [Item 5] [Consumivel]     │
│                                     │
│  Gold: 1250                         │
└─────────────────────────────────────┘
```

- **5 slots** para itens permanentes da partida
- **1 slot** reservado para consumiveis

---

## Fluxo de Counter-Play

### Analise do Time Inimigo

```
Passo 1: Identificar threats
- Inimigo 1: Mage burst → Preciso MR
- Inimigo 2: Tank CC → Preciso Tenacity
- Inimigo 3: ADC crit → Preciso Armor + anti-crit

Passo 2: Priorizar compras
- Early: Boots + basic defense
- Mid: Core counter items
- Late: Complete build
```

### Exemplo de Build Paths

**Contra Time de Magos:**
1. Boots of Swiftness (400)
2. Null-Magic Mantle (400)
3. Banshee's Veil (1100)
4. Adaptive Helm (900)
5. Force of Nature (1300)
6. Health Potions

**Contra Time Fisico:**
1. Boots (400)
2. Steel Plate (500)
3. Thornmail (1000)
4. Randuin's (1100)
5. Frozen Heart (1200)
6. Health Potions

**Contra Sustain Heavy:**
1. Boots (400)
2. Grievous Wounds (600)
3. Mortal Reminder (1100)
4. Ignite Charm (800)
5. Damage item (1000)
6. Mana Potions

---

## Interface da Shop

```typescript
interface ArenaShop {
  // Categorias
  categories: ['offensive', 'defensive', 'utility', 'consumables'];

  // Busca
  searchByName: (name: string) => Item[];
  searchByEffect: (keyword: string) => Item[];

  // Recomendacoes
  recommended: {
    vsPhysical: Item[];
    vsMagical: Item[];
    vsCC: Item[];
    vsHealing: Item[];
    vsStealth: Item[];
  };

  // Acoes
  buy: (itemId: string) => void;
  sell: (itemId: string) => void; // 70% do valor
  undo: () => void; // Dentro de 10s

  // Atalhos
  quickBuy: (slot: number) => void; // Favoritos pre-setados
}
```

### Quick Buy

Jogadores podem pre-configurar builds:

```typescript
interface QuickBuySlot {
  slotNumber: 1 | 2 | 3 | 4;
  name: string;
  items: ItemId[];
}

// Exemplo
const antiMageBuild: QuickBuySlot = {
  slotNumber: 1,
  name: "Anti-Mage",
  items: ['UTL09', 'DEF07', 'DEF09', 'DEF08', 'DEF10'],
};
```

---

## Balanceamento

### Gold Efficiency

Cada item tem "gold efficiency" comparando stats vs custo:

```typescript
// Valores base por stat
const statValues = {
  damage: 25,       // 1% damage = 25 gold
  armor: 15,        // 1 armor = 15 gold
  magicResist: 15,
  HP: 2,            // 1 HP = 2 gold
  attackSpeed: 25,  // 1% AS = 25 gold
  critChance: 30,   // 1% crit = 30 gold
  moveSpeed: 30,    // 1% MS = 30 gold
};

// Calcular efficiency
const calculateEfficiency = (item: Item): number => {
  let totalValue = 0;

  if (item.damage) totalValue += item.damage * statValues.damage;
  if (item.armor) totalValue += item.armor * statValues.armor;
  // ... etc

  return (totalValue / item.cost) * 100; // % efficiency
};

// Target: 100% = fair, >100% = strong, <100% = weak/utility
```

### Item Caps

Para evitar stacking excessivo:

| Stat | Cap | Motivo |
|------|-----|--------|
| Armor Pen | 40% | Tanks precisam funcionar |
| Magic Pen | 40% | Tanks precisam funcionar |
| Crit Chance | 75% | Alguma variancia |
| Lifesteal | 30% | Evitar immortalidade |
| CDR | 40% | Spam infinito |
| Move Speed | +50% | Ainda pode ser catched |

---

## Comparacao com LoL

| Aspecto | LoL | Champion Forge |
|---------|-----|----------------|
| Itens | 200+ | 50+ (simplificado) |
| Componentes | Multiplos tiers | Apenas final |
| Recipes | Sim | Nao (compra direto) |
| Gold | Lane + jungle | Kills + passive |
| Slots | 6 | 6 (1 consumivel) |

Decisao: **Simplificar** para partidas mais curtas e decisoes mais claras.

---

## Proximos Documentos

- [RANKING.md](./RANKING.md) - Sistema de ranking
- [MATCHMAKING.md](./MATCHMAKING.md) - Algoritmo de matchmaking
- [BALANCE.md](./BALANCE.md) - Balanceamento geral de arena
