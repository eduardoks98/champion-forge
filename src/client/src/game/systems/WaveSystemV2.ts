// ==========================================
// WAVE SYSTEM V2 - Usando MinionV2 e fórmulas oficiais
// ==========================================

import { MinionV2 } from '../entities/MinionV2';
import { Team } from '../data/gameTypes';
import { MinionType, SR_WAVE_CONFIG, getWaveComposition, WaveComposition } from '../data/minionStats';
import { PathfindingGrid } from '../components/MovementComponent';
import { SIZES } from '../constants/timing';

// ==========================================
// INTERFACES
// ==========================================

export interface WaveSystemConfig {
  gameMode: 'sr' | 'aram';
  waveInterval?: number;
  firstWaveTime?: number;
}

// ==========================================
// WAVE SYSTEM V2
// ==========================================

export class WaveSystemV2 {
  private isARAM: boolean;
  private waveInterval: number;
  private firstWaveTime: number;
  private gameTime: number = 0;
  private waveTimer: number = 0;
  private waveCount: number = 0;
  private minionIdCounter: number = 0;

  // Referência ao pathfinding grid
  private pathfindingGrid: PathfindingGrid | null = null;

  // Minions ativos por time
  blueMinions: MinionV2[] = [];
  redMinions: MinionV2[] = [];

  // Callbacks
  private onWaveSpawn?: (waveNumber: number, blueMinions: MinionV2[], redMinions: MinionV2[]) => void;
  private onMinionDeath?: (minion: MinionV2, wasLastHitByPlayer: boolean) => void;

  constructor(config: WaveSystemConfig) {
    this.isARAM = config.gameMode === 'aram';

    // Use defaults from SR_WAVE_CONFIG
    this.waveInterval = config.waveInterval ?? SR_WAVE_CONFIG.waveInterval;
    this.firstWaveTime = config.firstWaveTime ?? SR_WAVE_CONFIG.firstWaveTime;

    // Timer inicial
    this.waveTimer = 0;
  }

  // ==========================================
  // SETUP
  // ==========================================

  setPathfindingGrid(grid: PathfindingGrid): void {
    this.pathfindingGrid = grid;

    // Atualizar minions existentes
    for (const minion of this.getAllMinions()) {
      minion.setPathfindingGrid(grid);
    }
  }

  setOnWaveSpawn(callback: (waveNumber: number, blueMinions: MinionV2[], redMinions: MinionV2[]) => void): void {
    this.onWaveSpawn = callback;
  }

  setOnMinionDeath(callback: (minion: MinionV2, wasLastHitByPlayer: boolean) => void): void {
    this.onMinionDeath = callback;
  }

  // ==========================================
  // UPDATE
  // ==========================================

  update(deltaTime: number): void {
    this.gameTime += deltaTime;
    this.waveTimer += deltaTime;

    // Verificar spawn de wave
    if (this.shouldSpawnWave()) {
      this.spawnWave();
      this.waveTimer = 0;
      this.waveCount++;
    }

    // Atualizar minions
    this.updateMinions(deltaTime);

    // Cleanup
    this.cleanupDeadMinions();
  }

  private shouldSpawnWave(): boolean {
    // Primeira wave
    if (this.waveCount === 0) {
      return this.gameTime >= this.firstWaveTime;
    }

    // Waves subsequentes
    return this.waveTimer >= this.waveInterval;
  }

  private updateMinions(deltaTime: number): void {
    // Atualizar minions azuis
    for (const minion of this.blueMinions) {
      if (minion.isDead) continue;

      minion.update(deltaTime);

      // AI: Encontrar alvos e atacar
      const enemies = this.getEnemyTargetsAsTargetable('blue');
      const nexusPos = this.getEnemyNexusPosition('blue');
      minion.updateAI(enemies, nexusPos, deltaTime);
    }

    // Atualizar minions vermelhos
    for (const minion of this.redMinions) {
      if (minion.isDead) continue;

      minion.update(deltaTime);

      // AI: Encontrar alvos e atacar
      const enemies = this.getEnemyTargetsAsTargetable('red');
      const nexusPos = this.getEnemyNexusPosition('red');
      minion.updateAI(enemies, nexusPos, deltaTime);
    }
  }

  // ==========================================
  // WAVE SPAWNING
  // ==========================================

  private spawnWave(): void {
    const composition = getWaveComposition(this.waveCount + 1, this.gameTime, this.isARAM);

    // Spawn wave azul
    const blueWave = this.createWave('blue', composition);
    this.blueMinions.push(...blueWave);

    // Spawn wave vermelha
    const redWave = this.createWave('red', composition);
    this.redMinions.push(...redWave);

    console.log(`[Wave ${this.waveCount + 1}] Spawned ${blueWave.length} blue and ${redWave.length} red minions`);

    // Callback
    this.onWaveSpawn?.(this.waveCount + 1, blueWave, redWave);
  }

  private createWave(team: Team, composition: WaveComposition): MinionV2[] {
    const minions: MinionV2[] = [];

    // Posição base do spawn
    const baseX = team === 'blue' ? 700 : 3300;
    const baseY = SIZES.lane.centerY;

    let offsetIndex = 0;
    const spacing = 50;

    // Criar melee minions
    for (let i = 0; i < composition.melee; i++) {
      const minion = this.createMinion(team, 'melee', baseX, baseY, offsetIndex, spacing);
      minions.push(minion);
      offsetIndex++;
    }

    // Criar caster minions (atrás dos melee)
    for (let i = 0; i < composition.caster; i++) {
      const minion = this.createMinion(team, 'caster', baseX, baseY, offsetIndex, spacing);
      minions.push(minion);
      offsetIndex++;
    }

    // Criar siege minion (se houver)
    if (composition.siege) {
      const minion = this.createMinion(team, 'siege', baseX, baseY, offsetIndex, spacing);
      minions.push(minion);
      offsetIndex++;
    }

    // Criar super minion (se houver)
    if (composition.super) {
      const minion = this.createMinion(team, 'super', baseX, baseY, offsetIndex, spacing);
      minions.push(minion);
    }

    return minions;
  }

  private createMinion(
    team: Team,
    type: MinionType,
    baseX: number,
    baseY: number,
    offsetIndex: number,
    spacing: number
  ): MinionV2 {
    // Calcular posição com offset
    const direction = team === 'blue' ? 1 : -1;
    const offsetX = offsetIndex * spacing * direction;
    const offsetY = (offsetIndex % 2 === 0 ? -20 : 20);

    const minion = new MinionV2(
      baseX + offsetX,
      baseY + offsetY,
      team,
      type,
      this.gameTime
    );

    // Configurar pathfinding
    if (this.pathfindingGrid) {
      minion.setPathfindingGrid(this.pathfindingGrid);
    }

    this.minionIdCounter++;

    return minion;
  }

  // ==========================================
  // HELPERS
  // ==========================================

  private getEnemyTargetsAsTargetable(team: Team): MinionV2[] {
    // Retorna minions inimigos como alvos
    return team === 'blue' ? this.redMinions.filter(m => !m.isDead) : this.blueMinions.filter(m => !m.isDead);
  }

  private getEnemyNexusPosition(team: Team): { x: number; y: number } | null {
    // Posição do Nexus inimigo
    if (team === 'blue') {
      return { x: SIZES.arena.width - 180 + 50, y: SIZES.lane.centerY };
    } else {
      return { x: 100 + 40, y: SIZES.lane.centerY };
    }
  }

  private cleanupDeadMinions(): void {
    // Callback para minions que morreram
    for (const minion of [...this.blueMinions, ...this.redMinions]) {
      if (minion.isDead && minion.shouldRemove()) {
        this.onMinionDeath?.(minion, minion.wasLastHitByPlayer());
      }
    }

    // Remover minions mortos
    this.blueMinions = this.blueMinions.filter(m => !m.shouldRemove());
    this.redMinions = this.redMinions.filter(m => !m.shouldRemove());
  }

  // ==========================================
  // QUERIES
  // ==========================================

  getAllMinions(): MinionV2[] {
    return [...this.blueMinions, ...this.redMinions];
  }

  getEnemyMinions(team: Team): MinionV2[] {
    return team === 'blue' ? this.redMinions : this.blueMinions;
  }

  getAlliedMinions(team: Team): MinionV2[] {
    return team === 'blue' ? this.blueMinions : this.redMinions;
  }

  getStats(): { blue: number; red: number; waveCount: number; gameTime: number } {
    return {
      blue: this.blueMinions.length,
      red: this.redMinions.length,
      waveCount: this.waveCount,
      gameTime: this.gameTime,
    };
  }

  // ==========================================
  // RESET
  // ==========================================

  reset(): void {
    this.gameTime = 0;
    this.waveTimer = 0;
    this.waveCount = 0;
    this.blueMinions = [];
    this.redMinions = [];
  }
}

// ==========================================
// FACTORY
// ==========================================

let waveSystemInstance: WaveSystemV2 | null = null;

export function initializeWaveSystemV2(config: WaveSystemConfig): WaveSystemV2 {
  waveSystemInstance = new WaveSystemV2(config);
  return waveSystemInstance;
}

export function getWaveSystemV2(): WaveSystemV2 | null {
  return waveSystemInstance;
}
