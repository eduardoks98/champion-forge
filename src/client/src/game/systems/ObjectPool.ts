// ==========================================
// OBJECT POOL SYSTEM
// Evita garbage collection reutilizando objetos
// ==========================================

/**
 * Interface para objetos que podem ser poolados
 */
export interface Poolable {
  /** Reseta o objeto para estado inicial */
  reset(): void;
  /** Indica se o objeto está ativo (em uso) */
  active: boolean;
}

/**
 * Pool genérico de objetos
 * Pré-aloca objetos para evitar criação/destruição constante
 */
export class ObjectPool<T extends Poolable> {
  private pool: T[] = [];
  private activeCount: number = 0;
  private factory: () => T;
  private maxSize: number;

  /**
   * @param factory Função que cria novos objetos
   * @param initialSize Quantidade inicial de objetos
   * @param maxSize Tamanho máximo do pool
   */
  constructor(factory: () => T, initialSize: number = 100, maxSize: number = 1000) {
    this.factory = factory;
    this.maxSize = maxSize;

    // Pré-aloca objetos
    for (let i = 0; i < initialSize; i++) {
      const obj = this.factory();
      obj.active = false;
      this.pool.push(obj);
    }
  }

  /**
   * Adquire um objeto do pool
   * Se não houver disponível, cria um novo (até maxSize)
   */
  acquire(): T | null {
    // Procura objeto inativo
    for (let i = 0; i < this.pool.length; i++) {
      if (!this.pool[i].active) {
        this.pool[i].active = true;
        this.activeCount++;
        return this.pool[i];
      }
    }

    // Se não encontrou e ainda pode crescer, cria novo
    if (this.pool.length < this.maxSize) {
      const obj = this.factory();
      obj.active = true;
      this.pool.push(obj);
      this.activeCount++;
      return obj;
    }

    // Pool cheio, retorna null
    return null;
  }

  /**
   * Libera um objeto de volta ao pool
   */
  release(obj: T): void {
    if (obj.active) {
      obj.active = false;
      obj.reset();
      this.activeCount--;
    }
  }

  /**
   * Libera todos os objetos
   */
  releaseAll(): void {
    for (const obj of this.pool) {
      if (obj.active) {
        obj.active = false;
        obj.reset();
      }
    }
    this.activeCount = 0;
  }

  /**
   * Executa callback em todos os objetos ativos
   */
  forEach(callback: (obj: T, index: number) => void): void {
    let index = 0;
    for (const obj of this.pool) {
      if (obj.active) {
        callback(obj, index++);
      }
    }
  }

  /**
   * Filtra objetos ativos
   */
  filter(predicate: (obj: T) => boolean): T[] {
    const result: T[] = [];
    for (const obj of this.pool) {
      if (obj.active && predicate(obj)) {
        result.push(obj);
      }
    }
    return result;
  }

  /**
   * Retorna array de objetos ativos (evite usar em loops, prefira forEach)
   */
  getActive(): T[] {
    return this.pool.filter(obj => obj.active);
  }

  /**
   * Quantidade de objetos ativos
   */
  getActiveCount(): number {
    return this.activeCount;
  }

  /**
   * Tamanho total do pool
   */
  getPoolSize(): number {
    return this.pool.length;
  }

  /**
   * Quantidade disponível
   */
  getAvailableCount(): number {
    return this.pool.length - this.activeCount;
  }
}

// ==========================================
// POOLABLE PARTICLE
// ==========================================

export interface PoolableParticle extends Poolable {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  gravity: number;
  shrink: boolean;
  glow: boolean;
}

export function createPoolableParticle(): PoolableParticle {
  return {
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    size: 5,
    color: '#ffffff',
    life: 0,
    maxLife: 30,
    gravity: 0,
    shrink: true,
    glow: false,
    reset() {
      this.x = 0;
      this.y = 0;
      this.vx = 0;
      this.vy = 0;
      this.size = 5;
      this.color = '#ffffff';
      this.life = 0;
      this.maxLife = 30;
      this.gravity = 0;
      this.shrink = true;
      this.glow = false;
    }
  };
}

// ==========================================
// POOLABLE DAMAGE NUMBER
// ==========================================

export interface PoolableDamageNumber extends Poolable {
  x: number;
  y: number;
  value: number;
  color: string;
  isCrit: boolean;
  life: number;
  maxLife: number;
  vy: number;
  scale: number;
}

export function createPoolableDamageNumber(): PoolableDamageNumber {
  return {
    active: false,
    x: 0,
    y: 0,
    value: 0,
    color: '#ffffff',
    isCrit: false,
    life: 0,
    maxLife: 60,
    vy: -2,
    scale: 1,
    reset() {
      this.x = 0;
      this.y = 0;
      this.value = 0;
      this.color = '#ffffff';
      this.isCrit = false;
      this.life = 0;
      this.maxLife = 60;
      this.vy = -2;
      this.scale = 1;
    }
  };
}

// ==========================================
// POOLABLE EFFECT
// ==========================================

export type EffectType = 'explosion' | 'heal' | 'shield' | 'freeze' | 'lightning' | 'aoe';

export interface PoolableEffect extends Poolable {
  x: number;
  y: number;
  type: EffectType;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
  data: Record<string, unknown>;
}

export function createPoolableEffect(): PoolableEffect {
  return {
    active: false,
    x: 0,
    y: 0,
    type: 'explosion',
    radius: 50,
    color: '#ff0000',
    life: 0,
    maxLife: 30,
    data: {},
    reset() {
      this.x = 0;
      this.y = 0;
      this.type = 'explosion';
      this.radius = 50;
      this.color = '#ff0000';
      this.life = 0;
      this.maxLife = 30;
      this.data = {};
    }
  };
}

// ==========================================
// POOLABLE PROJECTILE
// ==========================================

export interface PoolableProjectile extends Poolable {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  color: string;
  trailColor: string;
  life: number;
  maxLife: number;
  ownerId: string;
  piercing: boolean;
  hitEntities: Set<string>;
}

export function createPoolableProjectile(): PoolableProjectile {
  return {
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    damage: 10,
    radius: 5,
    color: '#ffff00',
    trailColor: '#ff8800',
    life: 0,
    maxLife: 120,
    ownerId: '',
    piercing: false,
    hitEntities: new Set(),
    reset() {
      this.x = 0;
      this.y = 0;
      this.vx = 0;
      this.vy = 0;
      this.damage = 10;
      this.radius = 5;
      this.color = '#ffff00';
      this.trailColor = '#ff8800';
      this.life = 0;
      this.maxLife = 120;
      this.ownerId = '';
      this.piercing = false;
      this.hitEntities.clear();
    }
  };
}

// ==========================================
// GLOBAL POOLS (Singleton)
// ==========================================

let particlePool: ObjectPool<PoolableParticle> | null = null;
let damageNumberPool: ObjectPool<PoolableDamageNumber> | null = null;
let effectPool: ObjectPool<PoolableEffect> | null = null;
let projectilePool: ObjectPool<PoolableProjectile> | null = null;

/**
 * Inicializa todos os pools globais
 */
export function initializePools(): void {
  particlePool = new ObjectPool(createPoolableParticle, 500, 2000);
  damageNumberPool = new ObjectPool(createPoolableDamageNumber, 50, 200);
  effectPool = new ObjectPool(createPoolableEffect, 30, 100);
  projectilePool = new ObjectPool(createPoolableProjectile, 100, 500);

  console.log('[ObjectPool] Pools initialized:', {
    particles: particlePool.getPoolSize(),
    damageNumbers: damageNumberPool.getPoolSize(),
    effects: effectPool.getPoolSize(),
    projectiles: projectilePool.getPoolSize()
  });
}

/**
 * Retorna o pool de partículas
 */
export function getParticlePool(): ObjectPool<PoolableParticle> {
  if (!particlePool) {
    initializePools();
  }
  return particlePool!;
}

/**
 * Retorna o pool de damage numbers
 */
export function getDamageNumberPool(): ObjectPool<PoolableDamageNumber> {
  if (!damageNumberPool) {
    initializePools();
  }
  return damageNumberPool!;
}

/**
 * Retorna o pool de efeitos
 */
export function getEffectPool(): ObjectPool<PoolableEffect> {
  if (!effectPool) {
    initializePools();
  }
  return effectPool!;
}

/**
 * Retorna o pool de projéteis
 */
export function getProjectilePool(): ObjectPool<PoolableProjectile> {
  if (!projectilePool) {
    initializePools();
  }
  return projectilePool!;
}

/**
 * Estatísticas de todos os pools
 */
export function getPoolStats(): Record<string, { active: number; total: number; available: number }> {
  return {
    particles: {
      active: particlePool?.getActiveCount() ?? 0,
      total: particlePool?.getPoolSize() ?? 0,
      available: particlePool?.getAvailableCount() ?? 0
    },
    damageNumbers: {
      active: damageNumberPool?.getActiveCount() ?? 0,
      total: damageNumberPool?.getPoolSize() ?? 0,
      available: damageNumberPool?.getAvailableCount() ?? 0
    },
    effects: {
      active: effectPool?.getActiveCount() ?? 0,
      total: effectPool?.getPoolSize() ?? 0,
      available: effectPool?.getAvailableCount() ?? 0
    },
    projectiles: {
      active: projectilePool?.getActiveCount() ?? 0,
      total: projectilePool?.getPoolSize() ?? 0,
      available: projectilePool?.getAvailableCount() ?? 0
    }
  };
}
