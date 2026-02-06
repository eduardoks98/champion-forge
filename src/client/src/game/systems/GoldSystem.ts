// ==========================================
// GOLD SYSTEM - Sistema de gold com bounties
// ==========================================

import {
  getBaseKillGold,
  calculateShutdownValue,
  calculateAssistGold,
  getPassiveGoldPerTick,
  ARAM_PASSIVE_GOLD,
  SR_PASSIVE_GOLD,
  MINION_GOLD,
  getSiegeMinionGold,
  FIRST_BLOOD_BONUS,
  BountyState,
} from '../formulas/bountyFormulas';
import { Team } from '../data/gameTypes';
import { MinionType } from '../data/minionStats';

// ==========================================
// INTERFACES
// ==========================================

export interface PlayerGoldState {
  id: string;
  team: Team;
  gold: number;
  totalGoldEarned: number;
  bounty: BountyState;
  level: number;
}

export interface GoldEvent {
  type: 'kill' | 'assist' | 'minion' | 'structure' | 'passive';
  amount: number;
  playerId: string;
  sourceId?: string;
  timestamp: number;
}

// ==========================================
// GOLD SYSTEM
// ==========================================

export class GoldSystem {
  // Estado de gold de cada jogador
  private players: Map<string, PlayerGoldState> = new Map();

  // Configuração
  readonly isARAM: boolean;
  private passiveConfig: typeof SR_PASSIVE_GOLD;

  // Estado global
  private firstBloodClaimed: boolean = false;
  private passiveGoldAccumulator: number = 0;

  // Histórico de eventos
  private goldEvents: GoldEvent[] = [];

  // Callback quando gold muda
  private onGoldChange: ((playerId: string, gold: number, event: GoldEvent) => void) | null = null;

  constructor(isARAM: boolean = false) {
    this.isARAM = isARAM;
    this.passiveConfig = isARAM ? ARAM_PASSIVE_GOLD : SR_PASSIVE_GOLD;
  }

  // ==========================================
  // PLAYER MANAGEMENT
  // ==========================================

  /**
   * Registra um jogador no sistema
   */
  registerPlayer(id: string, team: Team, startingGold: number = 500): void {
    this.players.set(id, {
      id,
      team,
      gold: startingGold,
      totalGoldEarned: startingGold,
      bounty: {
        goldFromKills: 0,
        goldFromCS: 0,
        consecutiveKills: 0,
        currentBounty: 0,
      },
      level: 1,
    });
  }

  /**
   * Remove um jogador
   */
  unregisterPlayer(id: string): void {
    this.players.delete(id);
  }

  /**
   * Atualiza level do jogador (afeta kill gold)
   */
  updatePlayerLevel(id: string, level: number): void {
    const player = this.players.get(id);
    if (player) {
      player.level = level;
    }
  }

  // ==========================================
  // GOLD OPERATIONS
  // ==========================================

  /**
   * Adiciona gold a um jogador
   */
  addGold(playerId: string, amount: number, type: GoldEvent['type'], sourceId?: string): void {
    const player = this.players.get(playerId);
    if (!player) return;

    player.gold += amount;
    player.totalGoldEarned += amount;

    // Atualizar bounty baseado na fonte
    if (type === 'kill' || type === 'assist') {
      player.bounty.goldFromKills += amount;
    } else if (type === 'minion') {
      player.bounty.goldFromCS += amount;
    }

    // Criar evento
    const event: GoldEvent = {
      type,
      amount,
      playerId,
      sourceId,
      timestamp: Date.now(),
    };

    this.goldEvents.push(event);
    this.onGoldChange?.(playerId, player.gold, event);
  }

  /**
   * Remove gold de um jogador (compra de item)
   */
  spendGold(playerId: string, amount: number): boolean {
    const player = this.players.get(playerId);
    if (!player || player.gold < amount) return false;

    player.gold -= amount;
    return true;
  }

  /**
   * Retorna gold atual de um jogador
   */
  getGold(playerId: string): number {
    return this.players.get(playerId)?.gold || 0;
  }

  // ==========================================
  // KILL / ASSIST GOLD
  // ==========================================

  /**
   * Processa kill e distribui gold
   * @returns Gold dado ao killer
   */
  processKill(
    killerId: string,
    victimId: string,
    assisters: string[] = []
  ): number {
    const killer = this.players.get(killerId);
    const victim = this.players.get(victimId);

    if (!killer || !victim) return 0;

    // Calcular gold base
    let killGold = getBaseKillGold(victim.level);

    // First blood
    if (!this.firstBloodClaimed) {
      killGold += FIRST_BLOOD_BONUS;
      this.firstBloodClaimed = true;
    }

    // Shutdown bonus
    const shutdownValue = calculateShutdownValue(victim.bounty);
    killGold += shutdownValue;

    // Dar gold ao killer
    this.addGold(killerId, killGold, 'kill', victimId);

    // Atualizar kill streak do killer
    killer.bounty.consecutiveKills++;

    // Distribuir assist gold
    if (assisters.length > 0) {
      const assistGold = calculateAssistGold(shutdownValue, getBaseKillGold(victim.level), assisters.length);

      assisters.forEach(assisterId => {
        if (assisterId !== killerId) {
          this.addGold(assisterId, assistGold, 'assist', victimId);
        }
      });
    }

    // Resetar bounty da vítima
    this.resetBounty(victimId);

    return killGold;
  }

  /**
   * Reseta bounty quando jogador morre
   */
  private resetBounty(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;

    player.bounty = {
      goldFromKills: 0,
      goldFromCS: 0,
      consecutiveKills: 0,
      currentBounty: 0,
    };
  }

  // ==========================================
  // MINION / STRUCTURE GOLD
  // ==========================================

  /**
   * Processa kill de minion
   */
  processMinionKill(playerId: string, minionType: MinionType, gameTimeMs: number): number {
    let gold: number;

    if (minionType === 'siege') {
      gold = getSiegeMinionGold(gameTimeMs);
    } else {
      gold = MINION_GOLD[minionType];
    }

    this.addGold(playerId, gold, 'minion');
    return gold;
  }

  /**
   * Processa destruição de estrutura
   */
  processStructureKill(
    destroyerId: string,
    structureType: 'tower' | 'inhibitor' | 'nexus',
    alliedPlayerIds: string[]
  ): void {
    // Torre: gold dividido (local + global)
    if (structureType === 'tower') {
      const localGold = 250;
      const globalGold = 300;

      // Quem destruiu recebe gold local
      this.addGold(destroyerId, localGold, 'structure');

      // Todos os aliados recebem gold global (dividido)
      const perPlayer = Math.floor(globalGold / alliedPlayerIds.length);
      alliedPlayerIds.forEach(playerId => {
        this.addGold(playerId, perPlayer, 'structure');
      });
    }
  }

  // ==========================================
  // PASSIVE GOLD
  // ==========================================

  /**
   * Atualiza gold passivo
   * Chamar a cada frame
   */
  update(deltaTimeMs: number, gameTimeMs: number): void {
    // Só gerar gold passivo após o tempo inicial
    if (gameTimeMs < this.passiveConfig.startTime) return;

    // Acumular tempo
    this.passiveGoldAccumulator += deltaTimeMs;

    // Processar ticks de gold
    while (this.passiveGoldAccumulator >= this.passiveConfig.tickInterval) {
      this.passiveGoldAccumulator -= this.passiveConfig.tickInterval;

      // Dar gold passivo para todos os jogadores
      const goldPerTick = getPassiveGoldPerTick(this.passiveConfig);

      this.players.forEach((player) => {
        this.addGold(player.id, goldPerTick, 'passive');
      });
    }
  }

  // ==========================================
  // QUERIES
  // ==========================================

  /**
   * Retorna estado de gold de um jogador
   */
  getPlayerState(playerId: string): PlayerGoldState | undefined {
    const player = this.players.get(playerId);
    return player ? { ...player } : undefined;
  }

  /**
   * Retorna bounty atual de um jogador
   */
  getBounty(playerId: string): number {
    const player = this.players.get(playerId);
    if (!player) return 0;

    return calculateShutdownValue(player.bounty);
  }

  /**
   * Retorna kill streak de um jogador
   */
  getKillStreak(playerId: string): number {
    return this.players.get(playerId)?.bounty.consecutiveKills || 0;
  }

  /**
   * Retorna total de gold ganho por um jogador
   */
  getTotalGoldEarned(playerId: string): number {
    return this.players.get(playerId)?.totalGoldEarned || 0;
  }

  /**
   * Retorna gold total do time
   */
  getTeamGold(team: Team): number {
    let total = 0;
    this.players.forEach(player => {
      if (player.team === team) {
        total += player.gold;
      }
    });
    return total;
  }

  /**
   * Retorna diferença de gold entre times
   */
  getGoldDifference(): number {
    const blueGold = this.getTeamGold('blue');
    const redGold = this.getTeamGold('red');
    return blueGold - redGold;
  }

  /**
   * Retorna histórico de eventos de gold
   */
  getGoldEvents(since?: number): GoldEvent[] {
    if (since === undefined) {
      return [...this.goldEvents];
    }
    return this.goldEvents.filter(e => e.timestamp >= since);
  }

  // ==========================================
  // CALLBACKS
  // ==========================================

  setOnGoldChange(callback: (playerId: string, gold: number, event: GoldEvent) => void): void {
    this.onGoldChange = callback;
  }

  // ==========================================
  // RESET
  // ==========================================

  /**
   * Reseta sistema (novo jogo)
   */
  reset(startingGold: number = 500): void {
    this.players.forEach(player => {
      player.gold = startingGold;
      player.totalGoldEarned = startingGold;
      player.bounty = {
        goldFromKills: 0,
        goldFromCS: 0,
        consecutiveKills: 0,
        currentBounty: 0,
      };
    });

    this.firstBloodClaimed = false;
    this.passiveGoldAccumulator = 0;
    this.goldEvents = [];
  }
}

// ==========================================
// SINGLETON INSTANCE
// ==========================================

let goldSystemInstance: GoldSystem | null = null;

export function initializeGoldSystem(isARAM: boolean = false): GoldSystem {
  goldSystemInstance = new GoldSystem(isARAM);
  return goldSystemInstance;
}

export function getGoldSystem(): GoldSystem {
  if (!goldSystemInstance) {
    goldSystemInstance = new GoldSystem(false);
  }
  return goldSystemInstance;
}
