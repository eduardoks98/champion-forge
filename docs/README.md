# Champion Forge

## Visao Geral

**Nome provisorio:** Champion Forge / Arena Legends / Build & Battle

**Conceito:** Mundo Aberto 2D + Arena PvP MOBA

**Pitch:** "Crie seu proprio champion e lute na arena"

---

## O Que Torna Isso UNICO

| MOBA Tradicional (LoL) | Champion Forge |
|------------------------|----------------|
| Champions pre-prontos | Voce CRIA seu champion |
| Escolhe e joga | Farma -> Equipa -> Joga |
| Todos tem acesso igual | Seu esforco define seu poder |
| Progressao so na partida | Progressao no mundo + na arena |
| Personagem unico | Multiplos personagens customizados |

---

## Inspiracoes

- **Albion Online** - Mundo aberto + PvP, gear matters
- **Path of Exile** - Build system modular extremo
- **LoL/Dota** - Combate em arena estruturado
- **Diablo** - Loot-based progression
- **Diep.io** - Estilo visual geometrico

---

## Estrutura do Jogo

```
MUNDO INSTANCIADO (Por Party)          ARENA PvP
---------------------------          -----------
- Farm mobs                          - 3v3 ou 5v5
- Completar missoes                  - Team Deathmatch
- Coletar equipamentos               - 10-15 minutos
- Desbloquear habilidades            - Level 1-18 (reseta)
- Crafting                           - Shop de counter-play
- Mini-games                         - Ranking competitivo
```

---

## Sistema Modular

**Personagem = Equipamento + Habilidades + Passivas**

- **Armas** (30+) - Definem estilo de combate
- **Armaduras** - Definem stats base
- **Habilidades** (80-100) - Escolhe 4 de todas desbloqueadas
- **Passivas** (drops raros) - Bonus especiais

---

## Estilo Visual

**Geometrico/Minimalista** (sem necessidade de artista)

- Personagens: Circulos/poligonos coloridos
- Armas: Formas geometricas simples
- Habilidades: Particulas e efeitos de codigo
- UI: Flat design, cores solidas

Inspirado em: Diep.io, Agar.io, Surviv.io, Moomoo.io

---

## Stack Tecnico

- **Server:** Node.js + Socket.IO
- **Client:** React + Canvas
- **SDK:** `@eduardoks98/create-game`

---

## Documentacao

### Core
- [GDD.md](./GDD.md) - Game Design Document completo

### Mundo Aberto
- [world/ZONES.md](./world/ZONES.md) - Zonas e niveis
- [world/MOBS.md](./world/MOBS.md) - Inimigos
- [world/BOSSES.md](./world/BOSSES.md) - Chefes
- [world/QUESTS.md](./world/QUESTS.md) - Missoes
- [world/RESOURCES.md](./world/RESOURCES.md) - Recursos

### Personagem
- [character/ATTRIBUTES.md](./character/ATTRIBUTES.md) - Atributos (STR, DEX, etc)
- [character/WEAPONS.md](./character/WEAPONS.md) - Armas (30+)
- [character/ABILITIES.md](./character/ABILITIES.md) - Habilidades (80-100)
- [character/PASSIVES.md](./character/PASSIVES.md) - Passivas
- [character/BUILDS.md](./character/BUILDS.md) - Exemplos de builds

### Equipamentos
- [equipment/ARMOR.md](./equipment/ARMOR.md) - Armaduras
- [equipment/ACCESSORIES.md](./equipment/ACCESSORIES.md) - Acessorios
- [equipment/RARITY.md](./equipment/RARITY.md) - Raridades
- [equipment/LOOT-TABLES.md](./equipment/LOOT-TABLES.md) - Tabelas de drop

### Arena PvP
- [arena/MODES.md](./arena/MODES.md) - Modos de jogo
- [arena/ARENA-ITEMS.md](./arena/ARENA-ITEMS.md) - Itens de counter-play
- [arena/RANKING.md](./arena/RANKING.md) - Sistema de ranking
- [arena/MATCHMAKING.md](./arena/MATCHMAKING.md) - Matchmaking
- [arena/BALANCE.md](./arena/BALANCE.md) - Balanceamento

### Progressao
- [progression/ACCOUNT-LEVEL.md](./progression/ACCOUNT-LEVEL.md) - Niveis de conta
- [progression/UNLOCKS.md](./progression/UNLOCKS.md) - Desbloqueios
- [progression/ACHIEVEMENTS.md](./progression/ACHIEVEMENTS.md) - Conquistas

### Tecnico
- [technical/NETWORKING.md](./technical/NETWORKING.md) - Socket.IO
- [technical/DATABASE.md](./technical/DATABASE.md) - Estrutura de dados
- [technical/ANTI-CHEAT.md](./technical/ANTI-CHEAT.md) - Validacoes

### Balanceamento
- [balance/POWER-BUDGET.md](./balance/POWER-BUDGET.md) - Sistema de orcamento
- [balance/FORMULAS.md](./balance/FORMULAS.md) - Formulas de dano/stats
- [balance/SPREADSHEETS.md](./balance/SPREADSHEETS.md) - Planilhas

---

## Estimativa

**12-15 semanas para MVP**

| Fase | Duracao | Descricao |
|------|---------|-----------|
| 0 | 1-2 sem | Documentacao completa |
| 1 | 2 sem | Core engine |
| 2 | 2 sem | Sistema de personagem |
| 3 | 2 sem | Mundo aberto |
| 4 | 2 sem | Arena MVP |
| 5 | 2-3 sem | Expansao de conteudo |
| 6 | 1-2 sem | Polish |

---

## Assets

Ver [ASSETS.md](./ASSETS.md) para lista de recursos gratuitos (sprites, icones, sons).
