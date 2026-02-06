import { COLORS } from '../constants/colors';
import { SIZES, DAMAGE, RANGES, TIMING, STATUS_VALUES } from '../constants/timing';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile, ProjectileType } from '../entities/Projectile';
import { ParticleSystem } from '../systems/ParticleSystem';
import { DamageNumberSystem } from '../systems/DamageNumberSystem';
import { EffectSystem } from '../systems/EffectSystem';
import { StatusEffectSystem } from '../systems/StatusEffectSystem';
import { InputManager } from './InputManager';
import { LoadoutManager, AbilitySlot, FullLoadout } from '../data/loadout';
import { getAbility, requiresTarget } from '../data/abilities';
import { CharacterManager } from '../data/character';

// Performance systems
import { initializePools, getPoolStats } from '../systems/ObjectPool';
import { SpatialGrid, SpatialEntity } from '../systems/SpatialGrid';
import { ViewportCulling } from '../systems/ViewportCulling';
import { CollisionSystem, initializeCollisionSystem, CollisionLayers } from '../systems/CollisionSystem';
import { PathfindingGrid, initializePathfindingGrid } from '../systems/PathfindingGrid';
import { GameMap, initializeGameMap } from '../world/GameMap';
import { Camera } from './Camera';
import { WaveSystem } from '../systems/WaveSystem';
import { Minion } from '../entities/Minion';
import { Structure, StructureTeam } from '../entities/Structure';
import { PlayerProgressionSystem, initializeProgressionSystem } from '../systems/PlayerProgressionSystem';

export interface GameStats {
  fps: number;
  entities: number;
  particles: number;
  statusEffects: number;
  // Performance stats
  visibleEntities?: number;
  gridCells?: number;
  poolStats?: ReturnType<typeof getPoolStats>;
  // Minion stats
  blueMinions?: number;
  redMinions?: number;
  waveCount?: number;
}

// Game state enum
export type GameState = 'playing' | 'victory' | 'defeat';

// Game end callback
export type OnGameEndCallback = (state: 'victory' | 'defeat') => void;

// ==========================================
// FIXED TIMESTEP - Física consistente independente de FPS
// ==========================================
// Isso garante que:
// 1. A física roda EXATAMENTE 60 vezes por segundo
// 2. Não importa se o cliente tem 30 FPS ou 144 FPS
// 3. Jogadores não podem exploitar lag para ganhar vantagem
// 4. Multiplayer fica sincronizado (todos calculam igual)
// ==========================================

const FIXED_TIMESTEP = 1000 / 60; // 16.67ms = 60 updates por segundo
const MAX_FRAME_TIME = 250; // Máximo de tempo acumulado (evita spiral of death)

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private running: boolean = false;
  private lastTime: number = 0;
  private frameCount: number = 0;
  private lastFpsTime: number = 0;
  private currentFps: number = 60;

  // Fixed Timestep
  private accumulator: number = 0; // Tempo acumulado para processar

  // Entidades
  private player: Player;
  private enemies: Enemy[] = [];
  private enemyMap: Map<string, Enemy> = new Map(); // OTIMIZAÇÃO: lookup O(1)
  private projectiles: Projectile[] = [];

  // Sistemas
  private particles: ParticleSystem;
  private damageNumbers: DamageNumberSystem;
  private effects: EffectSystem;
  private statusEffects: StatusEffectSystem;
  private input: InputManager;

  // Performance systems
  private spatialGrid: SpatialGrid<SpatialEntity>;
  private viewport: ViewportCulling;
  private collisionSystem: CollisionSystem;
  private pathfindingGrid: PathfindingGrid;
  private gameMap: GameMap;

  // Camera system
  private camera: Camera;

  // Wave/Minion system
  private waveSystem: WaveSystem;

  // Structures (Nexus, Towers)
  private structures: Structure[] = [];

  // Player progression (Gold, XP, Level)
  private progression: PlayerProgressionSystem;

  // Meteor pending (for delayed cast)
  private pendingMeteor: { x: number; y: number; timer: number } | null = null;

  // Loadout system
  private loadout: LoadoutManager;

  // Character state (persistent)
  private characterManager: CharacterManager;

  // Contadores
  private enemyIdCounter: number = 0;
  private projectileIdCounter: number = 0;

  // Targeting system
  private currentTarget: Enemy | null = null;
  private hoveredEnemy: Enemy | null = null;

  // Minion targeting (para last hit)
  private currentMinionTarget: Minion | null = null;

  // Debug mode
  private debugMode: boolean = false;

  // Pause/Menu state
  private isPaused: boolean = false;
  private showMenu: boolean = false;

  // Game state (victory/defeat)
  private gameState: GameState = 'playing';

  // Respawn system
  private playerRespawnTimer: number = 0;
  private isPlayerDead: boolean = false;

  // Tower aggro tracking
  private playerAggroedTower: boolean = false; // Player atacou algo perto de torre inimiga

  // Callback para atualizar stats na UI
  onStatsUpdate?: (stats: GameStats) => void;

  // Callback para mudança de estado do menu
  onMenuStateChange?: (showMenu: boolean) => void;

  // Callback para fim de jogo
  onGameEnd?: OnGameEndCallback;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;

    // Inicializar pools de objetos (CRÍTICO para performance)
    initializePools();

    // Inicializar sistemas
    this.particles = new ParticleSystem();
    this.damageNumbers = new DamageNumberSystem();
    this.effects = new EffectSystem();
    this.statusEffects = new StatusEffectSystem();
    this.input = new InputManager();
    this.input.attachCanvas(canvas);

    // Performance systems
    this.spatialGrid = new SpatialGrid(100, 2000, 2000); // 100px cells
    this.viewport = new ViewportCulling(canvas.width, canvas.height, 100);
    this.collisionSystem = initializeCollisionSystem(100, canvas.width, canvas.height);
    this.pathfindingGrid = initializePathfindingGrid(SIZES.arena.width, SIZES.arena.height, 32);
    this.gameMap = initializeGameMap();

    // Camera system - mundo maior que a viewport
    this.camera = new Camera({
      worldWidth: SIZES.arena.width,
      worldHeight: SIZES.arena.height,
      viewportWidth: canvas.width,
      viewportHeight: canvas.height,
    });

    // Wave system - spawna minions periodicamente
    this.waveSystem = new WaveSystem({
      waveInterval: 30000,   // 30 segundos entre waves
      minionsPerWave: 4,     // 4 minions por wave
    });

    // Player progression system
    this.progression = initializeProgressionSystem();

    // Criar estruturas (Nexus e Torres em cada base)
    const centerY = SIZES.lane.centerY;

    // Nexus azul - posicionado dentro da base azul
    this.structures.push(new Structure(100, centerY - 40, 'blue', 'nexus'));
    // Torre azul - entre a base e o centro do mapa
    this.structures.push(new Structure(550, centerY - 25, 'blue', 'tower'));

    // Nexus vermelho - posicionado dentro da base vermelha
    this.structures.push(new Structure(SIZES.arena.width - 180, centerY - 40, 'red', 'nexus'));
    // Torre vermelha - entre a base e o centro do mapa
    this.structures.push(new Structure(SIZES.arena.width - 600, centerY - 25, 'red', 'tower'));

    // Carregar estado do personagem (loadout + arma)
    this.characterManager = new CharacterManager();
    const characterState = this.characterManager.getState();

    // Inicializar loadout do CharacterManager
    this.loadout = new LoadoutManager(characterState.loadout);

    // Criar jogador com arma equipada - posição inicial no spawn azul
    const blueSpawn = this.gameMap.getBlueSpawn();
    this.player = new Player(blueSpawn.x, blueSpawn.y);
    this.player.setStatusEffectSystem(this.statusEffects);
    this.player.equipWeapon(characterState.equippedWeapon);

    // Centralizar câmera no player inicialmente
    this.camera.centerOn(this.player.centerX, this.player.centerY);
  }

  // Iniciar loop do jogo
  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.lastFpsTime = this.lastTime;
    this.gameLoop(this.lastTime);

    // Solicitar pointer lock após um pequeno delay (para permitir click do usuário)
    // O primeiro click no canvas vai ativar o pointer lock
    this.setupPointerLockOnClick();
  }

  // Configura pointer lock para ativar no click
  private setupPointerLockOnClick(): void {
    const handler = () => {
      if (!this.input.isPointerLocked() && !this.showMenu) {
        this.input.requestPointerLock();
      }
    };
    this.canvas.addEventListener('click', handler);
  }

  // Parar loop do jogo
  stop(): void {
    this.running = false;
    this.input.exitPointerLock();
  }

  // Toggle pause/menu
  toggleMenu(): void {
    this.showMenu = !this.showMenu;
    this.isPaused = this.showMenu;

    if (this.showMenu) {
      this.input.exitPointerLock();
    }

    if (this.onMenuStateChange) {
      this.onMenuStateChange(this.showMenu);
    }
  }

  // Fechar menu e retomar jogo
  resumeGame(): void {
    this.showMenu = false;
    this.isPaused = false;
    this.input.requestPointerLock();

    if (this.onMenuStateChange) {
      this.onMenuStateChange(false);
    }
  }

  // Verificar se está pausado
  isPausedState(): boolean {
    return this.isPaused;
  }

  // Loop principal com FIXED TIMESTEP
  // A física roda em intervalos fixos, independente do FPS
  private gameLoop = (currentTime: number): void => {
    if (!this.running) return;

    let frameTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Limitar frameTime para evitar "spiral of death"
    // (quando o jogo não consegue acompanhar, acumula cada vez mais)
    if (frameTime > MAX_FRAME_TIME) {
      frameTime = MAX_FRAME_TIME;
    }

    // FPS counter
    this.frameCount++;
    if (currentTime - this.lastFpsTime >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = currentTime;
    }

    // Input é processado uma vez por frame (antes da física)
    this.handleInput();

    // Se pausado, não processar física
    if (!this.isPaused) {
      // FIXED TIMESTEP: Acumular tempo e processar em passos fixos
      this.accumulator += frameTime;

      // Processar física em passos de FIXED_TIMESTEP (16.67ms)
      // Isso garante que a física seja IDÊNTICA em todos os clientes
      while (this.accumulator >= FIXED_TIMESTEP) {
        this.update(FIXED_TIMESTEP); // Sempre 16.67ms, nunca varia!
        this.accumulator -= FIXED_TIMESTEP;
      }
    }

    // Render é feito uma vez por frame (visual pode variar com FPS)
    this.render();

    // Atualizar stats
    if (this.onStatsUpdate) {
      const gridStats = this.spatialGrid.getStats();
      const waveStats = this.waveSystem.getStats();
      const allMinions = this.waveSystem.getAllMinions();
      this.onStatsUpdate({
        fps: this.currentFps,
        entities: 1 + this.enemies.length + this.projectiles.length + allMinions.length,
        particles: this.particles.count,
        statusEffects: this.statusEffects.totalEffects,
        visibleEntities: this.viewport.filterVisible(this.enemies).length,
        gridCells: gridStats.cells,
        poolStats: getPoolStats(),
        blueMinions: waveStats.blue,
        redMinions: waveStats.red,
        waveCount: waveStats.waveCount,
      });
    }

    // Resetar input no final do frame
    this.input.update();

    requestAnimationFrame(this.gameLoop);
  };

  // Encontrar inimigo sob o mouse (OTIMIZADO com spatial grid)
  private getEnemyUnderMouse(mouseX: number, mouseY: number): Enemy | null {
    // Query apenas entidades próximas ao mouse
    const nearby = this.spatialGrid.queryRadius(mouseX, mouseY, 50);

    for (const entity of nearby) {
      const enemy = this.enemyMap.get(entity.id); // O(1) lookup
      if (!enemy || enemy.isDead) continue;

      const dist = Math.hypot(mouseX - enemy.centerX, mouseY - enemy.centerY);
      if (dist < enemy.width / 2 + 5) {
        return enemy;
      }
    }
    return null;
  }

  // Encontrar minion inimigo (vermelho) sob o mouse - para last hit
  private getMinionUnderMouse(mouseX: number, mouseY: number): Minion | null {
    // Apenas minions vermelhos são alvos válidos para o player (time azul)
    for (const minion of this.waveSystem.redMinions) {
      if (minion.isDead) continue;

      const dist = Math.hypot(mouseX - minion.centerX, mouseY - minion.centerY);
      if (dist < minion.width / 2 + 5) {
        return minion;
      }
    }
    return null;
  }

  // Atualizar estado de hover dos inimigos
  private updateEnemyHover(mouseX: number, mouseY: number): void {
    // Limpar highlight anterior
    if (this.hoveredEnemy) {
      this.hoveredEnemy.setHighlight(false);
    }

    // Encontrar novo hover
    this.hoveredEnemy = this.getEnemyUnderMouse(mouseX, mouseY);

    // Setar highlight no novo
    if (this.hoveredEnemy) {
      this.hoveredEnemy.setHighlight(true);
    }

    // Atualizar cursor
    if (this.hoveredEnemy) {
      this.canvas.style.cursor = 'pointer';
    } else {
      this.canvas.style.cursor = 'crosshair';
    }
  }

  // Processar input
  private handleInput(): void {
    // Verificar ESC para toggle menu
    if (this.input.isEscapeJustPressed()) {
      this.toggleMenu();
      return;
    }

    // Se está em menu/pausado, não processar input do jogo
    if (this.isPaused) {
      return;
    }

    const screenMouse = this.input.getMousePosition();

    // Atualizar câmera (pan nas bordas + zoom) - só se pointer lock está ativo
    if (this.input.isPointerLocked()) {
      this.camera.update(screenMouse.x, screenMouse.y);
    }

    // Processar zoom com scroll do mouse
    const wheelDelta = this.input.getWheelDelta();
    if (wheelDelta !== 0) {
      this.camera.applyZoom(wheelDelta, screenMouse.x, screenMouse.y);
    }

    // Converter coordenadas de tela para mundo
    const mouse = this.camera.screenToWorld(screenMouse.x, screenMouse.y);

    // Atualizar hover state (usando coordenadas do mundo)
    this.updateEnemyHover(mouse.x, mouse.y);

    // Click direito - LoL style targeting
    if (this.input.isRightClick()) {
      const clickedEnemy = this.getEnemyUnderMouse(mouse.x, mouse.y);
      const clickedMinion = this.getMinionUnderMouse(mouse.x, mouse.y);

      // KITING: Shift + Click Direito = mover e atacar mais próximo
      if (this.input.isShiftHeld()) {
        // Move para posição clicada
        this.player.moveTo(mouse.x, mouse.y);

        // Atacar inimigo mais próximo automaticamente
        const nearest = this.findNearestEnemy(this.player.centerX, this.player.centerY, RANGES.melee * 3);
        if (nearest && !nearest.isDead) {
          this.setTarget(nearest);
          this.clearMinionTarget();
          // O auto-attack vai acontecer via updateTargetFollow()
          // Mas forçar ataque se estiver em range
          const dist = this.player.distanceTo(nearest);
          if (dist <= RANGES.melee && this.player.canAttack()) {
            this.player.attack();
            this.hitEnemyById(nearest.id, this.player.getMeleeDamage(), 'physical');
          }
        }
      } else if (clickedEnemy) {
        // Clicou em inimigo = setar como target
        this.setTarget(clickedEnemy);
        this.clearMinionTarget();
      } else if (clickedMinion) {
        // Clicou em minion inimigo = setar como target de minion
        this.clearTarget();
        this.setMinionTarget(clickedMinion);
      } else {
        // Clicou no chão = limpar target e mover
        this.clearTarget();
        this.clearMinionTarget();
        this.player.moveTo(mouse.x, mouse.y);
      }
    }

    // A key - Attack move (atacar minion/inimigo mais próximo)
    if (this.input.isKeyJustPressed('a') && this.input.isLeftClick()) {
      // Encontrar alvo mais próximo (prioridade: minions > enemies)
      const nearestMinion = this.findNearestMinion(mouse.x, mouse.y, 300);
      const nearestEnemy = this.findNearestEnemy(mouse.x, mouse.y, 300);

      if (nearestMinion && (!nearestEnemy || this.player.distanceTo(nearestMinion) < this.player.distanceTo(nearestEnemy))) {
        this.setMinionTarget(nearestMinion);
        this.clearTarget();
      } else if (nearestEnemy) {
        this.setTarget(nearestEnemy);
        this.clearMinionTarget();
      } else {
        this.player.moveTo(mouse.x, mouse.y);
      }
    }

    // F3 - Toggle Debug Mode
    if (this.input.isDebugKeyPressed()) {
      this.toggleDebug();
    }

    // R - Restart game (only when game ended)
    if (this.gameState !== 'playing' && this.input.isKeyJustPressed('r')) {
      this.reset();
      this.gameState = 'playing';
      this.isPaused = false;
    }

    // ==================== LOADOUT-BASED ABILITIES ====================
    // Q, W, E, R - Main abilities
    // D, F - Summoner spells

    const slots: AbilitySlot[] = ['Q', 'W', 'E', 'R', 'D', 'F'];
    const keys: Record<AbilitySlot, string> = {
      'Q': 'q',
      'W': 'w',
      'E': 'e',
      'R': 'r',
      'D': 'd',
      'F': 'f',
    };

    for (const slot of slots) {
      if (this.input.isKeyJustPressed(keys[slot])) {
        const abilityId = this.loadout.getAbilityId(slot);
        this.castAbility(abilityId, mouse.x, mouse.y);
      }
    }

    // T - Spawn 10 enemies (para teste)
    if (this.input.isKeyJustPressed('t')) {
      for (let i = 0; i < 10; i++) {
        this.spawnEnemy();
      }
    }

    // Y - Spawn 100 enemies (stress test)
    if (this.input.isKeyJustPressed('y')) {
      for (let i = 0; i < 100; i++) {
        this.spawnEnemy();
      }
    }
  }

  // Cast ability by ID using the loadout system
  private castAbility(abilityId: string, mouseX: number, mouseY: number): void {
    const ability = getAbility(abilityId);
    if (!ability) return;

    // Check if ability requires target
    if (requiresTarget(abilityId)) {
      const target = this.currentTarget ?? this.getEnemyUnderMouse(mouseX, mouseY);
      if (!target || target.isDead) return;

      // Check range if applicable
      if (ability.range) {
        const dist = this.player.distanceTo(target);
        if (dist > ability.range) return;
      }

      // Cast target-based ability
      this.castTargetAbility(abilityId, target);
    } else {
      // Cast direction/self ability
      this.castDirectionAbility(abilityId, mouseX, mouseY);
    }
  }

  // Cast abilities that require a target
  private castTargetAbility(abilityId: string, target: Enemy): void {
    switch (abilityId) {
      case 'lightning':
        if (this.player.useAbility('lightning')) {
          this.castLightningOnTarget(target);
        }
        break;

      case 'stun':
        if (this.player.castStun()) {
          this.performStun(target);
        }
        break;
    }
  }

  // Cast abilities that use direction or are self-cast
  private castDirectionAbility(abilityId: string, mouseX: number, mouseY: number): void {
    const dir = this.player.getDirectionTo(mouseX, mouseY);

    switch (abilityId) {
      case 'fireball':
        if (this.player.useAbility('fireball')) {
          this.spawnProjectile('fireball', dir);
          this.particles.emit(this.player.centerX, this.player.centerY, 'fire');
        }
        break;

      case 'iceSpear':
        if (this.player.useAbility('iceSpear')) {
          this.spawnProjectile('ice', dir);
          this.particles.emit(this.player.centerX, this.player.centerY, 'ice');
        }
        break;

      case 'dash':
        this.player.dash(dir);
        break;

      case 'cleave':
        if (this.player.cleave()) {
          this.performCleave();
        }
        break;

      case 'frostNova':
        if (this.player.frostNova()) {
          this.performFrostNova();
        }
        break;

      case 'heal':
        if (this.player.healSelf()) {
          this.particles.burst(this.player.centerX, this.player.centerY, 'heal', 2);
          this.damageNumbers.show(
            this.player.centerX,
            this.player.centerY - 30,
            this.player.getHealAmount(),
            'heal'
          );
        }
        break;

      case 'shield':
        if (this.player.castShield()) {
          this.statusEffects.apply(this.player.id, {
            type: 'shield',
            duration: TIMING.statusDurations.shield,
            value: STATUS_VALUES.shieldAmount,
          });
          this.particles.burst(this.player.centerX, this.player.centerY, 'spark', 1.5);
        }
        break;

      case 'meteor':
        const dist = Math.hypot(mouseX - this.player.centerX, mouseY - this.player.centerY);
        if (dist <= this.player.getMeteorCastRange()) {
          if (this.player.castMeteor()) {
            this.pendingMeteor = {
              x: mouseX,
              y: mouseY,
              timer: 1000,
            };
            this.effects.createMeteorWarning(mouseX, mouseY, this.player.getMeteorRadius());
          }
        }
        break;
    }
  }

  // ==================== NEW ABILITY IMPLEMENTATIONS ====================

  private performCleave(): void {
    // OTIMIZADO: Usar spatial grid em vez de iterar todos os inimigos
    const cleaveRange = 80; // Range aproximado do cleave
    const nearby = this.spatialGrid.queryRadius(
      this.player.centerX,
      this.player.centerY,
      cleaveRange
    );

    for (const entity of nearby) {
      const enemy = this.enemyMap.get(entity.id);
      if (!enemy || enemy.isDead) continue;

      if (this.player.isInCleaveArc(enemy.centerX, enemy.centerY)) {
        this.hitEnemyById(enemy.id, this.player.getCleaveDamage(), 'physical');
      }
    }

    // Visual effect
    this.particles.emit(this.player.centerX, this.player.centerY, 'spark');
  }

  private performFrostNova(): void {
    const range = this.player.getFrostNovaRange();

    // Visual effect (circle expanding)
    this.effects.createFrostNova(this.player.centerX, this.player.centerY, range);
    this.particles.burst(this.player.centerX, this.player.centerY, 'ice', 3);

    // OTIMIZADO: Usar spatial grid - já retorna apenas inimigos no range
    const nearby = this.spatialGrid.queryRadius(
      this.player.centerX,
      this.player.centerY,
      range
    );

    for (const entity of nearby) {
      const enemy = this.enemyMap.get(entity.id);
      if (!enemy || enemy.isDead) continue;

      // Damage
      this.hitEnemyById(enemy.id, DAMAGE.frostNova, 'magic');

      // Apply slow
      this.statusEffects.apply(enemy.id, {
        type: 'slow',
        duration: TIMING.statusDurations.frozen,
        value: STATUS_VALUES.slowAmount,
      });
    }
  }

  private performStun(target: Enemy): void {
    // Apply stun
    this.statusEffects.apply(target.id, {
      type: 'stun',
      duration: TIMING.statusDurations.stun,
    });

    // Visual effect
    this.effects.createLightning(target.centerX, target.centerY, 60);
    this.particles.burst(target.centerX, target.centerY, 'spark', 1.5);

    // Small damage
    this.hitEnemyById(target.id, DAMAGE.stun, 'magic');
  }

  private updateMeteor(deltaTime: number): void {
    if (!this.pendingMeteor) return;

    this.pendingMeteor.timer -= deltaTime;

    if (this.pendingMeteor.timer <= 0) {
      // Meteor lands!
      const { x, y } = this.pendingMeteor;
      const radius = this.player.getMeteorRadius();

      // Big explosion effect
      this.effects.createExplosion(x, y, radius, '#ff4400');
      this.particles.burst(x, y, 'fire', 5);

      // OTIMIZADO: Usar spatial grid para meteor AoE
      const nearby = this.spatialGrid.queryRadius(x, y, radius);

      for (const entity of nearby) {
        const enemy = this.enemyMap.get(entity.id);
        if (!enemy || enemy.isDead) continue;

        this.hitEnemyById(enemy.id, this.player.getMeteorDamage(), 'magic');

        // Brief stun from meteor impact
        this.statusEffects.apply(enemy.id, {
          type: 'stun',
          duration: 500, // 0.5s stun
        });
      }

      this.pendingMeteor = null;
    }
  }

  // Player empurra inimigos próximos quando anda
  private pushNearbyEnemies(): void {
    const pushRadius = 45; // Player radius (30) + margem
    const pushForce = 2.5; // Força do empurrão

    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;

      const dx = enemy.centerX - this.player.centerX;
      const dy = enemy.centerY - this.player.centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < pushRadius && dist > 0) {
        // Empurrar na direção oposta ao player
        const pushX = (dx / dist) * pushForce;
        const pushY = (dy / dist) * pushForce;

        // Aplicar empurrão (clamp to bounds)
        enemy.x = Math.max(0, Math.min(SIZES.arena.width - enemy.width, enemy.x + pushX));
        enemy.y = Math.max(0, Math.min(SIZES.arena.height - enemy.height, enemy.y + pushY));
      }
    }
  }

  // Setar target atual
  private setTarget(enemy: Enemy): void {
    // Limpar target anterior
    if (this.currentTarget) {
      this.currentTarget.setTargeted(false);
    }

    // Setar novo target
    this.currentTarget = enemy;
    this.currentTarget.setTargeted(true);
  }

  // Limpar target
  private clearTarget(): void {
    if (this.currentTarget) {
      this.currentTarget.setTargeted(false);
      this.currentTarget = null;
    }
  }

  // Setar target de minion
  private setMinionTarget(minion: Minion): void {
    this.currentMinionTarget = minion;
  }

  // Limpar target de minion
  private clearMinionTarget(): void {
    this.currentMinionTarget = null;
  }

  // Encontrar minion inimigo mais próximo
  private findNearestMinion(x: number, y: number, range: number): Minion | null {
    let nearest: Minion | null = null;
    let nearestDist = range;

    for (const minion of this.waveSystem.redMinions) {
      if (minion.isDead) continue;

      const dx = minion.centerX - x;
      const dy = minion.centerY - y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = minion;
      }
    }

    return nearest;
  }

  // Sistema de Follow + Auto-Attack
  private updateTargetFollow(): void {
    // Prioridade 1: Target de minion (para last hit)
    if (this.currentMinionTarget) {
      if (this.currentMinionTarget.isDead) {
        this.clearMinionTarget();
      } else {
        this.attackMinionTarget();
        return;
      }
    }

    // Prioridade 2: Target de enemy
    if (!this.currentTarget || this.currentTarget.isDead) {
      this.clearTarget();
      return;
    }

    const dist = this.player.distanceTo(this.currentTarget);
    const attackRange = this.player.getAttackRange();

    if (dist > attackRange) {
      // Fora do range = mover em direção ao target
      // MAS: Se o pathfinding está bloqueado, não chamar moveTo() toda frame
      // Isso evita resetar o pathfinding infinitamente
      if (!this.player.isBlocked()) {
        this.player.moveTo(this.currentTarget.centerX, this.currentTarget.centerY);
      }
      // Se bloqueado, player fica parado até usuário clicar em novo lugar
    } else {
      // Dentro do range = parar e atacar
      this.player.stopMoving();

      // Auto-attack se cooldown zerado
      if (this.player.canAttack()) {
        this.player.attack();
        this.hitEnemyById(this.currentTarget.id, this.player.getMeleeDamage(), 'physical');
      }
    }
  }

  // Atacar minion target (para last hit)
  private attackMinionTarget(): void {
    if (!this.currentMinionTarget || this.currentMinionTarget.isDead) {
      this.clearMinionTarget();
      return;
    }

    const dist = this.player.distanceTo(this.currentMinionTarget);
    const attackRange = this.player.getAttackRange();

    if (dist > attackRange) {
      // Fora do range = mover em direção ao minion
      if (!this.player.isBlocked()) {
        this.player.moveTo(this.currentMinionTarget.centerX, this.currentMinionTarget.centerY);
      }
    } else {
      // Dentro do range = parar e atacar
      this.player.stopMoving();

      // Auto-attack se cooldown zerado
      if (this.player.canAttack()) {
        this.player.attack();
        // Usar takeDamageFrom para rastrear last hit
        this.currentMinionTarget.takeDamageFrom(this.player.getMeleeDamage(), 'player');
        this.damageNumbers.show(
          this.currentMinionTarget.centerX,
          this.currentMinionTarget.centerY - 10,
          this.player.getMeleeDamage(),
          'physical'
        );
        this.particles.emit(this.currentMinionTarget.centerX, this.currentMinionTarget.centerY, 'spark');

        // Verificar se player está perto de torre inimiga (vermelha)
        // Se sim, a torre deve focar no player
        this.checkTowerAggroOnAttack();
      }
    }
  }

  /**
   * Verifica se player está atacando perto de uma torre inimiga
   * Se sim, a torre deve mudar o aggro para o player
   */
  private checkTowerAggroOnAttack(): void {
    const playerX = this.player.centerX;
    const playerY = this.player.centerY;

    for (const structure of this.structures) {
      // Apenas torres vermelhas (inimigas do player)
      if (structure.structureType !== 'tower' || structure.team !== 'red' || structure.isDead) {
        continue;
      }

      const dist = Math.sqrt(
        (playerX - structure.centerX) ** 2 +
        (playerY - structure.centerY) ** 2
      );

      // Se player está dentro do range da torre
      if (dist <= structure.attackRange) {
        // Forçar a torre a focar no player
        structure.forceAggroSwap(this.player);
        this.playerAggroedTower = true;
        return;
      }
    }
  }

  // Atualizar estado do jogo
  private update(deltaTime: number): void {
    // Atualizar sistemas primeiro
    this.statusEffects.update(deltaTime);
    this.progression.update(deltaTime); // Gold passivo

    // Atualizar jogador
    this.player.update(deltaTime);

    // Verificar se player morreu
    this.checkPlayerDeath(deltaTime);

    // Player empurra inimigos próximos
    this.pushNearbyEnemies();

    // Sistema de Follow + Auto-Attack (LoL style)
    this.updateTargetFollow();

    // Atualizar meteor
    this.updateMeteor(deltaTime);

    // Atualizar inimigos (com IA) - OTIMIZADO
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      // Atualizar posição no spatial grid
      this.spatialGrid.update({
        id: enemy.id,
        x: enemy.centerX,
        y: enemy.centerY,
        radius: enemy.width / 2
      });

      // Só atualiza AI se estiver visível ou próximo
      const shouldUpdateAI = this.viewport.shouldUpdateAI(enemy, 600);

      enemy.update(deltaTime);

      // Update AI apenas se necessário (otimização)
      if (shouldUpdateAI) {
        const aiResult = enemy.updateAI(this.player.centerX, this.player.centerY, deltaTime);

        // Enemy attacks player
        if (aiResult.shouldAttack) {
          this.enemyAttackPlayer(enemy);
        }
      }

      if (enemy.shouldRemove()) {
        // Remover do spatial grid
        this.spatialGrid.remove({ id: enemy.id, x: enemy.centerX, y: enemy.centerY });

        // Remover do collision system
        this.collisionSystem.removeEntity({
          id: enemy.id,
          x: enemy.x,
          y: enemy.y,
          width: enemy.width,
          height: enemy.height
        });

        // Desregistrar do separation steering
        Enemy.unregisterEnemy(enemy);

        // Remover do Map
        this.enemyMap.delete(enemy.id);

        // Se o target morreu, limpar
        if (this.currentTarget === enemy) {
          this.clearTarget();
        }
        if (this.hoveredEnemy === enemy) {
          this.hoveredEnemy = null;
        }
        // Clear status effects for dead enemy
        this.statusEffects.clearEntity(enemy.id);
        this.particles.burst(enemy.centerX, enemy.centerY, 'death', 2);

        // SWAP-AND-POP: muito mais rápido que splice para arrays grandes
        const lastEnemy = this.enemies[this.enemies.length - 1];
        this.enemies[i] = lastEnemy;
        this.enemies.pop();
      }
    }

    // REMOVIDO: processEnemyCollisions() causava flickering
    // Inimigos agora usam separation steering suave no moveToward()

    // Atualizar projéteis - OTIMIZADO com spatial grid
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update(deltaTime);

      // Verificar colisão apenas com inimigos próximos (OTIMIZAÇÃO)
      const nearbyEntities = this.spatialGrid.queryRadius(proj.centerX, proj.centerY, 50);

      for (const entity of nearbyEntities) {
        const enemy = this.enemyMap.get(entity.id); // O(1) lookup
        if (!enemy) continue;

        if (!proj.hasHit(enemy.id) && proj.collidesWith(enemy)) {
          this.hitEnemyById(enemy.id, proj.getDamage(), 'magic');
          proj.markHit(enemy.id);

          if (!proj.pierce) {
            // Efeito de impacto
            this.particles.burst(proj.centerX, proj.centerY, proj.type === 'fireball' ? 'fire' : 'ice', 1.5);
            this.effects.createExplosion(proj.centerX, proj.centerY, 40, proj.color);
            // SWAP-AND-POP
            const lastProj = this.projectiles[this.projectiles.length - 1];
            this.projectiles[i] = lastProj;
            this.projectiles.pop();
            break;
          }
        }
      }

      // Remover se fora da tela
      if (proj.shouldRemove()) {
        // SWAP-AND-POP
        const lastProj = this.projectiles[this.projectiles.length - 1];
        this.projectiles[i] = lastProj;
        this.projectiles.pop();
      }
    }

    // Atualizar wave system (spawna minions)
    this.waveSystem.update(deltaTime);

    // Atualizar minions
    this.updateMinions(deltaTime);

    // Atualizar estruturas
    this.updateStructures(deltaTime);

    // Verificar condição de vitória/derrota
    this.checkGameEnd();

    // Atualizar sistemas
    this.particles.update(deltaTime);
    this.damageNumbers.update(deltaTime);
    this.effects.update(deltaTime);
  }

  /**
   * Calcula tempo de respawn baseado no level (estilo LoL)
   * Level 1: ~10s, Level 18: ~60s
   */
  private calculateRespawnTime(): number {
    const level = this.progression.getLevel();
    // Fórmula simplificada: 5 + (level * 2.5) segundos
    return (5 + level * 2.5) * 1000;
  }

  /**
   * Verifica se player morreu e gerencia respawn
   */
  private checkPlayerDeath(deltaTime: number): void {
    // Player acabou de morrer?
    if (this.player.isDead && !this.isPlayerDead) {
      this.isPlayerDead = true;
      this.playerRespawnTimer = this.calculateRespawnTime();
      this.progression.onDeath(); // Reseta kill streak
      console.log(`[Player] Died! Respawning in ${(this.playerRespawnTimer / 1000).toFixed(1)}s`);
    }

    // Contagem regressiva para respawn
    if (this.isPlayerDead && this.playerRespawnTimer > 0) {
      this.playerRespawnTimer -= deltaTime;

      if (this.playerRespawnTimer <= 0) {
        this.respawnPlayer();
      }
    }
  }

  /**
   * Respawna o player na base azul
   */
  private respawnPlayer(): void {
    const blueSpawn = this.gameMap.getBlueSpawn();

    // Resetar player
    this.player.x = blueSpawn.x;
    this.player.y = blueSpawn.y;
    this.player.targetX = blueSpawn.x;
    this.player.targetY = blueSpawn.y;
    this.player.hp = this.player.maxHp;
    this.player.isDead = false;
    this.player.deathScale = 1;
    this.player.deathTimer = 0;

    // Limpar targets
    this.clearTarget();
    this.clearMinionTarget();

    // Resetar estado de morto
    this.isPlayerDead = false;
    this.playerRespawnTimer = 0;

    // Centralizar câmera no player
    this.camera.centerOn(this.player.centerX, this.player.centerY);

    // Efeito visual de respawn
    this.particles.burst(this.player.centerX, this.player.centerY, 'heal', 3);
    this.effects.createExplosion(this.player.centerX, this.player.centerY, 50, '#00ff00');

    console.log('[Player] Respawned!');
  }

  /**
   * Retorna o tempo restante de respawn (para UI)
   */
  getRespawnTimer(): number {
    return Math.max(0, this.playerRespawnTimer);
  }

  /**
   * Verifica se player está morto
   */
  isPlayerDeadState(): boolean {
    return this.isPlayerDead;
  }

  /**
   * Verifica se o jogo terminou (Nexus destruído)
   */
  private checkGameEnd(): void {
    if (this.gameState !== 'playing') return;

    // Verificar se Nexus azul foi destruído (player perde)
    const blueNexus = this.structures.find(s => s.team === 'blue' && s.structureType === 'nexus');
    if (!blueNexus || blueNexus.isDead) {
      this.setGameState('defeat');
      return;
    }

    // Verificar se Nexus vermelho foi destruído (player vence)
    const redNexus = this.structures.find(s => s.team === 'red' && s.structureType === 'nexus');
    if (!redNexus || redNexus.isDead) {
      this.setGameState('victory');
      return;
    }
  }

  /**
   * Define o estado do jogo (vitória/derrota)
   */
  private setGameState(state: 'victory' | 'defeat'): void {
    this.gameState = state;
    this.isPaused = true; // Pausar o jogo

    console.log(`[Game] ${state.toUpperCase()}!`);

    // Callback para UI externa
    if (this.onGameEnd) {
      this.onGameEnd(state);
    }
  }

  /**
   * Retorna o estado atual do jogo
   */
  getGameState(): GameState {
    return this.gameState;
  }

  /**
   * Atualiza estruturas e processa ataques de torres
   * Usa sistema de prioridade de alvos (minions > champions)
   * Torres mudam de alvo se champion ataca aliado perto da torre
   */
  private updateStructures(deltaTime: number): void {
    for (const structure of this.structures) {
      structure.update(deltaTime);

      // Torres atacam inimigos automaticamente
      if (structure.structureType === 'tower' && !structure.isDead) {
        const enemies = structure.team === 'blue'
          ? [...this.waveSystem.redMinions, ...this.enemies] // Torres azuis atacam vermelhos
          : [...this.waveSystem.blueMinions]; // Torres vermelhas atacam azuis (e player)

        // Adicionar player como alvo para torres vermelhas
        if (structure.team === 'red' && !this.player.isDead) {
          // Passar flag de aggro se player atacou algo perto da torre
          const target = structure.tryAttack([...enemies, this.player], this.playerAggroedTower);
          if (target) {
            if (target === this.player) {
              const actualDamage = this.player.takeDamageWithShield(structure.getAttackDamage());
              this.damageNumbers.show(
                this.player.centerX,
                this.player.centerY - 10,
                actualDamage > 0 ? actualDamage : 0,
                actualDamage > 0 ? 'physical' : 'shield'
              );
              this.particles.burst(this.player.centerX, this.player.centerY, 'spark', 1);
            } else {
              // Minion sendo atacado pela torre - usar takeDamageFrom
              if (target instanceof Minion) {
                target.takeDamageFrom(structure.getAttackDamage(), 'tower');
              } else {
                target.takeDamage(structure.getAttackDamage());
              }
              this.damageNumbers.show(
                target.centerX,
                target.centerY - 10,
                structure.getAttackDamage(),
                'physical'
              );
            }
          }
        } else {
          const target = structure.tryAttack(enemies);
          if (target) {
            // Minion sendo atacado pela torre - usar takeDamageFrom
            if (target instanceof Minion) {
              target.takeDamageFrom(structure.getAttackDamage(), 'tower');
            } else {
              target.takeDamage(structure.getAttackDamage());
            }
            this.damageNumbers.show(
              target.centerX,
              target.centerY - 10,
              structure.getAttackDamage(),
              'physical'
            );
          }
        }
      }
    }

    // Resetar flag de aggro após processar
    this.playerAggroedTower = false;

    // Remover estruturas destruídas
    this.structures = this.structures.filter(s => !s.shouldRemove());
  }

  /**
   * Retorna estruturas inimigas de um time
   */
  getEnemyStructures(team: StructureTeam): Structure[] {
    return this.structures.filter(s => s.team !== team && !s.isDead);
  }

  /**
   * Retorna o Nexus inimigo de um time
   */
  getEnemyNexus(team: StructureTeam): Structure | undefined {
    return this.structures.find(s => s.team !== team && s.structureType === 'nexus' && !s.isDead);
  }

  /**
   * Atualiza todos os minions e processa combate entre eles
   */
  private updateMinions(deltaTime: number): void {
    const blueMinions = this.waveSystem.blueMinions;
    const redMinions = this.waveSystem.redMinions;

    // Obter estruturas inimigas para cada time
    const redStructures = this.structures.filter(s => s.team === 'red' && !s.isDead);
    const blueStructures = this.structures.filter(s => s.team === 'blue' && !s.isDead);
    const redNexus = this.getEnemyNexus('blue'); // Nexus vermelho é inimigo do azul
    const blueNexus = this.getEnemyNexus('red'); // Nexus azul é inimigo do vermelho

    // Rastrear minions que morreram para dar recompensas
    const minionsToCheckReward: Minion[] = [];

    // Atualizar minions azuis (perseguem minions vermelhos, estruturas vermelhas, e Nexus vermelho)
    for (const minion of blueMinions) {
      const wasAlive = !minion.isDead;
      minion.update(deltaTime);

      if (wasAlive && !minion.isDead) {
        // AI: perseguir minions vermelhos, estruturas vermelhas, e Nexus vermelho
        const result = minion.updateAI(redMinions, null, deltaTime, redStructures, redNexus);

        if (result.shouldAttack && result.target) {
          // Processar dano
          if (result.target instanceof Minion) {
            result.target.takeDamageFrom(minion.getAttackDamage(), 'minion');
            this.damageNumbers.show(
              result.target.centerX,
              result.target.centerY - 10,
              minion.getAttackDamage(),
              'physical'
            );
          } else if (result.target instanceof Structure) {
            result.target.takeDamage(minion.getAttackDamage());
            this.damageNumbers.show(
              result.target.centerX,
              result.target.centerY - 10,
              minion.getAttackDamage(),
              'physical'
            );
          }
        }
      }

      // Se minion morreu neste frame, verificar last hit
      if (wasAlive && minion.isDead) {
        minionsToCheckReward.push(minion);
      }
    }

    // Atualizar minions vermelhos (perseguem player, minions azuis, estruturas azuis, e Nexus azul)
    for (const minion of redMinions) {
      const wasAlive = !minion.isDead;
      minion.update(deltaTime);

      if (wasAlive && !minion.isDead) {
        // AI: perseguir minions azuis, player, estruturas azuis, e Nexus azul
        const result = minion.updateAI(blueMinions, this.player, deltaTime, blueStructures, blueNexus);

        if (result.shouldAttack && result.target) {
          // Processar dano
          if (result.target instanceof Minion) {
            result.target.takeDamageFrom(minion.getAttackDamage(), 'minion');
            this.damageNumbers.show(
              result.target.centerX,
              result.target.centerY - 10,
              minion.getAttackDamage(),
              'physical'
            );
          } else if (result.target === this.player) {
            // Minion atacou o player
            const actualDamage = this.player.takeDamageWithShield(minion.getAttackDamage());
            this.damageNumbers.show(
              this.player.centerX,
              this.player.centerY - 10,
              actualDamage > 0 ? actualDamage : 0,
              actualDamage > 0 ? 'physical' : 'shield'
            );
          } else if (result.target instanceof Structure) {
            result.target.takeDamage(minion.getAttackDamage());
            this.damageNumbers.show(
              result.target.centerX,
              result.target.centerY - 10,
              minion.getAttackDamage(),
              'physical'
            );
          }
        }
      }

      // Se minion morreu neste frame, verificar last hit
      if (wasAlive && minion.isDead) {
        minionsToCheckReward.push(minion);
      }
    }

    // Processar recompensas por minions mortos
    for (const deadMinion of minionsToCheckReward) {
      if (deadMinion.wasLastHitByPlayer()) {
        // Player fez last hit - dar gold e XP
        this.progression.onMinionKill('melee'); // Por enquanto todos são melee
        // Mostrar indicador de gold
        this.damageNumbers.show(
          deadMinion.centerX,
          deadMinion.centerY - 20,
          21, // Gold value
          'heal' // Usar cor verde para gold
        );
      }
    }
  }

  // Renderizar - OTIMIZADO com viewport culling
  private render(): void {
    const ctx = this.ctx;

    // Limpar canvas (antes da transformação)
    ctx.fillStyle = COLORS.arena;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Aplicar transformação da câmera
    this.camera.applyTransform(ctx);

    // Atualizar viewport culling com posição da câmera (FIX: minions invisíveis)
    this.viewport.update(
      this.camera.x,
      this.camera.y,
      this.canvas.width / this.camera.zoom,
      this.canvas.height / this.camera.zoom
    );

    // Borda do MUNDO (não da tela)
    ctx.strokeStyle = COLORS.arenaBorder;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, SIZES.arena.width - 4, SIZES.arena.height - 4);

    // Renderizar mapa (obstáculos)
    this.gameMap.render(ctx);

    // Renderizar estruturas (abaixo das entidades móveis)
    for (const structure of this.structures) {
      if (this.viewport.isVisible(structure)) {
        structure.render(ctx);
      }
    }

    // Renderizar efeitos (abaixo das entidades)
    this.effects.render(ctx);

    // Renderizar inimigos - APENAS OS VISÍVEIS
    for (const enemy of this.enemies) {
      if (this.viewport.isVisible(enemy)) {
        enemy.render(ctx);
      }
    }

    // Renderizar minions - APENAS OS VISÍVEIS
    for (const minion of this.waveSystem.getAllMinions()) {
      if (this.viewport.isVisible(minion)) {
        minion.render(ctx);
      }
    }

    // Renderizar projéteis - APENAS OS VISÍVEIS
    for (const proj of this.projectiles) {
      if (this.viewport.isVisible(proj)) {
        proj.render(ctx);
      }
    }

    // Renderizar jogador
    this.player.render(ctx);

    // Renderizar partículas (acima das entidades)
    this.particles.render(ctx);

    // Renderizar números de dano (por cima de tudo)
    this.damageNumbers.render(ctx);

    // Renderizar debug (se ativo) - ainda no espaço do mundo
    if (this.debugMode) {
      this.renderDebug(ctx);
    }

    // Resetar transformação da câmera para UI fixa na tela
    this.camera.resetTransform(ctx);

    // UI fixa na tela (HUD) será renderizada aqui
    this.renderHUD(ctx);
  }

  // Renderizar HUD (elementos fixos na tela)
  private renderHUD(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Info no canto superior esquerdo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(10, 10, 150, 145);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '12px monospace';

    // Gold e Level (estilo LoL)
    ctx.fillStyle = '#ffd700'; // Gold color
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`Gold: ${this.progression.getGold()}`, 20, 30);

    ctx.fillStyle = '#00bfff'; // Level color
    ctx.fillText(`Level: ${this.progression.getLevel()}`, 20, 48);

    // XP bar pequena
    const xpBarWidth = 110;
    const xpProgress = this.progression.getXpProgress();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(20, 52, xpBarWidth, 6);
    ctx.fillStyle = '#9966ff';
    ctx.fillRect(20, 52, xpBarWidth * xpProgress, 6);

    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';

    // Wave info
    const waveStats = this.waveSystem.getStats();
    ctx.fillText(`Wave: ${waveStats.waveCount}`, 20, 75);
    ctx.fillStyle = '#3498db';
    ctx.fillText(`Blue Minions: ${waveStats.blue}`, 20, 93);
    ctx.fillStyle = '#e74c3c';
    ctx.fillText(`Red Minions: ${waveStats.red}`, 20, 111);

    // Performance stats
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '11px monospace';
    const totalEntities = 1 + this.enemies.length + this.waveSystem.getAllMinions().length + this.structures.length;
    ctx.fillText(`FPS: ${this.currentFps} | Entities: ${totalEntities}`, 20, 128);
    ctx.fillText(`Particles: ${this.particles.count}`, 20, 143);

    // Zoom indicator no canto superior direito
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(`Zoom: ${(this.camera.zoom * 100).toFixed(0)}%`, this.canvas.width - 80, 20);

    // Tela de morte/respawn
    if (this.isPlayerDead && this.gameState === 'playing') {
      // Overlay semi-transparente
      ctx.fillStyle = 'rgba(50, 0, 0, 0.5)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Timer de respawn
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      const respawnSeconds = Math.ceil(this.playerRespawnTimer / 1000);
      ctx.fillText(`RESPAWNING IN ${respawnSeconds}`, this.canvas.width / 2, this.canvas.height / 2);

      ctx.font = '20px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('You have been slain!', this.canvas.width / 2, this.canvas.height / 2 + 40);

      ctx.textAlign = 'left';
    }

    // Instrução de pointer lock (se não está travado)
    if (!this.input.isPointerLocked() && !this.showMenu) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(this.canvas.width / 2 - 150, this.canvas.height / 2 - 30, 300, 60);

      ctx.fillStyle = '#ffffff';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Click para jogar', this.canvas.width / 2, this.canvas.height / 2);
      ctx.font = '12px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('ESC para menu', this.canvas.width / 2, this.canvas.height / 2 + 20);
      ctx.textAlign = 'left';
    }

    // Menu de pause
    if (this.showMenu && this.gameState === 'playing') {
      // Overlay escuro
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Título
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2 - 40);

      // Instruções
      ctx.font = '16px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText('Click para continuar', this.canvas.width / 2, this.canvas.height / 2 + 10);
      ctx.fillText('ESC para fechar menu', this.canvas.width / 2, this.canvas.height / 2 + 35);

      ctx.textAlign = 'left';
    }

    // Tela de Vitória/Derrota
    if (this.gameState !== 'playing') {
      this.renderGameEndScreen(ctx);
    }

    // Cursor customizado quando pointer lock está ativo
    if (this.input.isPointerLocked()) {
      const mouse = this.input.getMousePosition();

      // Crosshair branco com borda preta para visibilidade
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;

      // Linha horizontal (borda)
      ctx.beginPath();
      ctx.moveTo(mouse.x - 12, mouse.y);
      ctx.lineTo(mouse.x + 12, mouse.y);
      ctx.stroke();

      // Linha vertical (borda)
      ctx.beginPath();
      ctx.moveTo(mouse.x, mouse.y - 12);
      ctx.lineTo(mouse.x, mouse.y + 12);
      ctx.stroke();

      // Crosshair interno branco
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;

      // Linha horizontal
      ctx.beginPath();
      ctx.moveTo(mouse.x - 10, mouse.y);
      ctx.lineTo(mouse.x + 10, mouse.y);
      ctx.stroke();

      // Linha vertical
      ctx.beginPath();
      ctx.moveTo(mouse.x, mouse.y - 10);
      ctx.lineTo(mouse.x, mouse.y + 10);
      ctx.stroke();

      // Ponto central
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Renderiza a tela de fim de jogo (vitória/derrota)
   */
  private renderGameEndScreen(ctx: CanvasRenderingContext2D): void {
    const isVictory = this.gameState === 'victory';

    // Overlay com gradiente
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    if (isVictory) {
      gradient.addColorStop(0, 'rgba(0, 50, 100, 0.9)');
      gradient.addColorStop(1, 'rgba(0, 100, 150, 0.9)');
    } else {
      gradient.addColorStop(0, 'rgba(100, 0, 0, 0.9)');
      gradient.addColorStop(1, 'rgba(50, 0, 0, 0.9)');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Título principal
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Sombra do texto
    ctx.shadowColor = isVictory ? '#00ffff' : '#ff0000';
    ctx.shadowBlur = 20;

    ctx.font = 'bold 72px sans-serif';
    ctx.fillStyle = isVictory ? '#00ffff' : '#ff4444';
    ctx.fillText(
      isVictory ? 'VICTORY!' : 'DEFEAT',
      this.canvas.width / 2,
      this.canvas.height / 2 - 50
    );

    // Reset shadow
    ctx.shadowBlur = 0;

    // Subtítulo
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(
      isVictory ? 'You destroyed the enemy Nexus!' : 'Your Nexus has been destroyed!',
      this.canvas.width / 2,
      this.canvas.height / 2 + 20
    );

    // Estatísticas do jogo
    const waveStats = this.waveSystem.getStats();
    ctx.font = '18px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(
      `Waves: ${waveStats.waveCount}  |  Enemies Killed: ${this.enemyIdCounter}`,
      this.canvas.width / 2,
      this.canvas.height / 2 + 70
    );

    // Instrução para reiniciar
    ctx.font = '20px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText(
      'Press R to restart',
      this.canvas.width / 2,
      this.canvas.height / 2 + 130
    );

    // Borda decorativa
    ctx.strokeStyle = isVictory ? 'rgba(0, 255, 255, 0.5)' : 'rgba(255, 0, 0, 0.5)';
    ctx.lineWidth = 4;
    const padding = 50;
    ctx.strokeRect(
      padding,
      this.canvas.height / 2 - 120,
      this.canvas.width - padding * 2,
      280
    );

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  // Enemy attacks player
  private enemyAttackPlayer(enemy: Enemy): void {
    const damage = enemy.getAttackDamage();

    // Check if player has shield
    const actualDamage = this.player.takeDamageWithShield(damage);

    // Show damage number
    if (actualDamage > 0) {
      this.damageNumbers.show(
        this.player.centerX,
        this.player.centerY - 20,
        actualDamage,
        'physical'
      );
      this.particles.emit(this.player.centerX, this.player.centerY, 'spark');
    } else {
      // Shield blocked it
      this.damageNumbers.show(
        this.player.centerX,
        this.player.centerY - 20,
        0,
        'shield'
      );
    }
  }

  // Spawnar inimigo em posição específica
  spawnEnemyAt(x: number, y: number): void {
    const enemy = new Enemy(x, y, `enemy-${this.enemyIdCounter++}`);
    enemy.setStatusEffectSystem(this.statusEffects);
    this.enemies.push(enemy);
    this.enemyMap.set(enemy.id, enemy);

    // Registrar para separation steering
    Enemy.registerEnemy(enemy);

    // Adicionar ao spatial grid
    this.spatialGrid.insert({
      id: enemy.id,
      x: enemy.centerX,
      y: enemy.centerY,
      radius: enemy.width / 2
    });

    // Adicionar ao collision system
    this.collisionSystem.addEntity({
      id: enemy.id,
      x: enemy.x,
      y: enemy.y,
      width: enemy.width,
      height: enemy.height,
      collisionLayer: CollisionLayers.ENEMY,
      collisionMask: CollisionLayers.ENEMY
    });
  }

  // Spawnar inimigo em posição aleatória (lado vermelho)
  spawnEnemy(): void {
    const redSpawn = this.gameMap.getRedSpawn();
    const x = redSpawn.x + (Math.random() - 0.5) * 200;
    const y = redSpawn.y + (Math.random() - 0.5) * 300;
    const enemy = new Enemy(x, y, `enemy-${this.enemyIdCounter++}`);
    enemy.setStatusEffectSystem(this.statusEffects);
    this.enemies.push(enemy);
    this.enemyMap.set(enemy.id, enemy); // O(1) lookup

    // Registrar para separation steering
    Enemy.registerEnemy(enemy);

    // Adicionar ao spatial grid
    this.spatialGrid.insert({
      id: enemy.id,
      x: enemy.centerX,
      y: enemy.centerY,
      radius: enemy.width / 2
    });

    // Adicionar ao collision system
    this.collisionSystem.addEntity({
      id: enemy.id,
      x: enemy.x,
      y: enemy.y,
      width: enemy.width,
      height: enemy.height,
      collisionLayer: CollisionLayers.ENEMY,
      collisionMask: CollisionLayers.ENEMY // Inimigos colidem entre si
    });
  }

  // Spawnar projétil
  private spawnProjectile(type: ProjectileType, direction: { x: number; y: number }): void {
    const proj = new Projectile({
      id: `proj-${this.projectileIdCounter++}`,
      x: this.player.centerX - SIZES.projectile / 2,
      y: this.player.centerY - SIZES.projectile / 2,
      direction,
      type,
      ownerId: this.player.id,
    });
    this.projectiles.push(proj);
  }

  // Causar dano em inimigo por ID (O(1) lookup)
  private hitEnemyById(id: string, damage: number, type: 'physical' | 'magic'): void {
    const enemy = this.enemyMap.get(id);
    if (!enemy || enemy.isDead) return;
    this.applyDamageToEnemy(enemy, damage, type);
  }

  // Aplicar dano (código compartilhado)
  private applyDamageToEnemy(enemy: Enemy, damage: number, type: 'physical' | 'magic'): void {
    // Chance de crítico
    const isCrit = Math.random() < 0.2;
    const finalDamage = isCrit ? damage * 2 : damage;

    enemy.takeDamage(finalDamage);

    // Mostrar número de dano
    this.damageNumbers.show(
      enemy.centerX,
      enemy.centerY - 20,
      finalDamage,
      isCrit ? 'crit' : type
    );

    // Partículas de hit
    this.particles.emit(enemy.centerX, enemy.centerY, 'spark');
  }

  // Lançar lightning em um target específico
  private castLightningOnTarget(target: Enemy): void {
    if (target.isDead) return;

    // Verificar range
    const dist = this.player.distanceTo(target);
    if (dist > RANGES.lightning) {
      // Fora do range - não faz nada
      return;
    }

    // Efeito de lightning
    this.effects.createLightning(target.centerX, target.centerY, 80);
    this.particles.burst(target.centerX, target.centerY, 'lightning', 2);

    // Dano
    this.hitEnemyById(target.id, DAMAGE.lightning, 'magic');
  }

  // Encontrar inimigo mais próximo dentro de um range
  private findNearestEnemy(x: number, y: number, range: number): Enemy | null {
    let nearest: Enemy | null = null;
    let nearestDist = range;

    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;

      const dx = enemy.centerX - x;
      const dy = enemy.centerY - y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = enemy;
      }
    }

    return nearest;
  }

  // Toggle debug mode
  toggleDebug(): void {
    this.debugMode = !this.debugMode;
    console.log('[Debug] Mode:', this.debugMode ? 'ON' : 'OFF');
  }

  // Renderizar informações de debug
  private renderDebug(ctx: CanvasRenderingContext2D): void {
    // 1. Pathfinding grid (células bloqueadas em vermelho)
    this.pathfindingGrid.debugDraw(ctx);

    // 2. Spatial grid (células com entidades)
    this.spatialGrid.debugDraw(ctx, 0, 0);

    // 3. Enemy movement lines (verde) - SEMPRE que perseguindo
    ctx.save();
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;

      // Mostrar linha até o player se está perseguindo
      if (enemy.aiState === 'chase' || enemy.aiState === 'attack') {
        // Debug path A* (persiste durante navegação)
        const debugPath = enemy.getDebugPath();
        if (debugPath && debugPath.length > 0) {
          // Desenhar linha conectando waypoints (verde)
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(enemy.centerX, enemy.centerY);
          for (const point of debugPath) {
            ctx.lineTo(point.x, point.y);
          }
          ctx.stroke();

          // Waypoints (círculos verdes)
          ctx.setLineDash([]);
          ctx.fillStyle = '#00ff00';
          for (const point of debugPath) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          // Linha direta até destino (player) - sem A*
          ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(enemy.centerX, enemy.centerY);
          ctx.lineTo(this.player.centerX, this.player.centerY);
          ctx.stroke();
        }
      }
    }
    ctx.restore();

    // 4. Player movement line (laranja para A*, azul para direto) - SEMPRE que se movendo
    ctx.save();
    const playerDebugPath = this.player.getDebugPath();

    // Calcular destino do player (centro do target)
    const destX = this.player.targetX + this.player.width / 2;
    const destY = this.player.targetY + this.player.height / 2;

    // Debug path A* (persiste durante navegação) - tem prioridade
    if (playerDebugPath && playerDebugPath.length > 0) {
      // Desenhar linha conectando waypoints (laranja)
      ctx.strokeStyle = '#ffaa00';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(this.player.centerX, this.player.centerY);
      for (const point of playerDebugPath) {
        ctx.lineTo(point.x, point.y);
      }
      ctx.stroke();

      // Waypoints (círculos laranjas)
      ctx.setLineDash([]);
      ctx.fillStyle = '#ffaa00';
      for (const point of playerDebugPath) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.player.isMoving) {
      // Linha direta até destino (azul) - sem A*
      ctx.strokeStyle = '#00aaff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(this.player.centerX, this.player.centerY);
      ctx.lineTo(destX, destY);
      ctx.stroke();
    }

    // Marcar destino final (sempre visível quando movendo)
    if (this.player.isMoving || playerDebugPath) {
      ctx.setLineDash([]);
      ctx.fillStyle = playerDebugPath ? '#ffaa00' : '#00aaff';
      ctx.beginPath();
      ctx.arc(destX, destY, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 5. Hitboxes das entidades (dois tipos)
    ctx.save();

    // 5a. Hitbox de MOVIMENTO (retangular, magenta transparente)
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.player.x, this.player.y, this.player.width, this.player.height);
    for (const enemy of this.enemies) {
      if (!enemy.isDead) {
        ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);
      }
    }

    // 5b. Hitbox de COMBATE (circular, verde)
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.7)';
    ctx.lineWidth = 2;

    // Player hitRadius (circular)
    ctx.beginPath();
    ctx.arc(this.player.centerX, this.player.centerY, this.player.hitRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Enemy hitRadius (circular)
    for (const enemy of this.enemies) {
      if (!enemy.isDead) {
        ctx.beginPath();
        ctx.arc(enemy.centerX, enemy.centerY, enemy.hitRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();

    // 6. Debug info text
    ctx.save();
    ctx.fillStyle = 'white';
    ctx.font = '12px monospace';
    ctx.fillText(`Debug Mode: ON (F3 to toggle)`, 10, 20);
    ctx.fillText(`Enemies: ${this.enemies.length}`, 10, 35);

    // Player status
    const isBlocked = this.player.isBlocked();
    const isMoving = this.player.isMoving;
    const debugPath = this.player.getDebugPath();

    let pathStatus = 'idle';
    if (isBlocked) {
      pathStatus = 'BLOCKED';
    } else if (debugPath && debugPath.length > 0) {
      pathStatus = `A* (${debugPath.length} waypoints)`;
    } else if (isMoving) {
      pathStatus = 'direct';
    }

    ctx.fillText(`Player: ${pathStatus}`, 10, 50);
    ctx.fillText(`Target: ${this.currentTarget?.id ?? 'none'}`, 10, 65);

    // Minions count
    const waveStats = this.waveSystem.getStats();
    ctx.fillText(`Minions: B:${waveStats.blue} R:${waveStats.red}`, 10, 80);
    ctx.fillText(`Structures: ${this.structures.length}`, 10, 95);
    ctx.restore();

    // 7. Debug das estruturas (range de ataque das torres)
    for (const structure of this.structures) {
      if (!structure.isDead) {
        structure.renderDebug(ctx);
      }
    }

    // 8. Debug dos minions (paths + range)
    ctx.save();
    for (const minion of this.waveSystem.blueMinions) {
      if (!minion.isDead) {
        minion.renderDebug(ctx);
      }
    }
    for (const minion of this.waveSystem.redMinions) {
      if (!minion.isDead) {
        minion.renderDebug(ctx);
      }
    }
    ctx.restore();
  }

  // Resetar jogo
  reset(): void {
    this.clearTarget();
    this.hoveredEnemy = null;
    this.enemies = [];
    this.enemyMap.clear(); // Limpar Map
    Enemy.clearAllEnemies(); // Limpar lista de separation steering
    this.projectiles = [];
    this.particles.clear();
    this.damageNumbers.clear();
    this.effects.clear();
    this.spatialGrid.clear();
    this.collisionSystem.clear();
    this.pathfindingGrid.clearObstacles();
    this.gameMap = initializeGameMap(); // Recriar mapa com obstáculos
    this.waveSystem.reset(); // Resetar waves

    // Resetar estado do jogo
    this.gameState = 'playing';
    this.enemyIdCounter = 0; // Resetar contador de inimigos
    this.currentMinionTarget = null;
    this.progression.reset(); // Resetar Gold/XP/Level
    this.isPlayerDead = false;
    this.playerRespawnTimer = 0;

    // Recriar estruturas (Nexus e Torres)
    this.structures = [];
    const centerY = SIZES.lane.centerY;

    // Nexus e Torre azul
    this.structures.push(new Structure(100, centerY - 40, 'blue', 'nexus'));
    this.structures.push(new Structure(550, centerY - 25, 'blue', 'tower'));

    // Nexus e Torre vermelha
    this.structures.push(new Structure(SIZES.arena.width - 180, centerY - 40, 'red', 'nexus'));
    this.structures.push(new Structure(SIZES.arena.width - 600, centerY - 25, 'red', 'tower'));

    // Recarregar estado do personagem
    this.reloadCharacterState();

    // Recriar player no spawn azul
    const blueSpawn = this.gameMap.getBlueSpawn();
    this.player = new Player(blueSpawn.x, blueSpawn.y);
    this.player.setStatusEffectSystem(this.statusEffects);
    this.player.equipWeapon(this.characterManager.getState().equippedWeapon);

    this.spawnEnemy();
    this.spawnEnemy();
    this.spawnEnemy();
  }

  // Recarregar estado do personagem (loadout + arma)
  reloadCharacterState(): void {
    const characterState = this.characterManager.getState();
    this.loadout = new LoadoutManager(characterState.loadout);
    if (this.player) {
      this.player.equipWeapon(characterState.equippedWeapon);
    }
  }

  // Atualizar loadout externamente (usado pelo CharacterContext)
  setLoadout(loadout: FullLoadout): void {
    this.loadout = new LoadoutManager(loadout);
  }

  // Atualizar arma equipada externamente
  setEquippedWeapon(weaponId: string): void {
    if (this.player) {
      this.player.equipWeapon(weaponId);
    }
  }

  // Obter cooldowns do jogador (para UI)
  getPlayerCooldowns() {
    return { ...this.player.cooldowns };
  }

  // Obter loadout atual
  getLoadout() {
    return this.loadout.getLoadout();
  }

  // Obter HP do jogador
  getPlayerHp(): { current: number; max: number } {
    return {
      current: this.player.hp,
      max: this.player.maxHp,
    };
  }

  // Obter max cooldowns para UI (baseado nas definições)
  getMaxCooldowns(): Record<string, number> {
    return { ...TIMING.cooldowns };
  }

  // Obter arma equipada do player
  getEquippedWeapon(): string {
    return this.player.equippedWeaponId;
  }

  // Obter sistema de progressão
  getProgression(): PlayerProgressionSystem {
    return this.progression;
  }

  // Obter gold atual
  getPlayerGold(): number {
    return this.progression.getGold();
  }

  // Obter level atual
  getPlayerLevel(): number {
    return this.progression.getLevel();
  }

  // Obter XP progress (0-1)
  getXpProgress(): number {
    return this.progression.getXpProgress();
  }

  // Handle window resize
  handleResize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;

    // Atualizar viewport culling
    this.viewport = new ViewportCulling(width, height, 100);

    // Atualizar câmera
    this.camera.resize(width, height);
  }
}
