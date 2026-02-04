# Sistema de Power Budget (Orcamento de Poder)

## Conceito

Cada habilidade tem um "orcamento de poder" fixo (100 pontos).
Isso permite balancear milhares de combinacoes de forma previsivel.

**Formula:**
```
PowerBudget = Custos - Fatores = ~100
```

Se uma habilidade e muito forte em uma area, precisa ser fraca em outra.

---

## Fatores de Poder (Consomem Budget)

### Dano

| Fator | Custo (pontos) |
|-------|----------------|
| Dano base baixo (50-100) | 10 |
| Dano base medio (100-150) | 20 |
| Dano base alto (150-200) | 30 |
| Dano base muito alto (200+) | 40 |
| Scaling bonus (+0.1 por ponto attr) | 5 |
| Scaling alto (+0.15 por ponto) | 10 |
| Multi-hit (x2) | 15 |
| Multi-hit (x3+) | 25 |

### Crowd Control

| Fator | Custo (pontos) |
|-------|----------------|
| Slow 20% | 5 |
| Slow 40% | 10 |
| Slow 60%+ | 15 |
| Root (sem mover) 1s | 15 |
| Root 2s+ | 25 |
| Stun 0.5s | 15 |
| Stun 1s | 25 |
| Stun 1.5s+ | 35 |
| Knockback pequeno | 5 |
| Knockback grande | 15 |
| Knockup | 20 |
| Fear/Charm | 25 |
| Silence 2s | 15 |
| Silence 3s+ | 25 |

### Area de Efeito

| Fator | Custo (pontos) |
|-------|----------------|
| Single target | 0 |
| Small AoE (150px) | 10 |
| Medium AoE (250px) | 20 |
| Large AoE (400px+) | 30 |
| Cone | 15 |
| Line/Pierce | 10 |
| Global | 50 |

### Utilidade

| Fator | Custo (pontos) |
|-------|----------------|
| Self heal 20% | 15 |
| Self heal 40%+ | 25 |
| Ally heal | 20 |
| Shield pequeno | 10 |
| Shield grande | 20 |
| Buff self (+20% stat) | 10 |
| Buff self (+40%+ stat) | 20 |
| Buff ally | 25 |
| Invisibilidade | 25 |
| Invulnerabilidade | 40 |
| Dash/Blink | 15-25 |

---

## Custos (Dao Budget Extra)

### Cooldown

| Cooldown | Budget Bonus |
|----------|--------------|
| 3-5s | +0 |
| 6-10s | +10 |
| 11-15s | +20 |
| 16-25s | +30 |
| 26-40s | +40 |
| 41-60s | +50 |
| 60s+ | +60 |

### Cast Time

| Cast Time | Budget Bonus |
|-----------|--------------|
| Instant | +0 |
| 0.25-0.5s | +5 |
| 0.5-1s | +10 |
| 1-2s | +20 |
| 2s+ (channel) | +30 |

### Custo de Recurso

| Custo | Budget Bonus |
|-------|--------------|
| Sem custo | +0 |
| Baixo (10-20 mana/stamina) | +5 |
| Medio (25-40) | +10 |
| Alto (50+) | +15 |
| % do HP | +20 |

### Restricoes

| Restricao | Budget Bonus |
|-----------|--------------|
| Precisa estar parado | +10 |
| Precisa estar atras do alvo | +15 |
| So funciona abaixo de X% HP (execute) | +15 |
| So funciona em aliados | +10 |
| Self-slow durante uso | +10 |
| Self-root durante uso | +15 |
| Dano em si mesmo | +20 |
| Consome stack/recurso especial | +15 |

---

## Exemplos de Balanceamento

### Exemplo 1: Fireball (Habilidade Balanceada)

```typescript
const fireball = {
  name: "Fireball",

  // Fatores (gastam budget)
  factors: {
    baseDamage: 30,      // Dano alto = 30
    scaling: 5,          // Scaling normal = 5
    aoe: 20,             // Medium AoE = 20
    burn: 5,             // DoT leve = 5
  },
  totalFactors: 60,

  // Custos (dao budget)
  costs: {
    cooldown: 20,        // 10s CD = 20
    castTime: 10,        // 0.5s cast = 10
    manaCost: 10,        // 30 mana = 10
    selfSlow: 10,        // Slow durante cast = 10
  },
  totalCosts: 50,

  // Budget: 60 - 50 = 10 (ligeiramente forte, ok)
  powerBudget: 110, // 100 base + fatores - custos
};
```

### Exemplo 2: Execute (Habilidade Condicional)

```typescript
const execute = {
  name: "Execute",

  factors: {
    baseDamage: 40,      // Dano MUITO alto = 40
    trueDamage: 10,      // Ignora defesa = 10
  },
  totalFactors: 50,

  costs: {
    cooldown: 30,        // 20s CD = 30
    restriction: 15,     // So funciona <30% HP = 15
    castTime: 5,         // 0.5s = 5
  },
  totalCosts: 50,

  // Budget: 50 - 50 = 0 (perfeito)
  powerBudget: 100,
};
```

### Exemplo 3: Ultimate - Meteor (Alto Poder, Alto Custo)

```typescript
const meteor = {
  name: "Meteor",

  factors: {
    baseDamage: 40,      // Muito alto = 40
    aoe: 30,             // Large AoE = 30
    stun: 25,            // 1s stun = 25
  },
  totalFactors: 95,

  costs: {
    cooldown: 50,        // 50s CD = 50
    castTime: 20,        // 1.5s cast = 20
    manaCost: 15,        // 80 mana = 15
    selfRoot: 15,        // Parado durante = 15
  },
  totalCosts: 100,

  // Budget: 95 - 100 = -5 (ligeiramente fraco para ult, buffer)
  powerBudget: 95,
};
```

---

## Calculadora de Power Budget

```typescript
interface AbilityDraft {
  // Identificacao
  name: string;
  category: 'damage' | 'cc' | 'mobility' | 'defensive' | 'support' | 'ultimate';

  // Fatores
  factors: {
    baseDamage?: 10 | 20 | 30 | 40;
    scaling?: 5 | 10;
    multiHit?: 15 | 25;
    slow?: 5 | 10 | 15;
    root?: 15 | 25;
    stun?: 15 | 25 | 35;
    knockback?: 5 | 15;
    knockup?: 20;
    fear?: 25;
    silence?: 15 | 25;
    aoe?: 10 | 20 | 30;
    cone?: 15;
    line?: 10;
    selfHeal?: 15 | 25;
    allyHeal?: 20;
    shield?: 10 | 20;
    buffSelf?: 10 | 20;
    buffAlly?: 25;
    invisibility?: 25;
    invulnerability?: 40;
    dash?: 15 | 20 | 25;
  };

  // Custos
  costs: {
    cooldown: 0 | 10 | 20 | 30 | 40 | 50 | 60;
    castTime?: 5 | 10 | 20 | 30;
    resourceCost?: 5 | 10 | 15 | 20;
    mustBeStationary?: 10;
    mustBeBehind?: 15;
    executeCondition?: 15;
    allyOnly?: 10;
    selfSlow?: 10;
    selfRoot?: 15;
    selfDamage?: 20;
    consumeStack?: 15;
  };
}

function calculatePowerBudget(ability: AbilityDraft): number {
  const factorTotal = Object.values(ability.factors)
    .filter(v => v !== undefined)
    .reduce((sum, val) => sum + val, 0);

  const costTotal = Object.values(ability.costs)
    .filter(v => v !== undefined)
    .reduce((sum, val) => sum + val, 0);

  return 100 + costTotal - factorTotal;
}

// Target: 95-105 para habilidades normais
// Target: 85-95 para ultimates (podem ser um pouco mais fortes)
```

---

## Categorias e Budgets Alvo

| Categoria | Power Budget Alvo | Razao |
|-----------|-------------------|-------|
| Basic (Q) | 100-105 | Uso frequente |
| Utility (W) | 100-110 | Versatilidade |
| Special (E) | 95-105 | Impacto medio |
| Ultimate (R) | 85-95 | Alto impacto |

### Por Tipo de Habilidade

| Tipo | Budget | Caracteristica |
|------|--------|----------------|
| Poke/Harass | 105-110 | Dano baixo, CD baixo |
| Burst | 95-100 | Dano alto, restricoes |
| CC Heavy | 100-105 | CC forte, menos dano |
| Sustain | 100-110 | Cura/shield, cd medio |
| Mobility | 105-110 | Dash, menos dano |
| Utility | 100-105 | Efeitos unicos |

---

## Processo de Balanceamento

### Passo 1: Design Inicial
1. Definir fantasia da habilidade
2. Escolher fatores principais
3. Calcular budget inicial

### Passo 2: Ajustar para 100
1. Se budget > 110: reduzir fatores OU aumentar custos
2. Se budget < 90: aumentar fatores OU reduzir custos

### Passo 3: Validar Sinergia
1. Verificar contra outras habilidades da categoria
2. Verificar contra builds populares
3. Simular em cenarios de combate

### Passo 4: Playtest
1. Testar em ambiente real
2. Coletar feedback
3. Ajustar valores (nao formula)

---

## Planilha de Balanceamento

Para gerenciar 80+ habilidades, usar spreadsheet:

| ID | Nome | Cat | Dano | CC | AoE | Util | CD | Cast | Cost | Restr | Budget | Status |
|----|------|-----|------|----|----|------|----|----|------|-------|--------|--------|
| A01 | Fireball | dmg | 30 | 0 | 20 | 5 | 20 | 10 | 10 | 0 | 105 | OK |
| A02 | Ice Bolt | cc | 20 | 15 | 0 | 0 | 10 | 0 | 5 | 0 | 100 | OK |
| A03 | Dash | mob | 0 | 0 | 0 | 20 | 10 | 0 | 5 | 0 | 95 | OK |

---

## Proximos Documentos

- [FORMULAS.md](./FORMULAS.md) - Formulas detalhadas de dano
- [SPREADSHEETS.md](./SPREADSHEETS.md) - Templates de planilhas
- [character/ABILITIES.md](../character/ABILITIES.md) - Lista completa de habilidades
