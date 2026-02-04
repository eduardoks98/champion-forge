# Sistema Anti-Cheat

## Visao Geral

Estrategias para prevenir e detectar trapaças no Champion Forge.

---

## Arquitetura

### Principios

1. **Server Authoritative** - Servidor sempre tem a palavra final
2. **Validation First** - Validar todas acoes antes de processar
3. **Detect & Log** - Detectar anomalias, logar para analise
4. **Progressive Punishment** - Avisos antes de bans

---

## Arena (PvP) - Alta Seguranca

### Server-Side Validation

```typescript
interface ActionValidation {
  // Movimento
  validateMovement(player: Player, newPos: Vector2): boolean {
    const maxSpeed = player.getMaxSpeed() * 1.1;  // 10% tolerance
    const distance = Vector2.distance(player.position, newPos);
    const expectedMax = maxSpeed * deltaTime;

    if (distance > expectedMax) {
      this.flagAnomaly(player, 'speed_hack', { distance, expected: expectedMax });
      return false;
    }
    return true;
  }

  // Ataque
  validateAttack(player: Player, target: Player): boolean {
    // Range check
    const weaponRange = player.getWeaponRange() * 1.1;
    const distance = Vector2.distance(player.position, target.position);

    if (distance > weaponRange) {
      this.flagAnomaly(player, 'range_hack', { distance, range: weaponRange });
      return false;
    }

    // Cooldown check
    if (player.isOnCooldown('attack')) {
      this.flagAnomaly(player, 'cooldown_hack');
      return false;
    }

    // Line of sight
    if (!this.hasLineOfSight(player, target)) {
      this.flagAnomaly(player, 'wallhack_attack');
      return false;
    }

    return true;
  }

  // Habilidades
  validateAbility(player: Player, abilityId: string, targetPos: Vector2): boolean {
    // Verifica se tem a habilidade
    if (!player.hasAbility(abilityId)) {
      this.flagAnomaly(player, 'ability_hack', { abilityId });
      return false;
    }

    // Cooldown
    if (player.isOnCooldown(abilityId)) {
      this.flagAnomaly(player, 'cooldown_hack', { abilityId });
      return false;
    }

    // Recurso (mana)
    const cost = getAbilityCost(abilityId);
    if (player.mana < cost) {
      this.flagAnomaly(player, 'resource_hack', { abilityId, mana: player.mana, cost });
      return false;
    }

    return true;
  }
}
```

### Rate Limiting

```typescript
const RATE_LIMITS = {
  // Acoes por segundo
  movement: { max: 60, window: 1000 },      // 60 inputs/s
  attacks: { max: 10, window: 1000 },       // 10 attacks/s max
  abilities: { max: 5, window: 1000 },      // 5 abilities/s
  chat: { max: 5, window: 10000 },          // 5 msgs/10s

  // Acoes especificas
  itemBuy: { max: 20, window: 60000 },      // 20 compras/min
  ping: { max: 10, window: 1000 },          // 10 pings/s
};

function checkRateLimit(player: Player, action: string): boolean {
  const limit = RATE_LIMITS[action];
  const count = player.getActionCount(action, limit.window);

  if (count >= limit.max) {
    flagAnomaly(player, 'rate_limit', { action, count });
    return false;
  }

  player.incrementAction(action);
  return true;
}
```

### Deteccao de Hacks

#### Speed Hack

```typescript
function detectSpeedHack(player: Player): void {
  // Tracking de distancia
  const totalDistance = player.getDistanceTraveled(5000);  // ultimos 5s
  const maxPossible = player.getMaxSpeed() * 5 * 1.15;     // 15% tolerance

  if (totalDistance > maxPossible) {
    const severity = totalDistance / maxPossible;
    flagAnomaly(player, 'speed_hack', { severity });
  }
}
```

#### Damage Hack

```typescript
function detectDamageHack(player: Player, damage: number, expectedMax: number): void {
  if (damage > expectedMax * 1.1) {
    flagAnomaly(player, 'damage_hack', {
      dealt: damage,
      expected: expectedMax,
      ratio: damage / expectedMax,
    });
  }
}
```

#### Cooldown Hack

```typescript
function detectCooldownHack(player: Player, abilityId: string): void {
  const lastUse = player.getLastAbilityUse(abilityId);
  const cooldown = getAbilityCooldown(abilityId, player);

  if (Date.now() - lastUse < cooldown * 0.9) {  // 10% tolerance
    flagAnomaly(player, 'cooldown_hack', { abilityId });
  }
}
```

---

## Mundo Aberto (PvE) - Seguranca Media

### Validacoes Server-Side

```typescript
const PVE_VALIDATIONS = {
  // Loot - SEMPRE server
  loot: {
    validateDrop(player: Player, mobId: string, items: Item[]): boolean {
      // Verificar se mob existe e foi morto
      const mob = this.getMob(mobId);
      if (!mob || !mob.isDead || mob.killer !== player.id) {
        return false;
      }

      // Verificar loot table
      const validItems = mob.getLootTable();
      for (const item of items) {
        if (!validItems.includes(item.templateId)) {
          return false;
        }
      }

      return true;
    },
  },

  // Quests - SEMPRE server
  quests: {
    validateCompletion(player: Player, questId: string): boolean {
      const quest = player.getQuest(questId);
      if (!quest || quest.status !== 'active') {
        return false;
      }

      // Verificar objetivos
      for (const objective of quest.objectives) {
        if (objective.current < objective.required) {
          return false;
        }
      }

      return true;
    },
  },

  // Posicao - Tolerante (instanciado)
  position: {
    // Apenas loggar anomalias, nao bloquear
    // Mundo e mais tolerante pois e instanciado
  },
};
```

### Deteccao de Exploits

```typescript
const EXPLOIT_DETECTION = {
  // Gold dupe
  goldDupe: {
    trackTransactions(player: Player, transactions: Transaction[]): void {
      const balance = calculateExpectedBalance(transactions);
      if (player.gold > balance * 1.01) {  // 1% tolerance
        flagAnomaly(player, 'gold_exploit', {
          actual: player.gold,
          expected: balance,
        });
      }
    },
  },

  // XP farm exploit
  xpFarm: {
    trackXpGain(player: Player, xpGained: number, source: string): void {
      const maxExpected = getMaxXpPerHour(player.level);
      const recentXp = player.getXpGained(3600000);  // ultima hora

      if (recentXp > maxExpected * 1.5) {
        flagAnomaly(player, 'xp_exploit', {
          gained: recentXp,
          maxExpected,
        });
      }
    },
  },

  // Item dupe
  itemDupe: {
    trackInventory(player: Player): void {
      const items = player.getAllItems();
      const itemCounts = new Map<string, number>();

      for (const item of items) {
        const key = `${item.templateId}:${item.id}`;
        if (itemCounts.has(item.id)) {
          flagAnomaly(player, 'item_dupe', { itemId: item.id });
        }
        itemCounts.set(item.id, 1);
      }
    },
  },
};
```

---

## Sistema de Flags

### Anomaly Flags

```typescript
interface AnomalyFlag {
  playerId: string;
  type: AnomalyType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  data: any;
  matchId?: string;
}

type AnomalyType =
  | 'speed_hack'
  | 'damage_hack'
  | 'cooldown_hack'
  | 'range_hack'
  | 'resource_hack'
  | 'ability_hack'
  | 'rate_limit'
  | 'gold_exploit'
  | 'xp_exploit'
  | 'item_dupe'
  | 'wallhack'
  ;

function flagAnomaly(player: Player, type: AnomalyType, data?: any): void {
  const flag: AnomalyFlag = {
    playerId: player.id,
    type,
    severity: getSeverity(type, data),
    timestamp: Date.now(),
    data,
    matchId: player.currentMatch?.id,
  };

  // Salvar no banco
  saveFlag(flag);

  // Acao imediata se critico
  if (flag.severity === 'critical') {
    kickPlayer(player, 'Anti-cheat violation');
  }

  // Incrementar contador
  player.anomalyCount++;

  // Auto-ban se muitas flags
  if (player.anomalyCount > THRESHOLDS[type]) {
    initiateBan(player, type);
  }
}
```

### Thresholds

```typescript
const THRESHOLDS = {
  speed_hack: { count: 10, period: 3600000, action: 'ban_temp' },
  damage_hack: { count: 5, period: 3600000, action: 'ban_perm' },
  cooldown_hack: { count: 20, period: 3600000, action: 'ban_temp' },
  resource_hack: { count: 15, period: 3600000, action: 'kick' },
  gold_exploit: { count: 1, period: 0, action: 'ban_perm' },
  item_dupe: { count: 1, period: 0, action: 'ban_perm' },
};
```

---

## Sistema de Punicoes

### Niveis

| Nivel | Acao | Duracao |
|-------|------|---------|
| 1 | Warning | - |
| 2 | Kick | Imediato |
| 3 | Temp Ban | 24h |
| 4 | Temp Ban | 7 dias |
| 5 | Perm Ban | Permanente |

### Processo

```typescript
async function punishPlayer(
  player: Player,
  reason: string,
  severity: number
): Promise<void> {
  const history = await getPunishmentHistory(player.id);
  const level = Math.min(history.length + 1, 5);

  switch (level) {
    case 1:
      await sendWarning(player, reason);
      break;
    case 2:
      await kickPlayer(player, reason);
      break;
    case 3:
      await banPlayer(player, reason, 24 * 60 * 60 * 1000);
      break;
    case 4:
      await banPlayer(player, reason, 7 * 24 * 60 * 60 * 1000);
      break;
    case 5:
      await banPlayer(player, reason, null);  // perm
      break;
  }

  // Log
  await logPunishment(player.id, level, reason);
}
```

---

## Monitoramento

### Dashboard

```typescript
interface AntiCheatDashboard {
  // Metricas em tempo real
  realtime: {
    activeFlags: number;
    kicksToday: number;
    bansToday: number;
    suspiciousPlayers: Player[];
  };

  // Por tipo
  byType: Map<AnomalyType, {
    count: number;
    trend: 'up' | 'down' | 'stable';
  }>;

  // Alertas
  alerts: Alert[];
}
```

### Alertas

```typescript
const ALERTS = {
  // Muitas flags de um tipo
  typeSpike: {
    condition: (type: AnomalyType, count: number) => count > 100,
    action: 'notify_admin',
  },

  // Player especifico
  playerSuspicious: {
    condition: (player: Player) => player.anomalyCount > 50,
    action: 'manual_review',
  },

  // Exploit em massa
  massExploit: {
    condition: (type: AnomalyType, uniquePlayers: number) => uniquePlayers > 10,
    action: 'emergency_patch',
  },
};
```

---

## Reports de Jogadores

### Sistema de Report

```typescript
interface PlayerReport {
  reporterId: string;
  reportedId: string;
  matchId?: string;
  reason: ReportReason;
  description?: string;
  timestamp: number;
}

type ReportReason =
  | 'cheating'
  | 'toxicity'
  | 'griefing'
  | 'boosting'
  | 'other'
  ;

async function handleReport(report: PlayerReport): Promise<void> {
  // Salvar
  await saveReport(report);

  // Incrementar contador
  await incrementReportCount(report.reportedId);

  // Auto-review se muitos reports
  const count = await getReportCount(report.reportedId, 24 * 60 * 60 * 1000);
  if (count >= 5) {
    await flagForReview(report.reportedId);
  }
}
```

---

## Documentos Relacionados

- [NETWORKING.md](./NETWORKING.md) - Arquitetura de rede
- [DATABASE.md](./DATABASE.md) - Estrutura de dados
- [../arena/MATCHMAKING.md](../arena/MATCHMAKING.md) - Matchmaking
