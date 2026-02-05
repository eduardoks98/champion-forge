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

export interface GameStats {
  fps: number;
  entities: number;
  particles: number;
  statusEffects: number;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private running: boolean = false;
  private lastTime: number = 0;
  private frameCount: number = 0;
  private lastFpsTime: number = 0;
  private currentFps: number = 60;

  // Entidades
  private player: Player;
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];

  // Sistemas
  private particles: ParticleSystem;
  private damageNumbers: DamageNumberSystem;
  private effects: EffectSystem;
  private statusEffects: StatusEffectSystem;
  private input: InputManager;

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

  // Callback para atualizar stats na UI
  onStatsUpdate?: (stats: GameStats) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;

    // Inicializar sistemas
    this.particles = new ParticleSystem();
    this.damageNumbers = new DamageNumberSystem();
    this.effects = new EffectSystem();
    this.statusEffects = new StatusEffectSystem();
    this.input = new InputManager();
    this.input.attachCanvas(canvas);

    // Carregar estado do personagem (loadout + arma)
    this.characterManager = new CharacterManager();
    const characterState = this.characterManager.getState();

    // Inicializar loadout do CharacterManager
    this.loadout = new LoadoutManager(characterState.loadout);

    // Criar jogador com arma equipada
    this.player = new Player(100, 200);
    this.player.setStatusEffectSystem(this.statusEffects);
    this.player.equipWeapon(characterState.equippedWeapon);

    // Spawnar alguns inimigos iniciais
    this.spawnEnemy();
    this.spawnEnemy();
    this.spawnEnemy();
  }

  // Iniciar loop do jogo
  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.lastFpsTime = this.lastTime;
    this.gameLoop(this.lastTime);
  }

  // Parar loop do jogo
  stop(): void {
    this.running = false;
  }

  // Loop principal
  private gameLoop = (currentTime: number): void => {
    if (!this.running) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // FPS counter
    this.frameCount++;
    if (currentTime - this.lastFpsTime >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = currentTime;
    }

    this.handleInput();
    this.update(deltaTime);
    this.render();

    // Atualizar stats
    if (this.onStatsUpdate) {
      this.onStatsUpdate({
        fps: this.currentFps,
        entities: 1 + this.enemies.length + this.projectiles.length,
        particles: this.particles.count,
        statusEffects: this.statusEffects.totalEffects,
      });
    }

    // Resetar input no final do frame
    this.input.update();

    requestAnimationFrame(this.gameLoop);
  };

  // Encontrar inimigo sob o mouse
  private getEnemyUnderMouse(mouseX: number, mouseY: number): Enemy | null {
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      const dist = Math.hypot(mouseX - enemy.centerX, mouseY - enemy.centerY);
      // Usar metade da largura como raio de hit
      if (dist < enemy.width / 2 + 5) {
        return enemy;
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
    const mouse = this.input.getMousePosition();

    // Atualizar hover state
    this.updateEnemyHover(mouse.x, mouse.y);

    // Click direito - LoL style targeting
    if (this.input.isRightClick()) {
      const clickedEnemy = this.getEnemyUnderMouse(mouse.x, mouse.y);

      if (clickedEnemy) {
        // Clicou em inimigo = setar como target
        this.setTarget(clickedEnemy);
      } else {
        // Clicou no chão = limpar target e mover
        this.clearTarget();
        this.player.moveTo(mouse.x, mouse.y);
      }
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

    // T - Spawn enemy (para teste)
    if (this.input.isKeyJustPressed('t')) {
      this.spawnEnemy();
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
    // Damage all enemies in cleave arc
    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      if (enemy.isDead) continue;

      if (this.player.isInCleaveArc(enemy.centerX, enemy.centerY)) {
        this.hitEnemy(i, this.player.getCleaveDamage(), 'physical');
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

    // Damage and slow all enemies in range
    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      if (enemy.isDead) continue;

      const dist = this.player.distanceTo(enemy);
      if (dist <= range) {
        // Damage
        this.hitEnemy(i, DAMAGE.frostNova, 'magic');

        // Apply slow
        this.statusEffects.apply(enemy.id, {
          type: 'slow',
          duration: TIMING.statusDurations.frozen,
          value: STATUS_VALUES.slowAmount,
        });
      }
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
    const index = this.enemies.indexOf(target);
    if (index !== -1) {
      this.hitEnemy(index, DAMAGE.stun, 'magic');
    }
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

      // Damage all enemies in radius
      for (let i = 0; i < this.enemies.length; i++) {
        const enemy = this.enemies[i];
        if (enemy.isDead) continue;

        const dist = Math.hypot(enemy.centerX - x, enemy.centerY - y);
        if (dist <= radius) {
          this.hitEnemy(i, this.player.getMeteorDamage(), 'magic');

          // Brief stun from meteor impact
          this.statusEffects.apply(enemy.id, {
            type: 'stun',
            duration: 500, // 0.5s stun
          });
        }
      }

      this.pendingMeteor = null;
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

  // Sistema de Follow + Auto-Attack
  private updateTargetFollow(): void {
    // Se não tem target, não faz nada
    if (!this.currentTarget || this.currentTarget.isDead) {
      this.clearTarget();
      return;
    }

    const dist = this.player.distanceTo(this.currentTarget);
    const attackRange = this.player.getAttackRange();

    if (dist > attackRange) {
      // Fora do range = mover em direção ao target
      this.player.moveTo(this.currentTarget.centerX, this.currentTarget.centerY);
    } else {
      // Dentro do range = parar e atacar
      this.player.stopMoving();

      // Auto-attack se cooldown zerado
      if (this.player.canAttack()) {
        this.player.attack();
        const index = this.enemies.indexOf(this.currentTarget);
        if (index !== -1) {
          this.hitEnemy(index, this.player.getMeleeDamage(), 'physical');
        }
      }
    }
  }

  // Atualizar estado do jogo
  private update(deltaTime: number): void {
    // Atualizar sistemas primeiro
    this.statusEffects.update(deltaTime);

    // Atualizar jogador
    this.player.update(deltaTime);

    // Sistema de Follow + Auto-Attack (LoL style)
    this.updateTargetFollow();

    // Atualizar meteor
    this.updateMeteor(deltaTime);

    // Atualizar inimigos (com IA)
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(deltaTime);

      // Update AI
      const aiResult = enemy.updateAI(this.player.centerX, this.player.centerY, deltaTime);

      // Enemy attacks player
      if (aiResult.shouldAttack) {
        this.enemyAttackPlayer(enemy);
      }

      if (enemy.shouldRemove()) {
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
        this.enemies.splice(i, 1);
      }
    }

    // Atualizar projéteis
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update(deltaTime);

      // Verificar colisão com inimigos
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];
        if (!proj.hasHit(enemy.id) && proj.collidesWith(enemy)) {
          this.hitEnemy(j, proj.getDamage(), 'magic');
          proj.markHit(enemy.id);

          if (!proj.pierce) {
            // Efeito de impacto
            this.particles.burst(proj.centerX, proj.centerY, proj.type === 'fireball' ? 'fire' : 'ice', 1.5);
            this.effects.createExplosion(proj.centerX, proj.centerY, 40, proj.color);
            this.projectiles.splice(i, 1);
            break;
          }
        }
      }

      // Remover se fora da tela
      if (proj.shouldRemove()) {
        this.projectiles.splice(i, 1);
      }
    }

    // Atualizar sistemas
    this.particles.update(deltaTime);
    this.damageNumbers.update(deltaTime);
    this.effects.update(deltaTime);
  }

  // Renderizar
  private render(): void {
    const ctx = this.ctx;

    // Limpar canvas
    ctx.fillStyle = COLORS.arena;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Borda da arena
    ctx.strokeStyle = COLORS.arenaBorder;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, this.canvas.width - 4, this.canvas.height - 4);

    // Renderizar efeitos (abaixo das entidades)
    this.effects.render(ctx);

    // Renderizar inimigos
    for (const enemy of this.enemies) {
      enemy.render(ctx);
    }

    // Renderizar projéteis
    for (const proj of this.projectiles) {
      proj.render(ctx);
    }

    // Renderizar jogador
    this.player.render(ctx);

    // Renderizar partículas (acima das entidades)
    this.particles.render(ctx);

    // Renderizar números de dano (por cima de tudo)
    this.damageNumbers.render(ctx);
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

  // Spawnar inimigo
  spawnEnemy(): void {
    const x = 500 + Math.random() * 250;
    const y = 50 + Math.random() * 400;
    const enemy = new Enemy(x, y, `enemy-${this.enemyIdCounter++}`);
    enemy.setStatusEffectSystem(this.statusEffects);
    this.enemies.push(enemy);
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

  // Causar dano em inimigo
  private hitEnemy(index: number, damage: number, type: 'physical' | 'magic'): void {
    const enemy = this.enemies[index];
    if (!enemy || enemy.isDead) return;

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
    const index = this.enemies.indexOf(target);
    this.hitEnemy(index, DAMAGE.lightning, 'magic');
  }

  // Resetar jogo
  reset(): void {
    this.clearTarget();
    this.hoveredEnemy = null;
    this.enemies = [];
    this.projectiles = [];
    this.particles.clear();
    this.damageNumbers.clear();
    this.effects.clear();

    // Recarregar estado do personagem
    this.reloadCharacterState();

    this.player = new Player(100, 200);
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
}
