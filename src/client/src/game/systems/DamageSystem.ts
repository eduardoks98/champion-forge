// ==========================================
// DAMAGE SYSTEM - Sistema centralizado de dano
// ==========================================

import { Team, areEnemies } from '../data/gameTypes';
import { StatsComponent } from '../components/StatsComponent';
import {
  calculateMitigatedDamage,
  calculateEffectiveResistance,
  DamageType,
  PenetrationStats,
} from '../formulas/damageFormulas';
import { DEFAULT_ENTITY, DEFAULT_COMBAT } from '../constants/gameDefaults';

// ==========================================
// INTERFACES
// ==========================================

export interface DamageSource {
  id: string;
  team: Team;
  stats?: StatsComponent;
  level?: number;
}

export interface DamageTarget {
  id: string;
  team: Team;
  stats: StatsComponent;
  onDamage?: (amount: number, source: DamageSource) => void;
  onDeath?: (killer: DamageSource) => void;
}

export interface DamageInstance {
  source: DamageSource;
  target: DamageTarget;
  rawDamage: number;
  damageType: DamageType;
  isCritical?: boolean;
  isAbility?: boolean;
  abilityId?: string;
  // Penetration
  flatPenetration?: number;
  percentPenetration?: number;
  flatReduction?: number;
  percentReduction?: number;
  // Flags
  ignoreArmor?: boolean;
  isTrueDamage?: boolean;
  canCrit?: boolean;
  // Life steal
  lifeStealPercent?: number;
}

export interface DamageResult {
  rawDamage: number;
  mitigatedDamage: number;
  actualDamage: number; // Dano efetivamente causado (limitado pelo HP restante)
  overkill: number;
  killedTarget: boolean;
  healedAmount: number; // Life steal
}

export interface DamageEvent {
  timestamp: number;
  source: DamageSource;
  target: DamageTarget;
  result: DamageResult;
  damageType: DamageType;
  isCritical: boolean;
  isAbility: boolean;
  abilityId?: string;
}

// ==========================================
// DAMAGE SYSTEM
// ==========================================

let damageSystemInstance: DamageSystem | null = null;

export class DamageSystem {
  // Histórico de dano (para assists, death recap, etc.)
  private damageHistory: DamageEvent[] = [];
  private maxHistorySize: number = 1000;

  // Callbacks
  private onDamageCallbacks: ((event: DamageEvent) => void)[] = [];
  private onKillCallbacks: ((event: DamageEvent) => void)[] = [];

  // Stats
  private totalDamageDealt: Map<string, number> = new Map();
  private totalDamageTaken: Map<string, number> = new Map();

  constructor() {
    // Singleton
  }

  // ==========================================
  // MAIN DAMAGE PROCESSING
  // ==========================================

  /**
   * Processa uma instância de dano
   */
  processDamage(instance: DamageInstance): DamageResult {
    const { source, target, rawDamage, damageType } = instance;

    // Verificar se pode causar dano
    if (!this.canDamage(source, target)) {
      return {
        rawDamage: 0,
        mitigatedDamage: 0,
        actualDamage: 0,
        overkill: 0,
        killedTarget: false,
        healedAmount: 0,
      };
    }

    // Calcular dano crítico
    let finalRawDamage = rawDamage;
    let isCritical = false;

    if (instance.canCrit && instance.isCritical) {
      finalRawDamage *= 1.75; // 175% dano crítico base
      isCritical = true;
    }

    // Calcular dano mitigado
    let mitigatedDamage: number;

    if (instance.isTrueDamage || instance.ignoreArmor) {
      // True damage ignora resistências
      mitigatedDamage = finalRawDamage;
    } else {
      // Obter resistência efetiva
      const resistance = damageType === 'physical'
        ? target.stats.armor
        : target.stats.magicResist;

      // Criar objeto de penetração
      const penetration: PenetrationStats = {
        flatReduction: instance.flatReduction ?? DEFAULT_COMBAT.PENETRATION,
        percentReduction: instance.percentReduction ?? DEFAULT_COMBAT.PENETRATION,
        percentPenetration: instance.percentPenetration ?? DEFAULT_COMBAT.PENETRATION,
        lethality: instance.flatPenetration ?? DEFAULT_COMBAT.PENETRATION,
      };

      const effectiveResistance = calculateEffectiveResistance(
        resistance,
        penetration,
        source.level ?? DEFAULT_ENTITY.LEVEL
      );

      mitigatedDamage = calculateMitigatedDamage(finalRawDamage, effectiveResistance);
    }

    // Aplicar dano
    const hpBefore = target.stats.currentHp;
    const actualDamage = target.stats.takeDamage(mitigatedDamage);
    const killedTarget = target.stats.isDead();
    const overkill = Math.max(0, mitigatedDamage - hpBefore);

    // Life steal
    let healedAmount = 0;
    if (instance.lifeStealPercent && instance.lifeStealPercent > 0 && source.stats) {
      healedAmount = actualDamage * (instance.lifeStealPercent / 100);
      source.stats.heal(healedAmount);
    }

    // Criar resultado
    const result: DamageResult = {
      rawDamage: finalRawDamage,
      mitigatedDamage,
      actualDamage,
      overkill,
      killedTarget,
      healedAmount,
    };

    // Criar evento
    const event: DamageEvent = {
      timestamp: Date.now(),
      source,
      target,
      result,
      damageType,
      isCritical,
      isAbility: instance.isAbility ?? false,
      abilityId: instance.abilityId,
    };

    // Registrar no histórico
    this.recordDamage(event);

    // Callbacks
    target.onDamage?.(actualDamage, source);

    if (killedTarget) {
      target.onDeath?.(source);
      this.onKillCallbacks.forEach(cb => cb(event));
    }

    this.onDamageCallbacks.forEach(cb => cb(event));

    return result;
  }

  /**
   * Processa auto-attack
   */
  processAutoAttack(
    source: DamageSource,
    target: DamageTarget,
    bonusDamage: number = 0
  ): DamageResult {
    const baseDamage = source.stats?.attackDamage ?? 0;

    return this.processDamage({
      source,
      target,
      rawDamage: baseDamage + bonusDamage,
      damageType: 'physical',
      canCrit: true,
      isCritical: this.rollCrit(source),
      lifeStealPercent: source.stats?.lifeSteal ?? 0,
    });
  }

  /**
   * Processa dano de habilidade
   */
  processAbilityDamage(
    source: DamageSource,
    target: DamageTarget,
    baseDamage: number,
    damageType: DamageType,
    abilityId: string,
    options: Partial<DamageInstance> = {}
  ): DamageResult {
    return this.processDamage({
      source,
      target,
      rawDamage: baseDamage,
      damageType,
      isAbility: true,
      abilityId,
      ...options,
    });
  }

  /**
   * Processa dano de torre
   */
  processTowerDamage(
    source: DamageSource,
    target: DamageTarget,
    baseDamage: number,
    consecutiveHits: number
  ): DamageResult {
    // Tower damage ramp: +40% por hit, max 220%
    const rampMultiplier = Math.min(1 + consecutiveHits * 0.4, 2.2);
    const finalDamage = baseDamage * rampMultiplier;

    return this.processDamage({
      source,
      target,
      rawDamage: finalDamage,
      damageType: 'physical',
      // Torres ignoram uma porcentagem de armor
      percentPenetration: 30,
    });
  }

  /**
   * Processa true damage
   */
  processTrueDamage(
    source: DamageSource,
    target: DamageTarget,
    damage: number,
    abilityId?: string
  ): DamageResult {
    return this.processDamage({
      source,
      target,
      rawDamage: damage,
      damageType: 'true',
      isTrueDamage: true,
      isAbility: !!abilityId,
      abilityId,
    });
  }

  // ==========================================
  // HELPERS
  // ==========================================

  /**
   * Verifica se source pode causar dano em target
   */
  canDamage(source: DamageSource, target: DamageTarget): boolean {
    // Não pode causar dano em si mesmo (a menos que seja self-damage)
    if (source.id === target.id) return false;

    // Precisa ser inimigo
    if (!areEnemies(source.team, target.team)) return false;

    // Target precisa ter stats
    if (!target.stats) return false;

    // Target não pode estar morto
    if (target.stats.isDead()) return false;

    return true;
  }

  /**
   * Rola crítico
   */
  private rollCrit(source: DamageSource): boolean {
    const critChance = source.stats?.critChance ?? 0;
    return Math.random() * 100 < critChance;
  }

  /**
   * Registra dano no histórico
   */
  private recordDamage(event: DamageEvent): void {
    this.damageHistory.push(event);

    // Limitar tamanho do histórico
    if (this.damageHistory.length > this.maxHistorySize) {
      this.damageHistory.shift();
    }

    // Atualizar totais
    const sourceTotal = this.totalDamageDealt.get(event.source.id) ?? 0;
    this.totalDamageDealt.set(event.source.id, sourceTotal + event.result.actualDamage);

    const targetTotal = this.totalDamageTaken.get(event.target.id) ?? 0;
    this.totalDamageTaken.set(event.target.id, targetTotal + event.result.actualDamage);
  }

  // ==========================================
  // QUERIES
  // ==========================================

  /**
   * Retorna dano recebido por um alvo nos últimos X ms
   */
  getDamageTakenInWindow(targetId: string, windowMs: number): DamageEvent[] {
    const cutoff = Date.now() - windowMs;
    return this.damageHistory.filter(
      e => e.target.id === targetId && e.timestamp >= cutoff
    );
  }

  /**
   * Retorna todos que causaram dano em um alvo (para assists)
   */
  getRecentDamageSources(targetId: string, windowMs: number = 10000): string[] {
    const events = this.getDamageTakenInWindow(targetId, windowMs);
    const sources = new Set(events.map(e => e.source.id));
    return Array.from(sources);
  }

  /**
   * Retorna death recap (últimos danos recebidos antes de morrer)
   */
  getDeathRecap(targetId: string, count: number = 10): DamageEvent[] {
    return this.damageHistory
      .filter(e => e.target.id === targetId)
      .slice(-count);
  }

  /**
   * Retorna total de dano causado por uma entidade
   */
  getTotalDamageDealt(entityId: string): number {
    return this.totalDamageDealt.get(entityId) ?? 0;
  }

  /**
   * Retorna total de dano recebido por uma entidade
   */
  getTotalDamageTaken(entityId: string): number {
    return this.totalDamageTaken.get(entityId) ?? 0;
  }

  // ==========================================
  // CALLBACKS
  // ==========================================

  onDamage(callback: (event: DamageEvent) => void): void {
    this.onDamageCallbacks.push(callback);
  }

  onKill(callback: (event: DamageEvent) => void): void {
    this.onKillCallbacks.push(callback);
  }

  removeOnDamage(callback: (event: DamageEvent) => void): void {
    const index = this.onDamageCallbacks.indexOf(callback);
    if (index !== -1) {
      this.onDamageCallbacks.splice(index, 1);
    }
  }

  removeOnKill(callback: (event: DamageEvent) => void): void {
    const index = this.onKillCallbacks.indexOf(callback);
    if (index !== -1) {
      this.onKillCallbacks.splice(index, 1);
    }
  }

  // ==========================================
  // RESET
  // ==========================================

  reset(): void {
    this.damageHistory = [];
    this.totalDamageDealt.clear();
    this.totalDamageTaken.clear();
  }

  clearHistory(): void {
    this.damageHistory = [];
  }
}

// ==========================================
// SINGLETON
// ==========================================

export function initializeDamageSystem(): DamageSystem {
  damageSystemInstance = new DamageSystem();
  return damageSystemInstance;
}

export function getDamageSystem(): DamageSystem {
  if (!damageSystemInstance) {
    damageSystemInstance = new DamageSystem();
  }
  return damageSystemInstance;
}
