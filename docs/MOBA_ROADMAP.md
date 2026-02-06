# Roadmap: Champion Forge MOBA (Estilo LoL ARAM)

## Visão Geral

Baseado nas mecânicas do League of Legends, este documento descreve tudo que precisa ser implementado para ter uma versão funcional do MOBA.

---

## Fase 1: Core Mechanics (Fundação)

### 1.1 Minions System
**Status:** Parcialmente Implementado

| Feature | Estado | Descrição |
|---------|--------|-----------|
| Spawn de waves | ✅ | Minions spawnam a cada 30s |
| Tipos de minions | ❌ | Melee (60 XP), Caster (30 XP), Siege (75 XP) |
| Pathfinding A* | ⚠️ | Implementado mas com bugs |
| Prioridade de alvos | ✅ | Minions > Player > Estruturas |
| Gold por last hit | ❌ | Melee: 21g, Caster: 14g, Siege: 50g+ |
| XP por last hit | ❌ | Sistema de XP não implementado |

**Regras LoL:**
- Waves spawnam em 1:05 e depois a cada 30 segundos
- Siege minions aparecem a cada 3 waves (após 15min, a cada 2 waves)
- Minions são mais fortes conforme o tempo passa

### 1.2 Towers (Turrets) System
**Status:** Parcialmente Implementado

| Feature | Estado | Descrição |
|---------|--------|-----------|
| Spawn de torres | ✅ | 1 torre por lane por time |
| Ataque automático | ✅ | Torres atacam alvos no range |
| Efeito visual (laser) | ✅ | Laser estilo LoL |
| Range visual (debug) | ✅ | Círculo mostra alcance |
| Prioridade de aggro | ❌ | Pet > Siege > Melee > Caster > Champion |
| Dano crescente | ❌ | +40% por hit consecutivo em champion |
| Plating (placas) | ❌ | 5 placas de 1000HP cada (160g por placa) |

**Regras de Aggro LoL:**
1. Torres atacam o primeiro inimigo que entra no range
2. Se um champion ataca um aliado perto da torre, torre muda de alvo
3. Prioridade: Pets > Siege > Melee > Caster > Champion

### 1.3 Nexus System
**Status:** Implementado

| Feature | Estado | Descrição |
|---------|--------|-----------|
| Nexus existe | ✅ | Um por base |
| HP do Nexus | ✅ | 5000 HP |
| Condição de vitória | ❌ | Destruir Nexus inimigo = vitória |
| Invulnerabilidade | ❌ | Nexus só é atacável após torres caírem |

---

## Fase 2: Player Progression

### 2.1 Sistema de Level/XP
**Status:** Não Implementado

| Feature | Estado | Descrição |
|---------|--------|-----------|
| XP por minion | ❌ | Melee: 60, Caster: 30, Siege: 75 |
| XP compartilhado | ❌ | XP divide se mais de 1 champion perto |
| Level up | ❌ | Níveis 1-18 |
| Stats por level | ❌ | HP, AD, Armor, MR aumentam |
| Skill points | ❌ | 1 ponto por level para habilidades |

### 2.2 Sistema de Gold
**Status:** Não Implementado

| Feature | Estado | Descrição |
|---------|--------|-----------|
| Gold passivo | ❌ | ~20g por 10 segundos |
| Gold por last hit | ❌ | Ver tabela de minions |
| Gold por kill | ❌ | ~300g base + bounty |
| Gold por assist | ❌ | 150g base |
| Loja de itens | ❌ | Comprar itens com gold |

### 2.3 Sistema de Itens
**Status:** Não Implementado

| Feature | Estado | Descrição |
|---------|--------|-----------|
| Inventário | ❌ | 6 slots de itens |
| Itens iniciais | ❌ | Doran's, Long Sword, etc |
| Itens completos | ❌ | Infinity Edge, Rabadon, etc |
| Stats de itens | ❌ | AD, AP, HP, Armor, etc |

---

## Fase 3: Combat System

### 3.1 Auto-Attack
**Status:** Parcialmente Implementado

| Feature | Estado | Descrição |
|---------|--------|-----------|
| Attack range | ✅ | Diferente por entidade |
| Attack speed | ⚠️ | Básico implementado |
| Attack damage | ✅ | Base + bonus |
| Critical strike | ❌ | Chance de dano dobrado |
| Life steal | ❌ | Cura % do dano causado |

### 3.2 Abilities (Skills)
**Status:** Parcialmente Implementado

| Feature | Estado | Descrição |
|---------|--------|-----------|
| Q/W/E/R keybinds | ✅ | Habilidades básicas |
| Cooldowns | ✅ | Timer entre usos |
| Mana cost | ❌ | Custo de mana por uso |
| Scaling | ❌ | Dano escala com AD/AP |
| Skillshots | ⚠️ | Projéteis direcionais |
| AoE abilities | ✅ | Habilidades em área |

### 3.3 Status Effects (CC)
**Status:** Parcialmente Implementado

| Feature | Estado | Descrição |
|---------|--------|-----------|
| Slow | ✅ | Reduz velocidade |
| Stun | ✅ | Impede ações |
| Root | ✅ | Impede movimento |
| Silence | ❌ | Impede habilidades |
| Knockup | ❌ | Joga para cima |
| Knockback | ❌ | Empurra para trás |

---

## Fase 4: Visual Feedback

### 4.1 UI/HUD
**Status:** Parcialmente Implementado

| Feature | Estado | Descrição |
|---------|--------|-----------|
| Health bar | ✅ | Barra de vida |
| Mana bar | ❌ | Barra de mana |
| Ability icons | ✅ | Ícones das skills |
| Cooldown overlay | ⚠️ | Timer visual nas skills |
| Minimap | ❌ | Mapa pequeno no canto |
| Kill feed | ❌ | Notificações de kills |
| Gold display | ❌ | Mostrar gold atual |
| Level display | ❌ | Mostrar level atual |

### 4.2 Combat Feedback
**Status:** Parcialmente Implementado

| Feature | Estado | Descrição |
|---------|--------|-----------|
| Damage numbers | ✅ | Números flutuantes |
| Hit effects | ✅ | Flash ao tomar dano |
| Death animation | ✅ | Shrink ao morrer |
| Tower laser | ✅ | Efeito de ataque |
| Range indicators | ✅ | Círculos de alcance (debug) |
| Skillshot indicators | ❌ | Preview antes de usar |

---

## Fase 5: Game Flow

### 5.1 Match States
**Status:** Não Implementado

| Feature | Estado | Descrição |
|---------|--------|-----------|
| Loading screen | ❌ | Tela de carregamento |
| Game start countdown | ❌ | 1:30 até minions |
| Victory/Defeat screen | ❌ | Tela de resultado |
| Respawn timer | ❌ | Tempo morto aumenta com level |
| Surrender vote | ❌ | FF@15 |

### 5.2 Spawn System
**Status:** Parcialmente Implementado

| Feature | Estado | Descrição |
|---------|--------|-----------|
| Player spawn | ✅ | Spawn na base |
| Minion spawn | ✅ | Spawn em waves |
| Respawn | ❌ | Voltar após morrer |
| Death timer | ❌ | Tempo baseado em level |

---

## Prioridades de Implementação

### Sprint 1: Fundação (1-2 semanas)
1. ✅ Corrigir pathfinding dos minions
2. ⏳ Implementar condição de vitória (Nexus destruído)
3. ⏳ Adicionar mais torres (3 por lane no ARAM completo)
4. ⏳ Implementar aggro correto das torres
5. ⏳ Respawn do player

### Sprint 2: Progressão (1-2 semanas)
1. Sistema de XP e Level
2. Sistema de Gold
3. Last hit mechanic
4. Stats que escalam com level

### Sprint 3: Combat Depth (1-2 semanas)
1. Mana system
2. Mais status effects
3. Skill scaling (AD/AP)
4. Attack speed

### Sprint 4: Polish (1 semana)
1. Minimap
2. Kill feed
3. Victory/Defeat screen
4. Sound effects

---

## Fontes

- [League of Legends - How to Play](https://www.leagueoflegends.com/en-us/how-to-play/)
- [Minion Wiki](https://wiki.leagueoflegends.com/en-us/Minion)
- [Turret Wiki](https://wiki.leagueoflegends.com/en-us/Turret)
- [Tower Aggro Guide](https://dignitas.gg/articles/understanding-turret-aggro-and-target-priority-in-league-of-legends)
- [Wave Management Guide](https://mobalytics.gg/lol/guides/wave-management)
