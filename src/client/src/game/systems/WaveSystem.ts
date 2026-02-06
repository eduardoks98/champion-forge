import { Minion, MinionTeam } from '../entities/Minion';
import { SIZES } from '../constants/timing';

export interface WaveConfig {
  waveInterval: number;      // ms entre waves
  minionsPerWave: number;    // minions por wave
  minionSpacing: number;     // espaçamento entre minions
}

const DEFAULT_CONFIG: WaveConfig = {
  waveInterval: 30000,       // 30 segundos
  minionsPerWave: 4,         // 4 minions por wave
  minionSpacing: 50,         // 50px entre minions
};

export class WaveSystem {
  private config: WaveConfig;
  private waveTimer: number = 0;
  private waveCount: number = 0;
  private minionIdCounter: number = 0;

  // Minions ativos por time
  blueMinions: Minion[] = [];
  redMinions: Minion[] = [];

  constructor(config: Partial<WaveConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    // Spawna primeira wave imediatamente após 5 segundos
    this.waveTimer = this.config.waveInterval - 5000;
  }

  /**
   * Atualiza o sistema de waves
   */
  update(deltaTime: number): void {
    this.waveTimer += deltaTime;

    // Hora de spawnar uma nova wave?
    if (this.waveTimer >= this.config.waveInterval) {
      this.spawnWave();
      this.waveTimer = 0;
      this.waveCount++;
    }

    // Remover minions mortos
    this.cleanupDeadMinions();
  }

  /**
   * Spawna uma wave de minions para ambos os times
   */
  private spawnWave(): void {
    // Spawn wave azul
    const blueWave = this.createWave('blue');
    this.blueMinions.push(...blueWave);

    // Spawn wave vermelha
    const redWave = this.createWave('red');
    this.redMinions.push(...redWave);

    console.log(`[Wave ${this.waveCount + 1}] Spawned ${blueWave.length} blue and ${redWave.length} red minions`);
  }

  /**
   * Cria uma wave de minions para um time
   */
  private createWave(team: MinionTeam): Minion[] {
    const minions: Minion[] = [];
    const { minionsPerWave, minionSpacing } = this.config;

    // Posição base do spawn - Logo após as torres de cada time
    // Mapa: 4000px largura
    // Base azul: 0-300, Torre azul: 550
    // Base vermelha: 3700-4000, Torre vermelha: 3400
    // Ruinas centrais: ~2000
    //
    // Azul spawna em x=700 (após a torre azul em 550)
    // Vermelho spawna em x=3300 (antes da torre vermelha em 3400)
    const baseX = team === 'blue' ? 700 : 3300;
    const baseY = SIZES.lane.centerY;

    console.log(`[WaveSystem] Spawning ${team} minion wave at x=${baseX}, y=${baseY}`);

    // Criar minions em formação
    for (let i = 0; i < minionsPerWave; i++) {
      // Formação em linha com variação Y
      const offsetX = team === 'blue' ? i * minionSpacing : -i * minionSpacing;
      const offsetY = (i % 2 === 0 ? -20 : 20);

      const minion = new Minion(
        baseX + offsetX,
        baseY + offsetY,
        `minion-${team}-${this.minionIdCounter++}`,
        team
      );

      minions.push(minion);
    }

    return minions;
  }

  /**
   * Remove minions mortos das listas
   */
  private cleanupDeadMinions(): void {
    // Usar filter para manter apenas minions vivos (ou em animação de morte)
    this.blueMinions = this.blueMinions.filter(m => !m.shouldRemove());
    this.redMinions = this.redMinions.filter(m => !m.shouldRemove());
  }

  /**
   * Retorna todos os minions
   */
  getAllMinions(): Minion[] {
    return [...this.blueMinions, ...this.redMinions];
  }

  /**
   * Retorna minions inimigos de um time
   */
  getEnemyMinions(team: MinionTeam): Minion[] {
    return team === 'blue' ? this.redMinions : this.blueMinions;
  }

  /**
   * Retorna minions aliados de um time
   */
  getAlliedMinions(team: MinionTeam): Minion[] {
    return team === 'blue' ? this.blueMinions : this.redMinions;
  }

  /**
   * Processa ataque de minion em outro minion
   */
  processMinionAttack(attacker: Minion, target: Minion): void {
    target.takeDamage(attacker.getAttackDamage());
  }

  /**
   * Reseta o sistema de waves
   */
  reset(): void {
    this.waveTimer = this.config.waveInterval - 5000; // Próxima wave em 5s
    this.waveCount = 0;
    this.blueMinions = [];
    this.redMinions = [];
  }

  /**
   * Retorna estatísticas
   */
  getStats(): { blue: number; red: number; waveCount: number } {
    return {
      blue: this.blueMinions.length,
      red: this.redMinions.length,
      waveCount: this.waveCount,
    };
  }
}
