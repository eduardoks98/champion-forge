# Estrutura de Banco de Dados

## Visao Geral

Arquitetura de dados para Champion Forge usando MySQL + Redis.

---

## Schema Principal (MySQL)

### Accounts

```sql
CREATE TABLE accounts (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(32) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,

  -- OAuth
  google_id VARCHAR(255),
  discord_id VARCHAR(255),

  -- Status
  level INT DEFAULT 1,
  xp BIGINT DEFAULT 0,
  gold BIGINT DEFAULT 0,
  premium_currency INT DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  ban_until TIMESTAMP,

  INDEX idx_email (email),
  INDEX idx_username (username)
);
```

### Characters

```sql
CREATE TABLE characters (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  name VARCHAR(32) NOT NULL,
  slot INT NOT NULL,

  -- Level (character level, separate from account)
  level INT DEFAULT 1,
  xp BIGINT DEFAULT 0,

  -- Attributes
  str INT DEFAULT 12,
  dex INT DEFAULT 12,
  con INT DEFAULT 12,
  int_stat INT DEFAULT 12,
  wis INT DEFAULT 12,
  cha INT DEFAULT 12,
  attribute_points INT DEFAULT 0,

  -- Current state
  current_zone VARCHAR(50) DEFAULT 'forest',
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  hp INT,
  mana INT,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  played_time BIGINT DEFAULT 0,

  FOREIGN KEY (account_id) REFERENCES accounts(id),
  UNIQUE KEY unique_slot (account_id, slot),
  INDEX idx_account (account_id)
);
```

### Equipment

```sql
CREATE TABLE items (
  id CHAR(36) PRIMARY KEY,
  owner_id CHAR(36) NOT NULL,
  owner_type ENUM('character', 'bank', 'marketplace') NOT NULL,

  -- Item info
  item_template_id VARCHAR(50) NOT NULL,
  rarity ENUM('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic') DEFAULT 'common',

  -- Stats (override from template)
  stat_bonus JSON,
  enchantments JSON,
  upgrade_level INT DEFAULT 0,

  -- State
  is_equipped BOOLEAN DEFAULT FALSE,
  equipped_slot VARCHAR(20),
  stack_count INT DEFAULT 1,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_owner (owner_id, owner_type),
  INDEX idx_template (item_template_id)
);
```

### Abilities

```sql
CREATE TABLE character_abilities (
  id CHAR(36) PRIMARY KEY,
  character_id CHAR(36) NOT NULL,
  ability_id VARCHAR(50) NOT NULL,
  slot ENUM('Q', 'W', 'E', 'R'),

  -- Unlock
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  source VARCHAR(50),  -- quest, drop, etc

  FOREIGN KEY (character_id) REFERENCES characters(id),
  INDEX idx_character (character_id)
);
```

### Passives

```sql
CREATE TABLE character_passives (
  id CHAR(36) PRIMARY KEY,
  character_id CHAR(36) NOT NULL,
  passive_id VARCHAR(50) NOT NULL,
  slot INT,  -- 1, 2, 3 or NULL if not equipped

  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  source VARCHAR(50),

  FOREIGN KEY (character_id) REFERENCES characters(id),
  INDEX idx_character (character_id)
);
```

### Quests

```sql
CREATE TABLE quest_progress (
  id CHAR(36) PRIMARY KEY,
  character_id CHAR(36) NOT NULL,
  quest_id VARCHAR(50) NOT NULL,

  status ENUM('active', 'completed', 'failed', 'abandoned') DEFAULT 'active',
  progress JSON,  -- {kills: 5, collected: 3, etc}

  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,

  FOREIGN KEY (character_id) REFERENCES characters(id),
  UNIQUE KEY unique_quest (character_id, quest_id),
  INDEX idx_character (character_id)
);
```

### Arena Stats

```sql
CREATE TABLE arena_stats (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  season INT NOT NULL,

  -- MMR
  mmr INT DEFAULT 1200,
  mmr_deviation INT DEFAULT 350,

  -- LP/Rank
  lp INT DEFAULT 0,
  tier ENUM('bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'grandmaster', 'challenger') DEFAULT 'bronze',
  division INT DEFAULT 4,

  -- Stats
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  kills INT DEFAULT 0,
  deaths INT DEFAULT 0,
  assists INT DEFAULT 0,

  -- Streaks
  current_win_streak INT DEFAULT 0,
  max_win_streak INT DEFAULT 0,

  -- Decay
  last_game TIMESTAMP,
  decay_warned BOOLEAN DEFAULT FALSE,

  FOREIGN KEY (account_id) REFERENCES accounts(id),
  UNIQUE KEY unique_season (account_id, season),
  INDEX idx_ranking (season, tier, lp DESC)
);
```

### Match History

```sql
CREATE TABLE matches (
  id CHAR(36) PRIMARY KEY,

  -- Match info
  mode ENUM('3v3', '5v5', 'ffa', 'duel', 'koth', 'ctf') NOT NULL,
  queue_type ENUM('ranked', 'normal', 'custom') NOT NULL,

  -- Result
  winner_team INT,
  duration INT,  -- seconds

  -- Teams (JSON array of player IDs)
  team1 JSON,
  team2 JSON,

  -- Metadata
  played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  server_id VARCHAR(50),

  INDEX idx_played (played_at)
);

CREATE TABLE match_players (
  id CHAR(36) PRIMARY KEY,
  match_id CHAR(36) NOT NULL,
  account_id CHAR(36) NOT NULL,
  character_id CHAR(36) NOT NULL,

  -- Team
  team INT NOT NULL,

  -- Stats
  kills INT DEFAULT 0,
  deaths INT DEFAULT 0,
  assists INT DEFAULT 0,
  damage_dealt BIGINT DEFAULT 0,
  damage_taken BIGINT DEFAULT 0,
  healing_done BIGINT DEFAULT 0,
  gold_earned INT DEFAULT 0,

  -- Build used
  weapon_id VARCHAR(50),
  abilities JSON,
  passives JSON,
  items_bought JSON,

  -- LP change (ranked only)
  lp_change INT,

  FOREIGN KEY (match_id) REFERENCES matches(id),
  INDEX idx_account (account_id),
  INDEX idx_match (match_id)
);
```

### Guilds

```sql
CREATE TABLE guilds (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(32) UNIQUE NOT NULL,
  tag VARCHAR(5) UNIQUE NOT NULL,

  leader_id CHAR(36) NOT NULL,

  level INT DEFAULT 1,
  xp BIGINT DEFAULT 0,
  gold BIGINT DEFAULT 0,

  description TEXT,
  motd TEXT,
  icon VARCHAR(255),

  member_count INT DEFAULT 1,
  max_members INT DEFAULT 50,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (leader_id) REFERENCES accounts(id),
  INDEX idx_name (name)
);

CREATE TABLE guild_members (
  guild_id CHAR(36) NOT NULL,
  account_id CHAR(36) NOT NULL,

  rank ENUM('leader', 'officer', 'member', 'recruit') DEFAULT 'recruit',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  contribution_xp BIGINT DEFAULT 0,
  contribution_gold BIGINT DEFAULT 0,

  PRIMARY KEY (guild_id, account_id),
  FOREIGN KEY (guild_id) REFERENCES guilds(id),
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);
```

### Marketplace

```sql
CREATE TABLE marketplace_listings (
  id CHAR(36) PRIMARY KEY,
  seller_id CHAR(36) NOT NULL,
  item_id CHAR(36) NOT NULL,

  price INT NOT NULL,
  quantity INT DEFAULT 1,

  listed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,

  status ENUM('active', 'sold', 'cancelled', 'expired') DEFAULT 'active',

  FOREIGN KEY (seller_id) REFERENCES accounts(id),
  FOREIGN KEY (item_id) REFERENCES items(id),
  INDEX idx_status (status, expires_at)
);
```

### Achievements

```sql
CREATE TABLE account_achievements (
  account_id CHAR(36) NOT NULL,
  achievement_id VARCHAR(50) NOT NULL,

  progress INT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,

  PRIMARY KEY (account_id, achievement_id),
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);
```

### Reputation

```sql
CREATE TABLE character_reputation (
  character_id CHAR(36) NOT NULL,
  faction_id VARCHAR(50) NOT NULL,

  points INT DEFAULT 0,

  PRIMARY KEY (character_id, faction_id),
  FOREIGN KEY (character_id) REFERENCES characters(id)
);
```

---

## Redis Schemas

### Session

```typescript
// Key: session:{sessionId}
// TTL: 24 hours
interface Session {
  accountId: string;
  characterId: string;
  loginAt: number;
  lastActivity: number;
  ip: string;
}
```

### Online Players

```typescript
// Key: online:players (SET)
// Members: accountId
// Updated on connect/disconnect

// Key: online:count (STRING)
// Value: number
```

### Matchmaking Queue

```typescript
// Key: queue:{mode}:{queueType} (SORTED SET)
// Score: queueTime
// Member: JSON { playerId, mmr, partyId }
```

### Active Games

```typescript
// Key: game:{gameId} (HASH)
interface ActiveGame {
  mode: string;
  players: string;  // JSON array
  state: string;    // JSON game state
  startedAt: number;
}
```

### Rate Limiting

```typescript
// Key: ratelimit:{action}:{accountId}
// TTL: varies
// Value: count
```

### Leaderboards

```typescript
// Key: leaderboard:arena:season:{season} (SORTED SET)
// Score: LP
// Member: accountId
```

---

## Migrations

### Initial Setup

```sql
-- Version 1.0.0
-- Run all CREATE TABLE statements above
```

### Adding Features

```sql
-- Version 1.1.0 - Add crafting
CREATE TABLE crafting_recipes (
  id VARCHAR(50) PRIMARY KEY,
  ...
);

CREATE TABLE character_crafting_skills (
  character_id CHAR(36),
  skill VARCHAR(50),
  level INT DEFAULT 0,
  xp INT DEFAULT 0,
  PRIMARY KEY (character_id, skill)
);
```

---

## Indices e Otimizacoes

### Queries Frequentes

```sql
-- Player lookup
CREATE INDEX idx_accounts_username ON accounts(username);
CREATE INDEX idx_accounts_email ON accounts(email);

-- Character inventory
CREATE INDEX idx_items_owner ON items(owner_id, owner_type);

-- Leaderboard
CREATE INDEX idx_arena_ranking ON arena_stats(season, tier, lp DESC);

-- Match history
CREATE INDEX idx_match_players_account ON match_players(account_id, match_id);
```

### Partitioning

```sql
-- Particionar match history por mes
ALTER TABLE matches PARTITION BY RANGE (UNIX_TIMESTAMP(played_at)) (
  PARTITION p_2026_01 VALUES LESS THAN (UNIX_TIMESTAMP('2026-02-01')),
  PARTITION p_2026_02 VALUES LESS THAN (UNIX_TIMESTAMP('2026-03-01')),
  ...
);
```

---

## Documentos Relacionados

- [NETWORKING.md](./NETWORKING.md) - Arquitetura de rede
- [ANTI-CHEAT.md](./ANTI-CHEAT.md) - Sistema anti-cheat
