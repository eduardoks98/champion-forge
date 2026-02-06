// ==========================================
// COMBAT COMPONENT - Sistema de combate unificado
// ==========================================

import { DamageType, Team, Position, distance } from '../data/gameTypes';
import { calculateMitigatedDamage, calculateFinalDamage, PenetrationStats } from '../formulas/damageFormulas';
import { calculateLifeSteal, calculateOmnivamp, rollCritical, calculateCritDamage } from '../formulas/statFormulas';
import { StatsComponent } from './StatsComponent';

// ==========================================
// INTERFACES
// ==========================================

export interface CombatTarget {
  id: string;
  team: Team;
  x: number;
  y: number;
  stats: StatsComponent;
}

export interface AttackResult {
  damage: number;
  isCritical: boolean;
  healing: number;
  targetKilled: boolean;
}

export interface DamageEvent {
  sourceId: string;
  targetId: string;
  damage: number;
  damageType: DamageType;
  isCritical: boolean;
  timestamp: number;
}

// ==========================================
// COMBAT COMPONENT
// ==========================================

export class CombatComponent {
  // Referência aos stats do dono
  private stats: StatsComponent;
  readonly ownerId: string;
  readonly ownerTeam: Team;

  // Estado de ataque
  private attackCooldown: number = 0;
  private isAttacking: boolean = false;
  private attackAnimationTime: number = 0;
  private attackAnimationDuration: number = 200; // ms

  // Alvo atual de auto-attack
  private autoAttackTarget: CombatTarget | null = null;

  // Callbacks
  private onAttackStart: ((target: CombatTarget) => void) | null = null;
  private onAttackHit: ((result: AttackResult, target: CombatTarget) => void) | null = null;
  private onKill: ((target: CombatTarget) => void) | null = null;

  // Damage log (para assists, bounties, etc)
  private damageDealt: Map<string, { amount: number; timestamp: number }[]> = new Map();
  private damageTaken: Map<string, { amount: number; timestamp: number }[]> = new Map();

  constructor(ownerId: string, ownerTeam: Team, stats: StatsComponent) {
    this.ownerId = ownerId;
    this.ownerTeam = ownerTeam;
    this.stats = stats;
  }

  // ==========================================
  // AUTO-ATTACK
  // ==========================================

  /**
   * Seta alvo de auto-attack
   */
  setAutoAttackTarget(target: CombatTarget | null): void {
    this.autoAttackTarget = target;
  }

  /**
   * Retorna alvo atual
   */
  getAutoAttackTarget(): CombatTarget | null {
    return this.autoAttackTarget;
  }

  /**
   * Verifica se pode auto-atacar
   */
  canAutoAttack(): boolean {
    return this.attackCooldown <= 0 && !this.isAttacking;
  }

  /**
   * Verifica se alvo está no range de auto-attack
   */
  isInAutoAttackRange(ownerPosition: Position, target: CombatTarget): boolean {
    const dist = distance(ownerPosition, { x: target.x, y: target.y });
    return dist <= this.stats.attackRange;
  }

  /**
   * Inicia auto-attack
   */
  startAutoAttack(target: CombatTarget): boolean {
    if (!this.canAutoAttack()) return false;

    this.autoAttackTarget = target;
    this.isAttacking = true;
    this.attackAnimationTime = 0;
    this.onAttackStart?.(target);

    return true;
  }

  /**
   * Atualiza estado de combate
   * Retorna AttackResult se um ataque completou
   */
  update(deltaTimeMs: number, ownerPosition: Position): AttackResult | null {
    // Atualizar cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTimeMs;
    }

    // Se está atacando, processar animação
    if (this.isAttacking) {
      this.attackAnimationTime += deltaTimeMs;

      // Ataque acontece no meio da animação
      if (this.attackAnimationTime >= this.attackAnimationDuration / 2 && this.autoAttackTarget) {
        // Verificar se ainda está em range
        if (this.isInAutoAttackRange(ownerPosition, this.autoAttackTarget)) {
          const result = this.executeAutoAttack(this.autoAttackTarget);

          // Iniciar cooldown
          this.attackCooldown = this.stats.attackIntervalMs;
          this.isAttacking = false;
          this.attackAnimationTime = 0;

          return result;
        } else {
          // Alvo saiu do range, cancelar
          this.isAttacking = false;
          this.attackAnimationTime = 0;
        }
      }
    }

    return null;
  }

  /**
   * Executa o dano do auto-attack
   */
  private executeAutoAttack(target: CombatTarget): AttackResult {
    // Calcular dano base
    let damage = this.stats.attackDamage;

    // Verificar crítico
    const isCritical = rollCritical(this.stats.critChance);
    if (isCritical) {
      damage = calculateCritDamage(damage, this.stats.critDamage / 100);
    }

    // Calcular penetração
    const penetration: PenetrationStats = {
      flatReduction: 0,
      percentReduction: 0,
      percentPenetration: this.stats.armorPenPercent,
      lethality: this.stats.armorPen,
    };

    // Aplicar armor
    const finalDamage = calculateFinalDamage(
      damage,
      target.stats.armor,
      penetration,
      this.stats.level
    );

    // Aplicar dano
    const actualDamage = target.stats.takeDamage(finalDamage);

    // Calcular cura (life steal)
    let healing = 0;
    if (this.stats.lifeSteal > 0) {
      healing += calculateLifeSteal(actualDamage, this.stats.lifeSteal);
    }
    if (this.stats.omnivamp > 0) {
      healing += calculateOmnivamp(actualDamage, this.stats.omnivamp, false);
    }

    // Aplicar cura
    if (healing > 0) {
      this.stats.heal(healing);
    }

    // Registrar dano
    this.logDamageDealt(target.id, actualDamage);

    // Verificar kill
    const targetKilled = target.stats.isDead();

    const result: AttackResult = {
      damage: actualDamage,
      isCritical,
      healing,
      targetKilled,
    };

    // Callbacks
    this.onAttackHit?.(result, target);

    if (targetKilled) {
      this.onKill?.(target);
    }

    return result;
  }

  // ==========================================
  // ABILITY DAMAGE
  // ==========================================

  /**
   * Aplica dano de habilidade
   */
  dealAbilityDamage(
    target: CombatTarget,
    baseDamage: number,
    damageType: DamageType,
    isAoE: boolean = false
  ): number {
    let finalDamage: number;

    // Calcular dano baseado no tipo
    if (damageType === 'true') {
      finalDamage = baseDamage;
    } else if (damageType === 'physical') {
      const penetration: PenetrationStats = {
        flatReduction: 0,
        percentReduction: 0,
        percentPenetration: this.stats.armorPenPercent,
        lethality: this.stats.armorPen,
      };
      finalDamage = calculateFinalDamage(baseDamage, target.stats.armor, penetration, this.stats.level);
    } else {
      // Magical
      const penetration: PenetrationStats = {
        flatReduction: 0,
        percentReduction: 0,
        percentPenetration: this.stats.magicPenPercent,
        lethality: this.stats.magicPen,
      };
      finalDamage = calculateFinalDamage(baseDamage, target.stats.magicResist, penetration, this.stats.level);
    }

    // Aplicar dano
    const actualDamage = target.stats.takeDamage(finalDamage);

    // Omnivamp de habilidades
    if (this.stats.omnivamp > 0) {
      const healing = calculateOmnivamp(actualDamage, this.stats.omnivamp, isAoE);
      this.stats.heal(healing);
    }

    // Registrar dano
    this.logDamageDealt(target.id, actualDamage);

    return actualDamage;
  }

  /**
   * Aplica dano de torre
   */
  dealTowerDamage(target: CombatTarget, baseDamage: number, consecutiveHits: number): number {
    // Torre tem ramping: +40% por hit, máximo 220%
    const rampMultiplier = Math.min(1 + consecutiveHits * 0.4, 2.2);
    const damage = baseDamage * rampMultiplier;

    // Torres causam dano físico (mitigado por armor)
    const finalDamage = calculateMitigatedDamage(damage, target.stats.armor);
    const actualDamage = target.stats.takeDamage(finalDamage);

    this.logDamageDealt(target.id, actualDamage);
    return actualDamage;
  }

  // ==========================================
  // TAKE DAMAGE
  // ==========================================

  /**
   * Recebe dano de uma fonte
   */
  takeDamage(
    sourceId: string,
    damage: number,
    damageType: DamageType,
    penetration: PenetrationStats | null = null,
    attackerLevel: number = 1
  ): number {
    let finalDamage: number;

    if (damageType === 'true') {
      finalDamage = damage;
    } else if (damageType === 'physical') {
      if (penetration) {
        finalDamage = calculateFinalDamage(damage, this.stats.armor, penetration, attackerLevel);
      } else {
        finalDamage = calculateMitigatedDamage(damage, this.stats.armor);
      }
    } else {
      // Magical
      if (penetration) {
        finalDamage = calculateFinalDamage(damage, this.stats.magicResist, penetration, attackerLevel);
      } else {
        finalDamage = calculateMitigatedDamage(damage, this.stats.magicResist);
      }
    }

    const actualDamage = this.stats.takeDamage(finalDamage);
    this.logDamageTaken(sourceId, actualDamage);

    return actualDamage;
  }

  // ==========================================
  // DAMAGE LOGGING
  // ==========================================

  private logDamageDealt(targetId: string, amount: number): void {
    if (!this.damageDealt.has(targetId)) {
      this.damageDealt.set(targetId, []);
    }
    this.damageDealt.get(targetId)!.push({
      amount,
      timestamp: Date.now(),
    });

    // Limpar logs antigos (mais de 10 segundos)
    this.cleanOldLogs(this.damageDealt);
  }

  private logDamageTaken(sourceId: string, amount: number): void {
    if (!this.damageTaken.has(sourceId)) {
      this.damageTaken.set(sourceId, []);
    }
    this.damageTaken.get(sourceId)!.push({
      amount,
      timestamp: Date.now(),
    });

    this.cleanOldLogs(this.damageTaken);
  }

  private cleanOldLogs(logs: Map<string, { amount: number; timestamp: number }[]>): void {
    const cutoff = Date.now() - 10_000; // 10 segundos

    logs.forEach((entries, id) => {
      const filtered = entries.filter(e => e.timestamp > cutoff);
      if (filtered.length === 0) {
        logs.delete(id);
      } else {
        logs.set(id, filtered);
      }
    });
  }

  /**
   * Retorna IDs de todas as entidades que causaram dano nos últimos N ms
   * (para calcular assists)
   */
  getDamageSources(withinMs: number = 10_000): string[] {
    const cutoff = Date.now() - withinMs;
    const sources: string[] = [];

    this.damageTaken.forEach((entries, sourceId) => {
      if (entries.some(e => e.timestamp > cutoff)) {
        sources.push(sourceId);
      }
    });

    return sources;
  }

  /**
   * Retorna dano total causado a um alvo
   */
  getTotalDamageDealtTo(targetId: string, withinMs: number = 10_000): number {
    const entries = this.damageDealt.get(targetId);
    if (!entries) return 0;

    const cutoff = Date.now() - withinMs;
    return entries
      .filter(e => e.timestamp > cutoff)
      .reduce((sum, e) => sum + e.amount, 0);
  }

  // ==========================================
  // CALLBACKS
  // ==========================================

  setOnAttackStart(callback: (target: CombatTarget) => void): void {
    this.onAttackStart = callback;
  }

  setOnAttackHit(callback: (result: AttackResult, target: CombatTarget) => void): void {
    this.onAttackHit = callback;
  }

  setOnKill(callback: (target: CombatTarget) => void): void {
    this.onKill = callback;
  }

  // ==========================================
  // QUERIES
  // ==========================================

  isAttackOnCooldown(): boolean {
    return this.attackCooldown > 0;
  }

  getAttackCooldownRemaining(): number {
    return Math.max(0, this.attackCooldown);
  }

  getAttackCooldownProgress(): number {
    const interval = this.stats.attackIntervalMs;
    if (interval === 0) return 1;
    return 1 - (this.attackCooldown / interval);
  }

  // ==========================================
  // RESET
  // ==========================================

  reset(): void {
    this.attackCooldown = 0;
    this.isAttacking = false;
    this.attackAnimationTime = 0;
    this.autoAttackTarget = null;
    this.damageDealt.clear();
    this.damageTaken.clear();
  }
}
