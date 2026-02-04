# Templates de Planilhas

## Visao Geral

Templates para gerenciar o balanceamento de 100+ habilidades, armas e items.

---

## 1. Planilha de Habilidades

### Formato CSV

```csv
id,name,category,slot,base_damage,str_scaling,dex_scaling,int_scaling,cooldown,mana_cost,range,aoe_size,cc_type,cc_duration,budget_factors,budget_costs,power_budget,status
A001,Fireball,damage,Q,100,0,0,0.8,8,40,600,150,none,0,55,50,105,balanced
A002,Dash,mobility,Q,0,0,0,0,6,20,400,0,none,0,20,20,100,balanced
A003,Stun Strike,cc,W,50,0.5,0,0,12,35,150,0,stun,1.5,60,55,105,balanced
```

### Colunas

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | string | ID unico |
| name | string | Nome display |
| category | enum | damage/mobility/cc/defensive/support/ultimate |
| slot | enum | Q/W/E/R |
| base_damage | int | Dano base |
| str/dex/int_scaling | float | Multiplicador de scaling |
| cooldown | float | Segundos |
| mana_cost | int | Custo de mana |
| range | int | Pixels |
| aoe_size | int | Pixels (0 = single target) |
| cc_type | enum | none/slow/root/stun/knockback/etc |
| cc_duration | float | Segundos |
| budget_factors | int | Total de fatores (gasta budget) |
| budget_costs | int | Total de custos (da budget) |
| power_budget | int | 100 + costs - factors |
| status | enum | balanced/needs_nerf/needs_buff/wip |

---

## 2. Planilha de Armas

### Formato CSV

```csv
id,name,type,tier,base_damage,attack_speed,range,str_req,dex_req,special,status
W001,Iron Sword,sword,1,25,1.0,120,10,0,none,balanced
W002,Steel Axe,axe,2,45,0.8,100,15,0,cleave,balanced
W003,Crystal Staff,staff,3,20,0.6,500,0,0,magic_scaling,balanced
```

### Colunas

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | string | ID unico |
| name | string | Nome |
| type | enum | sword/axe/hammer/spear/bow/staff/dagger |
| tier | int | 1-5 |
| base_damage | int | Dano base |
| attack_speed | float | Ataques/segundo |
| range | int | Pixels |
| str_req | int | Requisito STR |
| dex_req | int | Requisito DEX |
| special | string | Efeito especial |
| status | enum | balanced/wip |

---

## 3. Planilha de Items de Arena

### Formato CSV

```csv
id,name,category,cost,stats,passive,active,active_cd,counter,status
I001,Steel Plate,defensive,800,armor:30,none,none,0,physical,balanced
I002,Void Staff,offensive,1000,magic_pen:20,none,none,0,magic_resist,balanced
I003,Quicksilver,utility,1300,none,none,cleanse_cc,90,cc,balanced
```

### Colunas

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | string | ID unico |
| name | string | Nome |
| category | enum | offensive/defensive/utility/consumable |
| cost | int | Gold |
| stats | string | stat:valor separado por ; |
| passive | string | Efeito passivo |
| active | string | Efeito ativo |
| active_cd | int | Cooldown do ativo |
| counter | string | O que countera |
| status | enum | balanced/wip |

---

## 4. Planilha de Mobs

### Formato CSV

```csv
id,name,zone,level,hp,damage,armor,magic_resist,attack_type,special,xp,gold_min,gold_max,drops
M001,Slime,forest,1,50,10,5,5,melee,none,10,1,5,slime_goo:0.5;health_potion:0.1
M002,Wolf,forest,3,120,20,10,5,melee,pack_bonus,25,3,8,wolf_pelt:0.3;wolf_fang:0.15
```

---

## 5. Planilha de Balanceamento (Analytics)

### Formato CSV

```csv
id,type,win_rate,pick_rate,ban_rate,avg_kda,avg_damage,last_change,notes
A001,ability,52.3,15.2,8.5,3.2,15000,2026-01-15,-5% damage,watching
W002,weapon,48.1,8.4,2.1,2.8,12000,2026-01-20,+3 base damage,balanced
```

### Colunas

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | string | ID do item |
| type | enum | ability/weapon/item/passive |
| win_rate | float | % |
| pick_rate | float | % |
| ban_rate | float | % |
| avg_kda | float | Media |
| avg_damage | int | Media por partida |
| last_change | date | Ultima alteracao |
| notes | string | Observacoes |

---

## 6. Planilha de Progressao

### Formato CSV

```csv
level,xp_required,xp_total,unlock,hp_per_level,mana_per_level,attribute_points
1,0,0,tutorial,10,5,0
2,100,100,dash,10,5,2
3,115,215,normal_3v3,10,5,2
```

---

## 7. Template Google Sheets

### Estrutura Recomendada

```
Champion Forge Balance Sheet
============================

TAB 1: Abilities
- Todas as 100+ habilidades
- Formulas para calcular power budget automaticamente

TAB 2: Weapons
- Todas as armas
- DPS calculado automaticamente

TAB 3: Arena Items
- Items de counter-play
- Gold efficiency calculada

TAB 4: Mobs
- Todos os mobs por zona
- XP/hour estimado

TAB 5: Analytics
- Win rates, pick rates
- Graficos de tendencia

TAB 6: Changelog
- Historico de mudancas
- Data e razao

TAB 7: Formulas
- Referencia das formulas usadas
- Constantes do jogo
```

### Formulas Uteis (Google Sheets)

```
// Power Budget
=100 + [Budget Costs] - [Budget Factors]

// DPS
=[Base Damage] * [Attack Speed] * (1 + [Crit Chance] * ([Crit Damage] - 1))

// XP per hour
=[XP per kill] * [Kills per hour estimate]

// Gold Efficiency
=[Total Stats Value] / [Item Cost] * 100

// Win Rate Color
=IF(B2>54, "RED", IF(B2<46, "GREEN", "WHITE"))
```

---

## 8. Scripts de Importacao

### JSON to CSV

```typescript
// Converter abilities.json para CSV
function abilitiesToCsv(abilities: Ability[]): string {
  const headers = ['id', 'name', 'category', ...];
  const rows = abilities.map(a => [
    a.id,
    a.name,
    a.category,
    // ...
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}
```

### CSV to Game Data

```typescript
// Importar CSV para o jogo
function importAbilities(csv: string): Ability[] {
  const lines = csv.split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    const values = line.split(',');
    const ability: any = {};

    headers.forEach((h, i) => {
      ability[h] = parseValue(values[i]);
    });

    return ability as Ability;
  });
}
```

---

## 9. Automacao

### Script de Validacao

```typescript
// Validar todas as habilidades
function validateAbilities(abilities: Ability[]): ValidationResult[] {
  return abilities.map(ability => {
    const errors: string[] = [];

    // Power budget check
    const budget = 100 + ability.budgetCosts - ability.budgetFactors;
    if (budget < 85 || budget > 115) {
      errors.push(`Power budget out of range: ${budget}`);
    }

    // Cooldown check
    if (ability.cooldown < 1) {
      errors.push('Cooldown too low');
    }

    // Range check
    if (ability.range > 1000) {
      errors.push('Range too high');
    }

    return { id: ability.id, valid: errors.length === 0, errors };
  });
}
```

### Script de Export

```typescript
// Exportar para formato do jogo
function exportToGameFormat(data: BalanceData): void {
  const output = {
    abilities: data.abilities.map(formatAbility),
    weapons: data.weapons.map(formatWeapon),
    items: data.items.map(formatItem),
    version: data.version,
    timestamp: Date.now(),
  };

  fs.writeFileSync('balance-data.json', JSON.stringify(output, null, 2));
}
```

---

## 10. Links Uteis

### Templates Online

- Google Sheets: [Template Link]
- Airtable: [Template Link]
- Notion: [Template Link]

### Ferramentas

- **CSV Editor**: Modern CSV, TablePlus
- **JSON Editor**: JSON Editor Online
- **Diff Tools**: git diff, Meld

---

## Documentos Relacionados

- [POWER-BUDGET.md](./POWER-BUDGET.md) - Sistema de budget
- [FORMULAS.md](./FORMULAS.md) - Formulas de calculo
- [../character/ABILITIES.md](../character/ABILITIES.md) - Lista de habilidades
- [../character/WEAPONS.md](../character/WEAPONS.md) - Lista de armas
