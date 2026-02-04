# Game Design Document - Champion Forge

## 1. Visao Geral

### 1.1 Conceito
**Champion Forge** e um jogo hibrido de Mundo Aberto 2D + Arena PvP MOBA onde jogadores CRIAM seus proprios champions atraves de um sistema totalmente modular.

### 1.2 Pitch
> "Crie seu proprio champion e lute na arena"

### 1.3 Genero
- Mundo Aberto: Action RPG 2D (PvE co-op)
- Arena: Team Deathmatch MOBA-style (PvP)

### 1.4 Plataforma
- Browser (principal)
- Desktop (Electron wrapper futuro)

### 1.5 Target
- Jogadores de MOBAs que querem mais customizacao
- Jogadores de ARPGs que querem PvP competitivo
- Fans de jogos .io com mais profundidade

---

## 2. Diferenciais Unicos

| MOBA Tradicional | Champion Forge |
|------------------|----------------|
| Champions pre-prontos | Voce CRIA seu champion |
| Escolhe e joga | Farma -> Equipa -> Joga |
| Todos tem acesso igual | Esforco define poder |
| Progressao so na partida | Progressao mundo + arena |
| 1 personagem por conta | Multiplos personagens |

---

## 3. Fluxo do Jogo

```
┌─────────────────────────────────────────────────────────────┐
│               CIDADE HUB (Compartilhada)                    │
│  - Ver outros jogadores                                     │
│  - NPCs, Banco, Crafting                                    │
│  - Formar Party (1-4 jogadores)                             │
│  - Portal para Arena PvP                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                    [Criar Instancia]
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│            MUNDO INSTANCIADO (Por Party)                    │
│   - Solo ou co-op (1-4 players)                             │
│   - Farm mobs, boss, missoes                                │
│   - Loot: equipamentos, habilidades, recursos               │
│   - Progresso salvo por personagem                          │
└─────────────────────────────────────────────────────────────┘
                              │
                    [Quando pronto]
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    ARENA PvP                                │
│   - 3v3 ou 5v5 Team Deathmatch                              │
│   - 10-15 minutos por partida                               │
│   - Level 1-18 (reseta cada partida)                        │
│   - Shop de counter-play                                    │
│   - Ranking competitivo                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Mundo Aberto (PvE)

### 4.1 Arquitetura Instanciada

**Beneficios:**
- Sem competicao por mobs
- Scaling por numero de jogadores
- Menos custo de servidor
- Party privada

### 4.2 Zonas

| Zona | Level | Conteudo |
|------|-------|----------|
| Floresta Inicial | 1-10 | Tutorial, mobs faceis |
| Cavernas | 10-20 | Minerios, mobs medios |
| Deserto | 20-30 | Loot raro, mobs dificeis |
| Ruinas Antigas | 30-40 | Dungeons, bosses |
| Vulcao | 40-50 | Raids, loot epico |
| Abismo | 50+ | Endgame, desafios |

### 4.3 Atividades

| Atividade | Recompensa |
|-----------|------------|
| Matar mobs | XP, drops de equip |
| Missoes | Habilidades, equip unico |
| Bosses | Loot raro, skills especiais |
| Crafting | Criar/melhorar equip |
| Dungeons | Sets, habilidades raras |
| Mini-games | Recursos, cosmeticos |

### 4.4 Progressao de Conta

```typescript
const accountProgression = {
  // Level de conta desbloqueia:
  levels: {
    1: 'Tutorial completo',
    5: 'Acesso a Arena PvP',
    10: 'Segunda slot de personagem',
    20: 'Terceira slot de personagem',
    30: 'Dungeons avancadas',
    50: 'Raids',
  },

  // XP vem de:
  xpSources: {
    mobKill: 10,
    questComplete: 100,
    bossKill: 500,
    dungeonComplete: 1000,
    arenaWin: 200,
    arenaLoss: 50,
  },
};
```

---

## 5. Sistema de Personagem

### 5.1 Estrutura Modular

```typescript
interface Character {
  name: string;
  accountId: string;

  // Atributos (distribuidos pelo jogador)
  attributes: {
    STR: number;  // Dano melee
    DEX: number;  // Velocidade, crit
    CON: number;  // HP, regen
    INT: number;  // Dano magico, CDR
    WIS: number;  // Resist magica, cura
    CHA: number;  // Drops, precos
  };

  // Equipamentos
  equipment: {
    weapon: Weapon;
    armor: Armor;
    accessory1: Accessory;
    accessory2: Accessory;
  };

  // Habilidades (escolhe 4 de todas desbloqueadas)
  abilities: {
    Q: Ability;
    W: Ability;
    E: Ability;
    R: Ability; // Ultimate
  };

  // Passivas (drops raros, max 3)
  passives: Passive[];
}
```

### 5.2 Atributos

Ver [character/ATTRIBUTES.md](./character/ATTRIBUTES.md) para detalhes completos.

**Resumo:**
- 6 atributos baseados em D&D
- 72 pontos iniciais para distribuir
- +1 ponto por level de conta
- Soft caps para evitar extremos

### 5.3 Habilidades

**Total: 80-100 habilidades**

| Categoria | Qtd | Exemplos |
|-----------|-----|----------|
| Mobilidade | 15 | Dash, Blink, Sprint |
| Dano Fisico | 20 | Power Strike, Whirlwind |
| Dano Magico | 15 | Fireball, Ice Bolt |
| Crowd Control | 15 | Stun, Root, Slow |
| Defensivo | 15 | Shield, Heal, Invuln |
| Suporte | 10 | Buff, Cleanse |
| Ultimates | 15 | Meteor, Resurrection |

Ver [character/ABILITIES.md](./character/ABILITIES.md) para lista completa.

### 5.4 Armas

**Total: 30+ armas**

| Tipo | Qtd | Estilo |
|------|-----|--------|
| Espadas | 8 | Melee balanceado |
| Machados | 4 | Alto dano, lento |
| Martelos | 4 | Stun, muito lento |
| Lancas | 4 | Range medio |
| Arcos | 4 | Ranged fisico |
| Cajados | 4 | Ranged magico |
| Adagas | 4 | Rapido, backstab |

Ver [character/WEAPONS.md](./character/WEAPONS.md) para lista completa.

---

## 6. Arena PvP

### 6.1 Formato

| Aspecto | Valor |
|---------|-------|
| Modo | Team Deathmatch |
| Times | 3v3 ou 5v5 |
| Duracao | 10-15 minutos |
| Objetivo | Primeiro a X kills |
| Mapa | Arena fechada |

### 6.2 Fluxo da Partida

```
[Matchmaking] -> [Selecao] -> [Combate] -> [Resultado]
    ~30s           30s        10-15min       30s
```

### 6.3 Sistema de Level na Arena

**Como funciona:**
- Entra level 1, sobe ate level 18
- XP vem de kills, assists, tempo
- Level aumenta poder das habilidades
- Level desbloqueia skills gradualmente

```typescript
const arenaLevelSystem = {
  maxLevel: 18,

  // XP sources
  xp: {
    kill: 300,
    assist: 150,
    passivePerSecond: 5,
  },

  // Unlocks
  levelUnlocks: {
    1: 'Q disponivel',
    2: 'W disponivel',
    3: 'E disponivel',
    6: 'R (Ultimate) disponivel',
    11: 'R rank 2',
    16: 'R rank 3',
  },

  // Per level bonus
  perLevel: {
    abilityPower: '+5%',
    baseStats: '+3%',
  },
};
```

### 6.4 Shop de Counter-Play

**Conceito:** Comprar itens DURANTE a partida para counterar builds inimigas.

| Categoria | Exemplos | Counter |
|-----------|----------|---------|
| Penetracao | Armor Piercer | Tanks |
| Armor | Steel Plate | Dano fisico |
| Magic Resist | Spirit Visage | Magos |
| Anti-Heal | Grievous Wounds | Sustain |
| Anti-CC | Quicksilver Sash | CC heavy |
| Mobilidade | Flash Stone | Kiting |

Ver [arena/ARENA-ITEMS.md](./arena/ARENA-ITEMS.md) para lista completa.

### 6.5 Ranking

| Tier | LP Range |
|------|----------|
| Bronze | 0-400 |
| Silver | 400-800 |
| Gold | 800-1200 |
| Platinum | 1200-1600 |
| Diamond | 1600-2000 |
| Master | 2000+ |

---

## 7. Elementos Inovadores

### 7.1 Economia/Trading

```typescript
const economy = {
  marketplace: {
    listItem: true,
    buyFromPlayers: true,
    auction: true,
    priceHistory: true,
  },

  currencies: {
    gold: 'comum (mobs)',
    gems: 'raro (bosses)',
    tokens: 'arena wins',
  },
};
```

### 7.2 Eventos Dinamicos

| Evento | Frequencia | Recompensa |
|--------|------------|------------|
| Boss Mundial | 2-4 horas | Loot epico |
| Invasoes | Aleatorio | Bonus XP |
| Seasonal | 1-2 semanas | Cosmeticos |
| Rifts/Portais | Aleatorio | Dungeon temp |

### 7.3 Mini-games

| Mini-game | Mecanica | Recompensa |
|-----------|----------|------------|
| Pesca | Timing | Culinaria, raros |
| Mineracao | Pattern | Crafting |
| Puzzle Dungeons | Resolver | Skills, cosmetic |
| Racing | Obstaculos | Tokens, titulos |

---

## 8. Estilo Visual

### 8.1 Geometrico/Minimalista

**Por que:**
- Nao precisa artista
- Programador consegue criar
- Rapido de iterar
- Roda bem em browser

**Referencias:**
- Diep.io
- Agar.io
- Surviv.io
- Moomoo.io

### 8.2 Representacao

```
PERSONAGENS: Circulos/poligonos coloridos
ARMAS: Formas geometricas (retangulo = espada)
HABILIDADES: Particulas, cores vibrantes
MOBS: Formas por tipo (quadrado = tank)
UI: Flat design, cores solidas
```

### 8.3 Animacoes Programaticas

```typescript
const animations = {
  meleeAttack: { type: 'rotation', duration: 200 },
  projectile: { type: 'translation', trail: true },
  aoe: { type: 'scale', particles: true },
  dash: { type: 'ghost_trail', copies: 5 },
  hit: { flash: 'red', shake: 5 },
  death: { shrink: true, particles: 20 },
};
```

---

## 9. Arquitetura Tecnica

### 9.1 Stack

| Componente | Tecnologia |
|------------|------------|
| Server | Node.js + Socket.IO |
| Client | React + Canvas |
| Database | MySQL + Redis |
| SDK | @eduardoks98/create-game |

### 9.2 Networking

**Mundo (PvE):**
- Hibrido client/server
- Mobs client-side (seed)
- Loot server-side

**Arena (PvP):**
- 100% server authoritative
- 60 tick rate
- Client prediction
- Lag compensation

### 9.3 Bandwidth

| Modo | Jogadores | Bandwidth |
|------|-----------|-----------|
| Mundo solo | 1 | ~1-2 KB/s |
| Mundo party | 4 | ~5 KB/s |
| Arena 3v3 | 6 | ~10 KB/s |
| Arena 5v5 | 10 | ~15-20 KB/s |

---

## 10. Balanceamento

### 10.1 Power Budget

Cada habilidade tem budget de 100 pontos.
Fatores consomem budget, custos dao budget.

Ver [balance/POWER-BUDGET.md](./balance/POWER-BUDGET.md)

### 10.2 Normalizacao na Arena

Stats sao parcialmente normalizados para competitividade:
- Factor: 0.5 (50% da diferenca)
- Skill > Stats, mas stats importam

### 10.3 Soft Caps

| Atributo | Soft Cap | Hard Cap |
|----------|----------|----------|
| STR/DEX/INT/WIS | 30 | 50 |
| CON | 35 | 60 |
| CHA | 25 | 40 |

---

## 11. Monetizacao

### 11.1 Free to Play

**Gratis:**
- Todo conteudo de gameplay
- Todas habilidades/armas
- Arena competitiva

**Premium:**
- Cosmeticos (skins, efeitos)
- Extra character slots
- Convenience (stash space)
- Battle pass seasonal

### 11.2 NAO Pay-to-Win

- Nenhum bonus de stats
- Nenhuma habilidade exclusiva paga
- Apenas cosmeticos

---

## 12. Roadmap

### Fase 0: Documentacao (1-2 semanas)
- [x] Estrutura de docs
- [x] GDD completo
- [ ] 80 habilidades documentadas
- [ ] 30 armas documentadas
- [ ] Arena items documentados

### Fase 1: Core Engine (2 semanas)
- Setup projeto via SDK
- Rendering 2D (Canvas)
- Movimento e colisao
- Sistema de habilidades base

### Fase 2: Personagem (2 semanas)
- Sistema modular
- 10 habilidades funcionais
- 3 armas funcionais
- Inventario

### Fase 3: Mundo (2 semanas)
- 1 zona jogavel
- 5 tipos de mobs
- 1 boss
- Co-op multiplayer

### Fase 4: Arena MVP (2 semanas)
- Matchmaking basico
- Combate PvP 3v3
- Arena shop
- Ranking basico

### Fase 5: Expansao (2-3 semanas)
- +20 habilidades
- +4 armas
- +2 zonas
- Missoes

### Fase 6: Polish (1-2 semanas)
- Feedback visual
- Som
- UI polish
- Balanceamento

**Total: 12-15 semanas para MVP**

---

## 13. Metricas de Sucesso

### Tecnicas

| Metrica | Target |
|---------|--------|
| Latencia Arena | < 100ms |
| Tick Rate | 60 |
| Load Time | < 3s |

### Gameplay

| Metrica | Target |
|---------|--------|
| Build diversity | 20+ builds viaveis |
| Arena win rate | 45-55% por build |
| Session length | 30-60 min |

### Retencao

| Metrica | Target |
|---------|--------|
| D1 | > 40% |
| D7 | > 20% |
| D30 | > 10% |

---

## 14. Riscos e Mitigacoes

| Risco | Prob | Mitigacao |
|-------|------|-----------|
| Escopo grande | Alta | MVP focado |
| Balanceamento dificil | Alta | Analytics, ajustes |
| Cheat no mundo | Media | Validacao server loot |
| Lag na arena | Baixa | Server authoritative |
| Player base baixa | Media | Bots, PvE robusto |

---

## 15. Referencias

**Inspiracoes:**
- Albion Online (mundo + PvP)
- Path of Exile (builds)
- LoL/Dota (arena)
- Diablo (loot)
- Diep.io (visual)

**Assets:**
- [Game-icons.net](https://game-icons.net/)
- [Kenney.nl](https://kenney.nl/)
- [OpenGameArt.org](https://opengameart.org/)
- [itch.io](https://itch.io/game-assets/free)

---

## Documentos Relacionados

- [ASSETS.md](./ASSETS.md) - Recursos gratuitos
- [character/ATTRIBUTES.md](./character/ATTRIBUTES.md) - Sistema D&D
- [character/ABILITIES.md](./character/ABILITIES.md) - Lista de habilidades
- [character/WEAPONS.md](./character/WEAPONS.md) - Lista de armas
- [arena/ARENA-ITEMS.md](./arena/ARENA-ITEMS.md) - Shop de counter-play
- [balance/POWER-BUDGET.md](./balance/POWER-BUDGET.md) - Balanceamento
