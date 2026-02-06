// ==========================================
// STATS COMPONENT - Gerencia stats de qualquer entidade
// ==========================================

import {
  calculateAttackSpeed,
  calculateFinalMoveSpeed,
  calculateHpRegen,
  calculateManaRegen,
  hasteToCDR,
  getAttackIntervalMs,
} from '../formulas/statFormulas';
import { ChampionBaseStats, EntityStats, createEntityStats, recalculateStatsForLevel } from '../data/championStats';
import { DEFAULT_ENTITY } from '../constants/gameDefaults';

// ==========================================
// INTERFACE
// ==========================================

export interface StatsComponentConfig {
  baseStats: ChampionBaseStats;
  level?: number;
  isChampion?: boolean;
}

// ==========================================
// STATS COMPONENT
// ==========================================

export class StatsComponent {
  // Stats base (level 1, sem items)
  private baseStats: ChampionBaseStats;

  // Stats atuais calculados
  private stats: EntityStats;

  // Level atual
  private _level: number = 1;

  // É champion (tem level scaling)?
  private isChampion: boolean;

  // Buffs/debuffs temporários
  private tempBonuses: {
    flatMs: number;
    percentMs: number;
    highestSlow: number;
  } = {
    flatMs: 0,
    percentMs: 0,
    highestSlow: 0,
  };

  constructor(config: StatsComponentConfig) {
    this.baseStats = config.baseStats;
    this._level = config.level ?? DEFAULT_ENTITY.LEVEL;
    this.isChampion = config.isChampion ?? true;

    // Inicializar stats
    this.stats = createEntityStats(this.baseStats, this._level);
  }

  // ==========================================
  // GETTERS BÁSICOS
  // ==========================================

  get level(): number {
    return this._level;
  }

  get maxHp(): number {
    return this.stats.maxHp + this.stats.bonusHp;
  }

  get currentHp(): number {
    return this.stats.currentHp;
  }

  get hpPercent(): number {
    return this.maxHp > 0 ? this.stats.currentHp / this.maxHp : 0;
  }

  get maxMana(): number {
    return this.stats.maxMana + this.stats.bonusMana;
  }

  get currentMana(): number {
    return this.stats.currentMana;
  }

  get manaPercent(): number {
    return this.maxMana > 0 ? this.stats.currentMana / this.maxMana : 0;
  }

  get attackDamage(): number {
    return this.stats.attackDamage + this.stats.bonusAd;
  }

  get attackSpeed(): number {
    return calculateAttackSpeed(
      this.baseStats.attackSpeed,
      this.stats.bonusAs,
      this.baseStats.attackSpeedRatio || this.baseStats.attackSpeed
    );
  }

  get attackIntervalMs(): number {
    return getAttackIntervalMs(this.attackSpeed);
  }

  get armor(): number {
    return this.stats.armor + this.stats.bonusArmor;
  }

  get magicResist(): number {
    return this.stats.magicResist + this.stats.bonusMr;
  }

  get moveSpeed(): number {
    return calculateFinalMoveSpeed(
      this.baseStats.moveSpeed,
      this.stats.bonusMs + this.tempBonuses.flatMs,
      this.tempBonuses.percentMs,
      this.tempBonuses.highestSlow,
      this.stats.slowResist
    );
  }

  get attackRange(): number {
    return this.stats.attackRange;
  }

  get abilityHaste(): number {
    return this.stats.abilityHaste;
  }

  get cdr(): number {
    return hasteToCDR(this.stats.abilityHaste);
  }

  get critChance(): number {
    return Math.min(100, this.stats.critChance);
  }

  get critDamage(): number {
    return this.stats.critDamage;
  }

  get lifeSteal(): number {
    return this.stats.lifeSteal;
  }

  get omnivamp(): number {
    return this.stats.omnivamp;
  }

  get tenacity(): number {
    return this.stats.tenacity;
  }

  // Penetração
  get armorPen(): number {
    return this.stats.armorPen;
  }

  get armorPenPercent(): number {
    return this.stats.armorPenPercent;
  }

  get magicPen(): number {
    return this.stats.magicPen;
  }

  get magicPenPercent(): number {
    return this.stats.magicPenPercent;
  }

  // ==========================================
  // HEALTH / MANA MANAGEMENT
  // ==========================================

  /**
   * Aplica dano (retorna dano efetivo causado)
   */
  takeDamage(amount: number): number {
    const actualDamage = Math.min(this.stats.currentHp, amount);
    this.stats.currentHp -= actualDamage;
    return actualDamage;
  }

  /**
   * Cura HP (retorna quantidade curada)
   */
  heal(amount: number): number {
    const maxHeal = this.maxHp - this.stats.currentHp;
    const actualHeal = Math.min(maxHeal, amount);
    this.stats.currentHp += actualHeal;
    return actualHeal;
  }

  /**
   * Seta HP diretamente (para respawn)
   */
  setHp(value: number): void {
    this.stats.currentHp = Math.max(0, Math.min(this.maxHp, value));
  }

  /**
   * Reseta HP para máximo
   */
  fullHeal(): void {
    this.stats.currentHp = this.maxHp;
  }

  /**
   * Gasta mana (retorna true se tinha mana suficiente)
   */
  spendMana(amount: number): boolean {
    if (this.stats.currentMana < amount) return false;
    this.stats.currentMana -= amount;
    return true;
  }

  /**
   * Restaura mana
   */
  restoreMana(amount: number): number {
    const maxRestore = this.maxMana - this.stats.currentMana;
    const actualRestore = Math.min(maxRestore, amount);
    this.stats.currentMana += actualRestore;
    return actualRestore;
  }

  /**
   * Reseta mana para máximo
   */
  fullMana(): void {
    this.stats.currentMana = this.maxMana;
  }

  /**
   * Verifica se está morto
   */
  isDead(): boolean {
    return this.stats.currentHp <= 0;
  }

  // ==========================================
  // LEVEL UP
  // ==========================================

  /**
   * Aumenta level e recalcula stats
   */
  levelUp(): void {
    if (!this.isChampion) return;
    if (this._level >= 18) return;

    this._level++;
    this.stats = recalculateStatsForLevel(this.stats, this.baseStats, this._level);
  }

  /**
   * Seta level diretamente
   */
  setLevel(level: number): void {
    if (!this.isChampion) return;
    this._level = Math.max(1, Math.min(18, level));
    this.stats = recalculateStatsForLevel(this.stats, this.baseStats, this._level);
  }

  // ==========================================
  // REGEN UPDATE
  // ==========================================

  /**
   * Atualiza regeneração de HP e Mana
   * Chamar a cada frame
   */
  updateRegen(deltaTimeMs: number): void {
    // HP Regen
    if (this.stats.currentHp < this.maxHp) {
      const hpRegen = calculateHpRegen(this.stats.hpRegen, deltaTimeMs);
      this.heal(hpRegen);
    }

    // Mana Regen
    if (this.stats.currentMana < this.maxMana) {
      const manaRegen = calculateManaRegen(this.stats.manaRegen, deltaTimeMs);
      this.restoreMana(manaRegen);
    }
  }

  // ==========================================
  // BONUS STATS (de items/buffs)
  // ==========================================

  addBonusHp(amount: number): void {
    this.stats.bonusHp += amount;
  }

  addBonusMana(amount: number): void {
    this.stats.bonusMana += amount;
  }

  addBonusAd(amount: number): void {
    this.stats.bonusAd += amount;
  }

  addBonusArmor(amount: number): void {
    this.stats.bonusArmor += amount;
  }

  addBonusMr(amount: number): void {
    this.stats.bonusMr += amount;
  }

  addBonusAs(percent: number): void {
    this.stats.bonusAs += percent;
  }

  addBonusMs(flat: number): void {
    this.stats.bonusMs += flat;
  }

  addAbilityHaste(amount: number): void {
    this.stats.abilityHaste += amount;
  }

  addCritChance(percent: number): void {
    this.stats.critChance += percent;
  }

  addLifeSteal(percent: number): void {
    this.stats.lifeSteal += percent;
  }

  addOmnivamp(percent: number): void {
    this.stats.omnivamp += percent;
  }

  addTenacity(percent: number): void {
    // Tenacity stacka multiplicativamente
    this.stats.tenacity = 100 - (100 - this.stats.tenacity) * (1 - percent / 100);
  }

  // Penetração
  addArmorPen(lethality: number): void {
    this.stats.armorPen += lethality;
  }

  addArmorPenPercent(percent: number): void {
    this.stats.armorPenPercent += percent;
  }

  addMagicPen(flat: number): void {
    this.stats.magicPen += flat;
  }

  addMagicPenPercent(percent: number): void {
    this.stats.magicPenPercent += percent;
  }

  // ==========================================
  // TEMPORARY MODIFIERS (slows, buffs de MS)
  // ==========================================

  /**
   * Aplica slow (apenas o maior é usado)
   */
  applySlow(percent: number): void {
    this.tempBonuses.highestSlow = Math.max(this.tempBonuses.highestSlow, percent);
  }

  /**
   * Remove slow
   */
  removeSlow(): void {
    this.tempBonuses.highestSlow = 0;
  }

  /**
   * Adiciona bonus de MS temporário
   */
  addTempMsFlat(amount: number): void {
    this.tempBonuses.flatMs += amount;
  }

  addTempMsPercent(percent: number): void {
    this.tempBonuses.percentMs += percent;
  }

  /**
   * Limpa todos os modificadores temporários
   */
  clearTempBonuses(): void {
    this.tempBonuses = {
      flatMs: 0,
      percentMs: 0,
      highestSlow: 0,
    };
  }

  // ==========================================
  // RESET
  // ==========================================

  /**
   * Reseta para estado inicial (respawn)
   */
  reset(): void {
    this.stats.currentHp = this.maxHp;
    this.stats.currentMana = this.maxMana;
    this.clearTempBonuses();
  }

  /**
   * Reseta stats bonus (remove items)
   */
  resetBonusStats(): void {
    this.stats.bonusHp = 0;
    this.stats.bonusMana = 0;
    this.stats.bonusAd = 0;
    this.stats.bonusArmor = 0;
    this.stats.bonusMr = 0;
    this.stats.bonusAs = 0;
    this.stats.bonusMs = 0;
    this.stats.abilityHaste = 0;
    this.stats.critChance = 0;
    this.stats.critDamage = 175;
    this.stats.lifeSteal = 0;
    this.stats.omnivamp = 0;
    this.stats.armorPen = 0;
    this.stats.armorPenPercent = 0;
    this.stats.magicPen = 0;
    this.stats.magicPenPercent = 0;
    this.stats.tenacity = 0;
    this.stats.slowResist = 0;
  }

  // ==========================================
  // SERIALIZATION
  // ==========================================

  /**
   * Retorna objeto com todos os stats (para debug/UI)
   */
  getStats(): EntityStats {
    return { ...this.stats };
  }

  /**
   * Retorna stats finais calculados
   */
  getFinalStats(): {
    maxHp: number;
    currentHp: number;
    maxMana: number;
    currentMana: number;
    attackDamage: number;
    attackSpeed: number;
    armor: number;
    magicResist: number;
    moveSpeed: number;
    attackRange: number;
    abilityHaste: number;
    cdr: number;
    critChance: number;
    lifeSteal: number;
    level: number;
  } {
    return {
      maxHp: this.maxHp,
      currentHp: this.currentHp,
      maxMana: this.maxMana,
      currentMana: this.currentMana,
      attackDamage: this.attackDamage,
      attackSpeed: this.attackSpeed,
      armor: this.armor,
      magicResist: this.magicResist,
      moveSpeed: this.moveSpeed,
      attackRange: this.attackRange,
      abilityHaste: this.abilityHaste,
      cdr: this.cdr,
      critChance: this.critChance,
      lifeSteal: this.lifeSteal,
      level: this._level,
    };
  }
}
