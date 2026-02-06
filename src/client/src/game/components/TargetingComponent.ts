// ==========================================
// TARGETING COMPONENT - Sistema de targeting para entidades
// ==========================================

import { Team, EntityType, areEnemies, Position, distanceSquared } from '../data/gameTypes';
import { TowerTargetPriority } from '../data/structureStats';

// ==========================================
// INTERFACES
// ==========================================

export interface TargetableEntity {
  id: string;
  team: Team;
  entityType: EntityType;
  x: number;
  y: number;
  isDead: boolean;
  isUntargetable?: boolean;
  isInvisible?: boolean;
  minionType?: 'melee' | 'caster' | 'siege' | 'super';
}

export interface TargetingConfig {
  range: number;
  canTargetChampions: boolean;
  canTargetMinions: boolean;
  canTargetStructures: boolean;
  canTargetPets: boolean;
  prioritizeChampions: boolean;  // Para torres, champions têm menor prioridade
  stickyTarget: boolean;         // Manter alvo até morrer/sair do range
  aggroSwapOnDamage: boolean;    // Torres: trocar alvo se champion atacar aliado
}

// ==========================================
// TARGETING COMPONENT
// ==========================================

export class TargetingComponent {
  // Entidade dona deste componente
  private ownerId: string;
  private ownerTeam: Team;

  // Configuração
  private config: TargetingConfig;

  // Alvo atual
  private currentTarget: TargetableEntity | null = null;

  // Para torres: tracking de dano consecutivo
  private consecutiveHits: number = 0;

  // Aggro forçado (quando champion ataca aliado perto da torre)
  private forcedTarget: TargetableEntity | null = null;
  private forcedTargetExpiry: number = 0;

  constructor(ownerId: string, ownerTeam: Team, config: TargetingConfig) {
    this.ownerId = ownerId;
    this.ownerTeam = ownerTeam;
    this.config = config;
  }

  // ==========================================
  // CONFIGURAÇÃO
  // ==========================================

  setRange(range: number): void {
    this.config.range = range;
  }

  getRange(): number {
    return this.config.range;
  }

  setConfig(config: Partial<TargetingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ==========================================
  // FIND TARGET
  // ==========================================

  /**
   * Encontra melhor alvo de uma lista de entidades
   */
  findTarget(
    ownerPosition: Position,
    entities: TargetableEntity[],
    currentTimeMs?: number
  ): TargetableEntity | null {
    // Se tem alvo forçado (aggro de torre), usar ele
    if (this.forcedTarget && currentTimeMs) {
      if (currentTimeMs < this.forcedTargetExpiry) {
        // Verificar se ainda é válido
        const stillValid = entities.find(e =>
          e.id === this.forcedTarget!.id &&
          !e.isDead &&
          !e.isUntargetable
        );

        if (stillValid && this.isInRange(ownerPosition, stillValid)) {
          return stillValid;
        }
      }
      this.forcedTarget = null;
    }

    // Se sticky target está ativo e o alvo atual ainda é válido, manter
    if (this.config.stickyTarget && this.currentTarget) {
      const stillValid = entities.find(e =>
        e.id === this.currentTarget!.id &&
        !e.isDead &&
        !e.isUntargetable &&
        this.isInRange(ownerPosition, e)
      );

      if (stillValid) {
        return stillValid;
      }

      // Alvo morreu ou saiu do range, resetar hits consecutivos
      this.consecutiveHits = 0;
    }

    // Filtrar entidades válidas
    const validTargets = entities.filter(entity => this.isValidTarget(ownerPosition, entity));

    if (validTargets.length === 0) {
      this.currentTarget = null;
      return null;
    }

    // Ordenar por prioridade
    validTargets.sort((a, b) => {
      const priorityA = this.getTargetPriority(a);
      const priorityB = this.getTargetPriority(b);

      // Menor número = maior prioridade
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Mesma prioridade: mais perto primeiro
      const distA = distanceSquared(ownerPosition, a);
      const distB = distanceSquared(ownerPosition, b);
      return distA - distB;
    });

    this.currentTarget = validTargets[0];
    return this.currentTarget;
  }

  /**
   * Verifica se uma entidade é um alvo válido
   */
  isValidTarget(ownerPosition: Position, entity: TargetableEntity): boolean {
    // Não pode ser o próprio
    if (entity.id === this.ownerId) return false;

    // Não pode estar morto
    if (entity.isDead) return false;

    // Não pode ser untargetable (Zhonya, etc)
    if (entity.isUntargetable) return false;

    // Não pode ser invisível (a não ser que tenha visão)
    if (entity.isInvisible) return false;

    // Tem que ser inimigo
    if (!areEnemies(this.ownerTeam, entity.team)) return false;

    // Tem que estar no range
    if (!this.isInRange(ownerPosition, entity)) return false;

    // Verificar tipo de entidade
    switch (entity.entityType) {
      case 'champion':
        return this.config.canTargetChampions;
      case 'minion':
        return this.config.canTargetMinions;
      case 'structure':
        return this.config.canTargetStructures;
      case 'pet':
        return this.config.canTargetPets;
      default:
        return false;
    }
  }

  /**
   * Verifica se está no range
   */
  isInRange(ownerPosition: Position, entity: TargetableEntity): boolean {
    return distanceSquared(ownerPosition, entity) <= this.config.range * this.config.range;
  }

  /**
   * Retorna prioridade do alvo (menor = maior prioridade)
   */
  getTargetPriority(entity: TargetableEntity): number {
    // Para torres, usar sistema de prioridade especial
    if (this.config.prioritizeChampions === false) {
      return this.getTowerTargetPriority(entity);
    }

    // Para champions/minions: priorizar champions
    if (this.config.prioritizeChampions) {
      if (entity.entityType === 'champion') return 1;
      if (entity.entityType === 'minion') return 2;
      if (entity.entityType === 'structure') return 3;
      if (entity.entityType === 'pet') return 4;
    }

    return 5;
  }

  /**
   * Prioridade de alvos para torres (OFICIAL DO LOL)
   */
  private getTowerTargetPriority(entity: TargetableEntity): number {
    if (entity.entityType === 'pet') {
      return TowerTargetPriority.PET;
    }

    if (entity.entityType === 'minion') {
      switch (entity.minionType) {
        case 'siege':
          return TowerTargetPriority.SIEGE_MINION;
        case 'super':
          return TowerTargetPriority.SUPER_MINION;
        case 'melee':
          return TowerTargetPriority.MELEE_MINION;
        case 'caster':
          return TowerTargetPriority.CASTER_MINION;
        default:
          return TowerTargetPriority.MELEE_MINION;
      }
    }

    if (entity.entityType === 'champion') {
      return TowerTargetPriority.CHAMPION;
    }

    return 10; // Baixa prioridade para outros
  }

  // ==========================================
  // AGGRO MANAGEMENT
  // ==========================================

  /**
   * Força alvo (quando champion ataca aliado perto da torre)
   */
  forceTarget(entity: TargetableEntity, durationMs: number, currentTimeMs: number): void {
    if (!this.config.aggroSwapOnDamage) return;

    // Só funciona se for champion inimigo
    if (entity.entityType !== 'champion') return;
    if (!areEnemies(this.ownerTeam, entity.team)) return;

    this.forcedTarget = entity;
    this.forcedTargetExpiry = currentTimeMs + durationMs;
    this.consecutiveHits = 0; // Reset hits quando troca de alvo
  }

  /**
   * Notifica que atacou o alvo (para tower ramping)
   */
  onAttackTarget(): void {
    this.consecutiveHits++;
  }

  /**
   * Retorna número de hits consecutivos (para tower damage ramping)
   */
  getConsecutiveHits(): number {
    return this.consecutiveHits;
  }

  /**
   * Limpa alvo atual
   */
  clearTarget(): void {
    this.currentTarget = null;
    this.consecutiveHits = 0;
  }

  /**
   * Limpa alvo forçado
   */
  clearForcedTarget(): void {
    this.forcedTarget = null;
    this.forcedTargetExpiry = 0;
  }

  // ==========================================
  // QUERIES
  // ==========================================

  getCurrentTarget(): TargetableEntity | null {
    return this.currentTarget;
  }

  hasTarget(): boolean {
    return this.currentTarget !== null;
  }

  getForcedTarget(): TargetableEntity | null {
    return this.forcedTarget;
  }

  hasForcedTarget(): boolean {
    return this.forcedTarget !== null;
  }

  /**
   * Verifica se o alvo atual ainda é válido
   */
  isCurrentTargetValid(ownerPosition: Position, entities: TargetableEntity[]): boolean {
    if (!this.currentTarget) return false;

    const stillExists = entities.find(e => e.id === this.currentTarget!.id);
    if (!stillExists) return false;

    return this.isValidTarget(ownerPosition, stillExists);
  }
}

// ==========================================
// FACTORY FUNCTIONS
// ==========================================

/**
 * Cria TargetingComponent para champions/minions
 */
export function createChampionTargeting(ownerId: string, ownerTeam: Team, range: number): TargetingComponent {
  return new TargetingComponent(ownerId, ownerTeam, {
    range,
    canTargetChampions: true,
    canTargetMinions: true,
    canTargetStructures: true,
    canTargetPets: true,
    prioritizeChampions: true,
    stickyTarget: false,
    aggroSwapOnDamage: false,
  });
}

/**
 * Cria TargetingComponent para torres
 */
export function createTowerTargeting(ownerId: string, ownerTeam: Team, range: number = 750): TargetingComponent {
  return new TargetingComponent(ownerId, ownerTeam, {
    range,
    canTargetChampions: true,
    canTargetMinions: true,
    canTargetStructures: false,
    canTargetPets: true,
    prioritizeChampions: false, // Minions têm prioridade
    stickyTarget: true,         // Manter alvo até morrer/sair
    aggroSwapOnDamage: true,    // Trocar se champion atacar aliado
  });
}

/**
 * Cria TargetingComponent para minions
 */
export function createMinionTargeting(ownerId: string, ownerTeam: Team, range: number): TargetingComponent {
  return new TargetingComponent(ownerId, ownerTeam, {
    range,
    canTargetChampions: true,
    canTargetMinions: true,
    canTargetStructures: true,
    canTargetPets: false,
    prioritizeChampions: false, // Minions priorizam minions/estruturas
    stickyTarget: false,
    aggroSwapOnDamage: false,
  });
}
