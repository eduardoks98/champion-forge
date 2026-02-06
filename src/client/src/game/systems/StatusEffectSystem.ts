// Status Effect Types
export type StatusEffectType = 'slow' | 'stun' | 'root' | 'shield' | 'burn' | 'frozen';

export interface StatusEffect {
  type: StatusEffectType;
  duration: number; // ms remaining
  value?: number;   // e.g., slow percentage (0.5 = 50% slow), shield amount, burn damage
  source?: string;  // who applied the effect
}

export class StatusEffectSystem {
  private effects: Map<string, StatusEffect[]> = new Map();

  // Apply a status effect to an entity
  apply(entityId: string, effect: StatusEffect): void {
    const entityEffects = this.effects.get(entityId) || [];

    // Check if same type of effect already exists
    const existingIndex = entityEffects.findIndex(e => e.type === effect.type);

    if (existingIndex !== -1) {
      // Refresh duration if longer, or replace if more powerful
      const existing = entityEffects[existingIndex];
      if (effect.duration > existing.duration) {
        existing.duration = effect.duration;
      }
      if (effect.value !== undefined && (existing.value === undefined || effect.value > existing.value)) {
        existing.value = effect.value;
      }
    } else {
      // Add new effect
      entityEffects.push({ ...effect });
    }

    this.effects.set(entityId, entityEffects);
  }

  // Remove a specific effect type from an entity
  remove(entityId: string, type: StatusEffectType): void {
    const entityEffects = this.effects.get(entityId);
    if (!entityEffects) return;

    const filtered = entityEffects.filter(e => e.type !== type);
    if (filtered.length === 0) {
      this.effects.delete(entityId);
    } else {
      this.effects.set(entityId, filtered);
    }
  }

  // Clear all effects from an entity
  clearEntity(entityId: string): void {
    this.effects.delete(entityId);
  }

  // Update all effects (tick down durations)
  // OTIMIZADO: swap-and-pop in-place para evitar alocações
  update(deltaTime: number): void {
    for (const [entityId, entityEffects] of this.effects.entries()) {
      // Atualizar durações e remover expirados IN-PLACE (sem criar novo array)
      for (let i = entityEffects.length - 1; i >= 0; i--) {
        const effect = entityEffects[i];
        effect.duration -= deltaTime;

        if (effect.duration <= 0) {
          // Swap-and-pop: muito mais rápido que splice/filter
          entityEffects[i] = entityEffects[entityEffects.length - 1];
          entityEffects.pop();
        }
      }

      if (entityEffects.length === 0) {
        this.effects.delete(entityId);
      }
    }
  }

  // Check if entity is stunned (can't move or act)
  isStunned(entityId: string): boolean {
    const entityEffects = this.effects.get(entityId);
    if (!entityEffects) return false;
    return entityEffects.some(e => e.type === 'stun' || e.type === 'frozen');
  }

  // Check if entity is rooted (can't move but can act)
  isRooted(entityId: string): boolean {
    const entityEffects = this.effects.get(entityId);
    if (!entityEffects) return false;
    return entityEffects.some(e => e.type === 'root');
  }

  // Check if entity can move
  canMove(entityId: string): boolean {
    return !this.isStunned(entityId) && !this.isRooted(entityId);
  }

  // Check if entity can act (use abilities)
  canAct(entityId: string): boolean {
    return !this.isStunned(entityId);
  }

  // Get movement speed multiplier (1.0 = normal, 0.5 = 50% slow)
  getSpeedMultiplier(entityId: string): number {
    const entityEffects = this.effects.get(entityId);
    if (!entityEffects) return 1.0;

    // If stunned or rooted, speed is 0
    if (this.isStunned(entityId) || this.isRooted(entityId)) return 0;

    // Find the strongest slow
    let slowAmount = 0;
    for (const effect of entityEffects) {
      if (effect.type === 'slow' && effect.value !== undefined) {
        slowAmount = Math.max(slowAmount, effect.value);
      }
    }

    // Return speed multiplier (1 - slowAmount), minimum 0.2 (can't slow more than 80%)
    return Math.max(0.2, 1 - slowAmount);
  }

  // Get shield amount for entity
  getShieldAmount(entityId: string): number {
    const entityEffects = this.effects.get(entityId);
    if (!entityEffects) return 0;

    const shieldEffect = entityEffects.find(e => e.type === 'shield');
    return shieldEffect?.value ?? 0;
  }

  // Absorb damage with shield, returns remaining damage
  absorbDamage(entityId: string, damage: number): number {
    const entityEffects = this.effects.get(entityId);
    if (!entityEffects) return damage;

    const shieldIndex = entityEffects.findIndex(e => e.type === 'shield');
    if (shieldIndex === -1) return damage;

    const shield = entityEffects[shieldIndex];
    const shieldAmount = shield.value ?? 0;

    if (shieldAmount >= damage) {
      // Shield absorbs all damage
      shield.value = shieldAmount - damage;
      return 0;
    } else {
      // Shield breaks, some damage goes through
      entityEffects.splice(shieldIndex, 1);
      return damage - shieldAmount;
    }
  }

  // Get all effects for an entity (for UI display)
  getEffects(entityId: string): StatusEffect[] {
    return this.effects.get(entityId) || [];
  }

  // Check if entity has a specific effect
  hasEffect(entityId: string, type: StatusEffectType): boolean {
    const entityEffects = this.effects.get(entityId);
    if (!entityEffects) return false;
    return entityEffects.some(e => e.type === type);
  }

  // Clear all effects in the system
  clear(): void {
    this.effects.clear();
  }

  // Get total number of active effects (for stats)
  get totalEffects(): number {
    let count = 0;
    for (const effects of this.effects.values()) {
      count += effects.length;
    }
    return count;
  }
}
