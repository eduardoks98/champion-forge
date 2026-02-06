// ==========================================
// EXPERIENCE SYSTEM - Sistema de XP com level up e sharing
// ==========================================

import {
  getXpForLevel,
  getXpToNextLevel,
  getXpProgress,
  calculateSharedXp,
  calculateKillXp,
  calculateAssistXp,
  getMinionXp,
  processXpGain,
  XP_SHARE_RANGE,
  MAX_LEVEL,
  ARAM_PASSIVE_XP_PER_SECOND,
} from '../formulas/experienceFormulas';
import { Team, Position, distanceSquared } from '../data/gameTypes';
import { MinionType } from '../data/minionStats';
import { DEFAULT_ENTITY } from '../constants/gameDefaults';

// ==========================================
// INTERFACES
// ==========================================

export interface PlayerXpState {
  id: string;
  team: Team;
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  xpProgress: number; // 0-100%
}

export interface XpEvent {
  type: 'kill' | 'assist' | 'minion' | 'passive' | 'shared';
  amount: number;
  playerId: string;
  sourceId?: string;
  timestamp: number;
}

// ==========================================
// EXPERIENCE SYSTEM
// ==========================================

export class ExperienceSystem {
  // Estado de XP de cada jogador
  private players: Map<string, PlayerXpState> = new Map();

  // Configuração
  private isARAM: boolean;

  // Acumulador para XP passivo (ARAM)
  private passiveXpAccumulator: number = 0;

  // Histórico de eventos
  private xpEvents: XpEvent[] = [];

  // Callbacks
  private onXpGain: ((playerId: string, amount: number, event: XpEvent) => void) | null = null;
  private onLevelUp: ((playerId: string, newLevel: number) => void) | null = null;

  constructor(isARAM: boolean = false) {
    this.isARAM = isARAM;
  }

  // ==========================================
  // PLAYER MANAGEMENT
  // ==========================================

  /**
   * Registra um jogador no sistema
   */
  registerPlayer(id: string, team: Team, startingLevel: number = 1): void {
    const xpForLevel = getXpForLevel(startingLevel);

    this.players.set(id, {
      id,
      team,
      level: startingLevel,
      currentXp: xpForLevel,
      xpToNextLevel: getXpToNextLevel(startingLevel),
      xpProgress: 0,
    });
  }

  /**
   * Remove um jogador
   */
  unregisterPlayer(id: string): void {
    this.players.delete(id);
  }

  // ==========================================
  // XP OPERATIONS
  // ==========================================

  /**
   * Adiciona XP a um jogador e processa level ups
   * @returns Número de levels ganhos
   */
  addXp(playerId: string, amount: number, type: XpEvent['type'], sourceId?: string): number {
    const player = this.players.get(playerId);
    if (!player) return 0;
    if (player.level >= MAX_LEVEL) return 0;

    // Processar ganho de XP
    const result = processXpGain(player.currentXp, player.level, amount);

    // Atualizar estado
    player.currentXp = result.remainingXp;
    player.level = result.newLevel;
    player.xpToNextLevel = getXpToNextLevel(result.newLevel);

    // Atualizar progresso
    const progress = getXpProgress(player.currentXp, player.level);
    player.xpProgress = progress.percent;

    // Criar evento
    const event: XpEvent = {
      type,
      amount,
      playerId,
      sourceId,
      timestamp: Date.now(),
    };

    this.xpEvents.push(event);
    this.onXpGain?.(playerId, amount, event);

    // Notificar level ups
    if (result.levelsGained > 0) {
      this.onLevelUp?.(playerId, result.newLevel);
    }

    return result.levelsGained;
  }

  // ==========================================
  // KILL / ASSIST XP
  // ==========================================

  /**
   * Processa kill e distribui XP
   */
  processKill(
    killerId: string,
    victimId: string,
    assisters: string[] = []
  ): void {
    const killer = this.players.get(killerId);
    const victim = this.players.get(victimId);

    if (!killer || !victim) return;

    // XP de kill
    const killXp = calculateKillXp(victim.level, killer.level);
    this.addXp(killerId, killXp, 'kill', victimId);

    // XP de assist
    assisters.forEach(assisterId => {
      if (assisterId !== killerId) {
        const assister = this.players.get(assisterId);
        if (assister) {
          const assistXp = calculateAssistXp(victim.level, assister.level);
          this.addXp(assisterId, assistXp, 'assist', victimId);
        }
      }
    });
  }

  // ==========================================
  // MINION XP
  // ==========================================

  /**
   * Processa kill de minion com XP sharing
   * @param nearbyChampions - IDs de champions aliados no range de XP share
   */
  processMinionKill(
    minionType: MinionType,
    minionPosition: Position,
    getPlayerPositions: () => Map<string, { position: Position; team: Team }>
  ): void {
    const baseXp = getMinionXp(minionType);
    const playerPositions = getPlayerPositions();

    // Agrupar por time
    const bluePlayersInRange: string[] = [];
    const redPlayersInRange: string[] = [];

    playerPositions.forEach(({ position, team }, playerId) => {
      const dist = Math.sqrt(distanceSquared(minionPosition, position));
      if (dist <= XP_SHARE_RANGE) {
        if (team === 'blue') {
          bluePlayersInRange.push(playerId);
        } else {
          redPlayersInRange.push(playerId);
        }
      }
    });

    // Distribuir XP para cada time no range
    [bluePlayersInRange, redPlayersInRange].forEach(playersInRange => {
      if (playersInRange.length === 0) return;

      const sharedXp = calculateSharedXp(baseXp, playersInRange.length);

      playersInRange.forEach(playerId => {
        this.addXp(playerId, sharedXp, 'minion');
      });
    });
  }

  /**
   * Versão simplificada para quando só um jogador pega o XP
   */
  processMinionKillSolo(playerId: string, minionType: MinionType): void {
    const xp = getMinionXp(minionType);
    this.addXp(playerId, xp, 'minion');
  }

  // ==========================================
  // PASSIVE XP (ARAM)
  // ==========================================

  /**
   * Atualiza XP passivo (ARAM)
   * Chamar a cada frame
   */
  update(deltaTimeMs: number): void {
    if (!this.isARAM) return;

    // Acumular tempo
    this.passiveXpAccumulator += deltaTimeMs;

    // Processar XP a cada segundo
    while (this.passiveXpAccumulator >= 1000) {
      this.passiveXpAccumulator -= 1000;

      // Dar XP passivo para todos os jogadores
      this.players.forEach((player) => {
        this.addXp(player.id, ARAM_PASSIVE_XP_PER_SECOND, 'passive');
      });
    }
  }

  // ==========================================
  // QUERIES
  // ==========================================

  /**
   * Retorna estado de XP de um jogador
   */
  getPlayerState(playerId: string): PlayerXpState | undefined {
    const player = this.players.get(playerId);
    return player ? { ...player } : undefined;
  }

  /**
   * Retorna level de um jogador
   */
  getLevel(playerId: string): number {
    return this.players.get(playerId)?.level ?? DEFAULT_ENTITY.LEVEL;
  }

  /**
   * Retorna XP atual de um jogador
   */
  getXp(playerId: string): number {
    return this.players.get(playerId)?.currentXp ?? 0;
  }

  /**
   * Retorna progresso para próximo level (0-100)
   */
  getXpProgress(playerId: string): number {
    return this.players.get(playerId)?.xpProgress ?? 0;
  }

  /**
   * Retorna level médio de um time
   */
  getTeamAverageLevel(team: Team): number {
    let total = 0;
    let count = 0;

    this.players.forEach(player => {
      if (player.team === team) {
        total += player.level;
        count++;
      }
    });

    return count > 0 ? total / count : 1;
  }

  /**
   * Retorna diferença de level entre times
   */
  getLevelDifference(): number {
    return this.getTeamAverageLevel('blue') - this.getTeamAverageLevel('red');
  }

  /**
   * Retorna histórico de eventos de XP
   */
  getXpEvents(since?: number): XpEvent[] {
    if (since === undefined) {
      return [...this.xpEvents];
    }
    return this.xpEvents.filter(e => e.timestamp >= since);
  }

  // ==========================================
  // CALLBACKS
  // ==========================================

  setOnXpGain(callback: (playerId: string, amount: number, event: XpEvent) => void): void {
    this.onXpGain = callback;
  }

  setOnLevelUp(callback: (playerId: string, newLevel: number) => void): void {
    this.onLevelUp = callback;
  }

  // ==========================================
  // RESET
  // ==========================================

  /**
   * Reseta sistema (novo jogo)
   */
  reset(startingLevel: number = 1): void {
    this.players.forEach(player => {
      player.level = startingLevel;
      player.currentXp = getXpForLevel(startingLevel);
      player.xpToNextLevel = getXpToNextLevel(startingLevel);
      player.xpProgress = 0;
    });

    this.passiveXpAccumulator = 0;
    this.xpEvents = [];
  }
}

// ==========================================
// SINGLETON INSTANCE
// ==========================================

let experienceSystemInstance: ExperienceSystem | null = null;

export function initializeExperienceSystem(isARAM: boolean = false): ExperienceSystem {
  experienceSystemInstance = new ExperienceSystem(isARAM);
  return experienceSystemInstance;
}

export function getExperienceSystem(): ExperienceSystem {
  if (!experienceSystemInstance) {
    experienceSystemInstance = new ExperienceSystem(false);
  }
  return experienceSystemInstance;
}
