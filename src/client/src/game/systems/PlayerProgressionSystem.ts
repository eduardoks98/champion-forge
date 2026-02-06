/**
 * Sistema de Progressão do Player
 * Gerencia Gold, XP, Level e Stats que escalam
 *
 * Baseado nas mecânicas do League of Legends:
 * - Gold passivo: ~20g a cada 10 segundos
 * - Gold por minion: Melee 21g, Caster 14g, Siege 50g+
 * - XP por minion: Melee 60, Caster 30, Siege 75
 * - Level 1-18 com stats escalando
 */

export interface PlayerStats {
  // Base stats (level 1)
  baseHp: number;
  baseMana: number;
  baseAd: number;      // Attack Damage
  baseArmor: number;
  baseMr: number;      // Magic Resist
  baseAttackSpeed: number;
  baseMoveSpeed: number;

  // Growth per level
  hpPerLevel: number;
  manaPerLevel: number;
  adPerLevel: number;
  armorPerLevel: number;
  mrPerLevel: number;
}

// Stats padrão do champion (valores estilo LoL)
const DEFAULT_STATS: PlayerStats = {
  baseHp: 580,
  baseMana: 350,
  baseAd: 60,
  baseArmor: 30,
  baseMr: 32,
  baseAttackSpeed: 0.65,
  baseMoveSpeed: 325,

  hpPerLevel: 95,
  manaPerLevel: 40,
  adPerLevel: 3.5,
  armorPerLevel: 4.2,
  mrPerLevel: 1.3,
};

// XP necessário para cada level (acumulativo)
// Level 2 precisa de 280 XP, Level 3 precisa de 660 XP total, etc.
const XP_TABLE: number[] = [
  0,      // Level 1
  280,    // Level 2
  660,    // Level 3
  1140,   // Level 4
  1720,   // Level 5
  2400,   // Level 6
  3180,   // Level 7
  4060,   // Level 8
  5040,   // Level 9
  6120,   // Level 10
  7300,   // Level 11
  8580,   // Level 12
  9960,   // Level 13
  11440,  // Level 14
  13020,  // Level 15
  14700,  // Level 16
  16480,  // Level 17
  18360,  // Level 18
];

// Valores de Gold e XP por tipo de minion
export const MINION_REWARDS = {
  melee: { gold: 21, xp: 60 },
  caster: { gold: 14, xp: 30 },
  siege: { gold: 50, xp: 75 },
  // Super minions aparecem depois
  super: { gold: 60, xp: 90 },
};

// Valores de Gold por kill/assist
export const KILL_REWARDS = {
  baseKillGold: 300,
  baseAssistGold: 150,
  // Bounty aumenta com kills consecutivos (spree)
  bountyPerKill: 50,   // +50g por kill na spree
  maxBounty: 500,      // Máximo de bounty
  // Shutdown gold (quando player com spree morre)
  shutdownBase: 150,
  shutdownPerKill: 50,
};

// Gold passivo
export const PASSIVE_GOLD = {
  amountPer10s: 20,
  startDelay: 0,  // Começa imediatamente (ARAM style)
};

export interface ProgressionState {
  gold: number;
  xp: number;
  level: number;
  skillPoints: number;  // Pontos para upar habilidades
  killStreak: number;   // Kills sem morrer
  totalKills: number;
  totalAssists: number;
  totalDeaths: number;
  totalMinionsKilled: number;
}

export class PlayerProgressionSystem {
  private state: ProgressionState;
  private baseStats: PlayerStats;
  private passiveGoldTimer: number = 0;

  // Callbacks para eventos
  onGoldChange?: (gold: number) => void;
  onXpChange?: (xp: number, level: number) => void;
  onLevelUp?: (newLevel: number, skillPoints: number) => void;

  constructor(baseStats: Partial<PlayerStats> = {}) {
    this.baseStats = { ...DEFAULT_STATS, ...baseStats };
    this.state = {
      gold: 500,  // Gold inicial (ARAM começa com mais gold)
      xp: 0,
      level: 1,
      skillPoints: 1,  // Começa com 1 skill point
      killStreak: 0,
      totalKills: 0,
      totalAssists: 0,
      totalDeaths: 0,
      totalMinionsKilled: 0,
    };
  }

  /**
   * Atualiza o sistema (gold passivo)
   */
  update(deltaTime: number): void {
    // Gold passivo
    this.passiveGoldTimer += deltaTime;
    if (this.passiveGoldTimer >= 10000) {  // 10 segundos
      this.addGold(PASSIVE_GOLD.amountPer10s, 'passive');
      this.passiveGoldTimer -= 10000;
    }
  }

  /**
   * Adiciona gold ao player
   */
  addGold(amount: number, source: string = 'unknown'): void {
    this.state.gold += amount;
    console.log(`[Gold] +${amount}g (${source}) | Total: ${this.state.gold}g`);

    if (this.onGoldChange) {
      this.onGoldChange(this.state.gold);
    }
  }

  /**
   * Gasta gold (retorna true se tiver gold suficiente)
   */
  spendGold(amount: number): boolean {
    if (this.state.gold < amount) return false;

    this.state.gold -= amount;
    if (this.onGoldChange) {
      this.onGoldChange(this.state.gold);
    }
    return true;
  }

  /**
   * Adiciona XP ao player
   */
  addXp(amount: number, source: string = 'unknown'): void {
    this.state.xp += amount;

    // Verificar level up
    while (this.state.level < 18 && this.state.xp >= XP_TABLE[this.state.level]) {
      this.state.level++;
      this.state.skillPoints++;
      console.log(`[Level Up] Level ${this.state.level}! (+1 skill point)`);

      if (this.onLevelUp) {
        this.onLevelUp(this.state.level, this.state.skillPoints);
      }
    }

    console.log(`[XP] +${amount} (${source}) | Total: ${this.state.xp} | Level: ${this.state.level}`);

    if (this.onXpChange) {
      this.onXpChange(this.state.xp, this.state.level);
    }
  }

  /**
   * Processa recompensa por matar um minion (last hit)
   */
  onMinionKill(minionType: keyof typeof MINION_REWARDS): void {
    const rewards = MINION_REWARDS[minionType];
    this.addGold(rewards.gold, `minion_${minionType}`);
    this.addXp(rewards.xp, `minion_${minionType}`);
    this.state.totalMinionsKilled++;
  }

  /**
   * Processa recompensa por matar um champion/player
   */
  onChampionKill(victimKillStreak: number = 0): void {
    // Gold base + bounty baseado na spree da vítima
    let goldReward = KILL_REWARDS.baseKillGold;

    // Shutdown: se vítima tinha spree, bonus gold
    if (victimKillStreak >= 3) {
      const shutdownBonus = KILL_REWARDS.shutdownBase +
        (victimKillStreak - 2) * KILL_REWARDS.shutdownPerKill;
      goldReward += Math.min(shutdownBonus, KILL_REWARDS.maxBounty);
    }

    this.addGold(goldReward, 'champion_kill');
    this.addXp(200, 'champion_kill');  // XP por kill

    this.state.killStreak++;
    this.state.totalKills++;
  }

  /**
   * Processa recompensa por assistência
   */
  onAssist(): void {
    this.addGold(KILL_REWARDS.baseAssistGold, 'assist');
    this.addXp(100, 'assist');  // XP por assist
    this.state.totalAssists++;
  }

  /**
   * Processa morte do player
   */
  onDeath(): void {
    // Resetar kill streak
    this.state.killStreak = 0;
    this.state.totalDeaths++;
  }

  /**
   * Calcula stats atuais baseado no level
   */
  getCurrentStats(): {
    maxHp: number;
    maxMana: number;
    attackDamage: number;
    armor: number;
    magicResist: number;
    attackSpeed: number;
    moveSpeed: number;
  } {
    const level = this.state.level;
    const levelBonus = level - 1;

    return {
      maxHp: Math.floor(this.baseStats.baseHp + this.baseStats.hpPerLevel * levelBonus),
      maxMana: Math.floor(this.baseStats.baseMana + this.baseStats.manaPerLevel * levelBonus),
      attackDamage: Math.floor(this.baseStats.baseAd + this.baseStats.adPerLevel * levelBonus),
      armor: Math.floor(this.baseStats.baseArmor + this.baseStats.armorPerLevel * levelBonus),
      magicResist: Math.floor(this.baseStats.baseMr + this.baseStats.mrPerLevel * levelBonus),
      attackSpeed: this.baseStats.baseAttackSpeed,  // Attack speed escala diferente
      moveSpeed: this.baseStats.baseMoveSpeed,
    };
  }

  /**
   * XP necessário para o próximo level
   */
  getXpForNextLevel(): number {
    if (this.state.level >= 18) return 0;
    return XP_TABLE[this.state.level] - this.state.xp;
  }

  /**
   * XP total necessário para o próximo level
   */
  getXpToNextLevel(): number {
    if (this.state.level >= 18) return 0;
    return XP_TABLE[this.state.level];
  }

  /**
   * Progresso de XP no level atual (0-1)
   */
  getXpProgress(): number {
    if (this.state.level >= 18) return 1;

    const prevLevelXp = this.state.level > 1 ? XP_TABLE[this.state.level - 1] : 0;
    const nextLevelXp = XP_TABLE[this.state.level];
    const currentLevelXp = this.state.xp - prevLevelXp;
    const xpNeeded = nextLevelXp - prevLevelXp;

    return currentLevelXp / xpNeeded;
  }

  /**
   * Retorna bounty atual do player (baseado na kill streak)
   */
  getCurrentBounty(): number {
    if (this.state.killStreak < 3) return 0;

    const bounty = KILL_REWARDS.shutdownBase +
      (this.state.killStreak - 2) * KILL_REWARDS.shutdownPerKill;
    return Math.min(bounty, KILL_REWARDS.maxBounty);
  }

  /**
   * Usa um skill point
   */
  useSkillPoint(): boolean {
    if (this.state.skillPoints <= 0) return false;
    this.state.skillPoints--;
    return true;
  }

  /**
   * Getters
   */
  getGold(): number { return this.state.gold; }
  getXp(): number { return this.state.xp; }
  getLevel(): number { return this.state.level; }
  getSkillPoints(): number { return this.state.skillPoints; }
  getKillStreak(): number { return this.state.killStreak; }
  getState(): ProgressionState { return { ...this.state }; }

  /**
   * Reseta o sistema
   */
  reset(): void {
    this.state = {
      gold: 500,
      xp: 0,
      level: 1,
      skillPoints: 1,
      killStreak: 0,
      totalKills: 0,
      totalAssists: 0,
      totalDeaths: 0,
      totalMinionsKilled: 0,
    };
    this.passiveGoldTimer = 0;
  }
}

// Singleton para acesso global
let progressionInstance: PlayerProgressionSystem | null = null;

export function initializeProgressionSystem(): PlayerProgressionSystem {
  progressionInstance = new PlayerProgressionSystem();
  return progressionInstance;
}

export function getProgressionSystem(): PlayerProgressionSystem {
  if (!progressionInstance) {
    progressionInstance = new PlayerProgressionSystem();
  }
  return progressionInstance;
}
