// ==========================================
// RESPAWN SYSTEM - Sistema de respawn com timers
// ==========================================

import {
  processDeath,
  canRespawn,
  getRemainingRespawnTime,
  getRespawnProgress,
  formatRespawnTime,
  RespawnState,
  hasSpawnProtection,
} from '../formulas/respawnFormulas';
import { Team, Position } from '../data/gameTypes';

// ==========================================
// INTERFACES
// ==========================================

export interface PlayerRespawnState extends RespawnState {
  id: string;
  team: Team;
  spawnPosition: Position;
  hasSpawnProtection: boolean;
}

export interface RespawnEvent {
  type: 'death' | 'respawn';
  playerId: string;
  position?: Position;
  timestamp: number;
}

// ==========================================
// RESPAWN SYSTEM
// ==========================================

export class RespawnSystem {
  // Estado de respawn de cada jogador
  private players: Map<string, PlayerRespawnState> = new Map();

  // Configuração
  private isARAM: boolean;

  // Spawn positions por time
  private spawnPositions: Map<Team, Position> = new Map();

  // Histórico de eventos
  private respawnEvents: RespawnEvent[] = [];

  // Callbacks
  private onDeath: ((playerId: string, respawnTimeMs: number) => void) | null = null;
  private onRespawn: ((playerId: string, position: Position) => void) | null = null;

  constructor(isARAM: boolean = false) {
    this.isARAM = isARAM;
  }

  // ==========================================
  // CONFIGURATION
  // ==========================================

  /**
   * Define posição de spawn para um time
   */
  setSpawnPosition(team: Team, position: Position): void {
    this.spawnPositions.set(team, position);
  }

  /**
   * Retorna posição de spawn de um time
   */
  getSpawnPosition(team: Team): Position | undefined {
    return this.spawnPositions.get(team);
  }

  // ==========================================
  // PLAYER MANAGEMENT
  // ==========================================

  /**
   * Registra um jogador no sistema
   */
  registerPlayer(id: string, team: Team, spawnPosition?: Position): void {
    const spawn = spawnPosition || this.spawnPositions.get(team) || { x: 0, y: 0 };

    this.players.set(id, {
      id,
      team,
      isDead: false,
      deathTime: 0,
      respawnTime: 0,
      respawnDuration: 0,
      spawnPosition: spawn,
      hasSpawnProtection: false,
    });
  }

  /**
   * Remove um jogador
   */
  unregisterPlayer(id: string): void {
    this.players.delete(id);
  }

  /**
   * Atualiza posição de spawn de um jogador
   */
  updateSpawnPosition(playerId: string, position: Position): void {
    const player = this.players.get(playerId);
    if (player) {
      player.spawnPosition = position;
    }
  }

  // ==========================================
  // DEATH / RESPAWN
  // ==========================================

  /**
   * Processa morte de um jogador
   * @returns Tempo de respawn em ms
   */
  processDeath(
    playerId: string,
    level: number,
    currentTimeMs: number,
    gameTimeMs: number
  ): number {
    const player = this.players.get(playerId);
    if (!player || player.isDead) return 0;

    // Calcular tempo de respawn
    const gameMinutes = gameTimeMs / 60_000;
    const respawnState = processDeath(currentTimeMs, level, gameMinutes, this.isARAM);

    // Atualizar estado
    player.isDead = true;
    player.deathTime = respawnState.deathTime;
    player.respawnTime = respawnState.respawnTime;
    player.respawnDuration = respawnState.respawnDuration;
    player.hasSpawnProtection = false;

    // Criar evento
    this.respawnEvents.push({
      type: 'death',
      playerId,
      timestamp: currentTimeMs,
    });

    this.onDeath?.(playerId, respawnState.respawnDuration);

    return respawnState.respawnDuration;
  }

  /**
   * Verifica e processa respawns
   * Chamar a cada frame
   * @returns IDs dos jogadores que respawnaram
   */
  update(currentTimeMs: number): string[] {
    const respawned: string[] = [];

    this.players.forEach((player) => {
      if (player.isDead && canRespawn(player, currentTimeMs)) {
        // Respawnar
        player.isDead = false;
        player.hasSpawnProtection = true;

        respawned.push(player.id);

        // Criar evento
        this.respawnEvents.push({
          type: 'respawn',
          playerId: player.id,
          position: player.spawnPosition,
          timestamp: currentTimeMs,
        });

        this.onRespawn?.(player.id, player.spawnPosition);
      }

      // Verificar expiração de spawn protection
      if (player.hasSpawnProtection && !player.isDead) {
        if (!hasSpawnProtection(player.respawnTime, currentTimeMs)) {
          player.hasSpawnProtection = false;
        }
      }
    });

    return respawned;
  }

  /**
   * Força respawn imediato (para debug/testes)
   */
  forceRespawn(playerId: string, currentTimeMs: number): boolean {
    const player = this.players.get(playerId);
    if (!player || !player.isDead) return false;

    player.isDead = false;
    player.hasSpawnProtection = true;

    this.respawnEvents.push({
      type: 'respawn',
      playerId,
      position: player.spawnPosition,
      timestamp: currentTimeMs,
    });

    this.onRespawn?.(playerId, player.spawnPosition);
    return true;
  }

  // ==========================================
  // QUERIES
  // ==========================================

  /**
   * Verifica se jogador está morto
   */
  isDead(playerId: string): boolean {
    return this.players.get(playerId)?.isDead || false;
  }

  /**
   * Retorna tempo restante de respawn
   */
  getRemainingRespawnTime(playerId: string, currentTimeMs: number): number {
    const player = this.players.get(playerId);
    if (!player) return 0;
    return getRemainingRespawnTime(player, currentTimeMs);
  }

  /**
   * Retorna tempo restante formatado (para UI)
   */
  getRemainingRespawnTimeFormatted(playerId: string, currentTimeMs: number): string {
    const remaining = this.getRemainingRespawnTime(playerId, currentTimeMs);
    return formatRespawnTime(remaining);
  }

  /**
   * Retorna progresso do respawn (0-1)
   */
  getRespawnProgress(playerId: string, currentTimeMs: number): number {
    const player = this.players.get(playerId);
    if (!player) return 1;
    return getRespawnProgress(player, currentTimeMs);
  }

  /**
   * Verifica se jogador tem spawn protection
   */
  hasSpawnProtection(playerId: string): boolean {
    return this.players.get(playerId)?.hasSpawnProtection || false;
  }

  /**
   * Retorna posição de spawn de um jogador
   */
  getPlayerSpawnPosition(playerId: string): Position | undefined {
    return this.players.get(playerId)?.spawnPosition;
  }

  /**
   * Retorna estado completo de um jogador
   */
  getPlayerState(playerId: string): PlayerRespawnState | undefined {
    const player = this.players.get(playerId);
    return player ? { ...player } : undefined;
  }

  /**
   * Retorna IDs de todos os jogadores mortos
   */
  getDeadPlayers(): string[] {
    const dead: string[] = [];
    this.players.forEach((player) => {
      if (player.isDead) {
        dead.push(player.id);
      }
    });
    return dead;
  }

  /**
   * Retorna IDs de jogadores mortos de um time
   */
  getDeadPlayersForTeam(team: Team): string[] {
    const dead: string[] = [];
    this.players.forEach((player) => {
      if (player.isDead && player.team === team) {
        dead.push(player.id);
      }
    });
    return dead;
  }

  /**
   * Conta jogadores vivos de um time
   */
  getAliveCountForTeam(team: Team): number {
    let count = 0;
    this.players.forEach((player) => {
      if (!player.isDead && player.team === team) {
        count++;
      }
    });
    return count;
  }

  /**
   * Retorna histórico de eventos de respawn
   */
  getRespawnEvents(since?: number): RespawnEvent[] {
    if (since === undefined) {
      return [...this.respawnEvents];
    }
    return this.respawnEvents.filter(e => e.timestamp >= since);
  }

  // ==========================================
  // CALLBACKS
  // ==========================================

  setOnDeath(callback: (playerId: string, respawnTimeMs: number) => void): void {
    this.onDeath = callback;
  }

  setOnRespawn(callback: (playerId: string, position: Position) => void): void {
    this.onRespawn = callback;
  }

  // ==========================================
  // RESET
  // ==========================================

  /**
   * Reseta sistema (novo jogo)
   */
  reset(): void {
    this.players.forEach(player => {
      player.isDead = false;
      player.deathTime = 0;
      player.respawnTime = 0;
      player.respawnDuration = 0;
      player.hasSpawnProtection = false;
    });

    this.respawnEvents = [];
  }

  /**
   * Respawna todos os jogadores imediatamente
   */
  respawnAll(currentTimeMs: number): void {
    this.players.forEach((player) => {
      if (player.isDead) {
        this.forceRespawn(player.id, currentTimeMs);
      }
    });
  }
}

// ==========================================
// SINGLETON INSTANCE
// ==========================================

let respawnSystemInstance: RespawnSystem | null = null;

export function initializeRespawnSystem(isARAM: boolean = false): RespawnSystem {
  respawnSystemInstance = new RespawnSystem(isARAM);
  return respawnSystemInstance;
}

export function getRespawnSystem(): RespawnSystem {
  if (!respawnSystemInstance) {
    respawnSystemInstance = new RespawnSystem(false);
  }
  return respawnSystemInstance;
}
