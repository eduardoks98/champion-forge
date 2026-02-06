// ==========================================
// COOLDOWN MANAGER - Gerencia cooldowns de abilities
// ==========================================

import { calculateCooldownMs } from '../formulas/statFormulas';
import { DEFAULT_COOLDOWN } from '../constants/gameDefaults';

// ==========================================
// INTERFACE
// ==========================================

export interface CooldownState {
  baseCooldownMs: number;   // Cooldown base em ms
  currentCooldownMs: number; // Tempo restante
  isReady: boolean;         // Pode usar?
  charges?: number;         // Para abilities com charges
  maxCharges?: number;
}

// ==========================================
// COOLDOWN MANAGER
// ==========================================

export class CooldownManager {
  private cooldowns: Map<string, CooldownState> = new Map();
  private abilityHaste: number = 0;

  constructor() {}

  // ==========================================
  // REGISTRO DE ABILITIES
  // ==========================================

  /**
   * Registra uma ability com cooldown
   */
  registerAbility(
    id: string,
    baseCooldownMs: number,
    maxCharges: number = 1
  ): void {
    this.cooldowns.set(id, {
      baseCooldownMs,
      currentCooldownMs: 0,
      isReady: true,
      charges: maxCharges,
      maxCharges,
    });
  }

  /**
   * Remove uma ability
   */
  unregisterAbility(id: string): void {
    this.cooldowns.delete(id);
  }

  /**
   * Limpa todas as abilities
   */
  clear(): void {
    this.cooldowns.clear();
  }

  // ==========================================
  // COOLDOWN CONTROL
  // ==========================================

  /**
   * Inicia cooldown de uma ability
   */
  startCooldown(id: string): void {
    const state = this.cooldowns.get(id);
    if (!state) return;

    // Calcular cooldown com ability haste
    const finalCooldown = calculateCooldownMs(state.baseCooldownMs, this.abilityHaste);

    // Se tem charges, reduzir charge
    if (state.charges !== undefined && state.maxCharges !== undefined) {
      if (state.charges > 0) {
        state.charges--;
      }

      // Só entra em cooldown quando não tem mais charges
      if (state.charges === 0) {
        state.currentCooldownMs = finalCooldown;
        state.isReady = false;
      }
    } else {
      // Ability normal sem charges
      state.currentCooldownMs = finalCooldown;
      state.isReady = false;
    }
  }

  /**
   * Reseta cooldown de uma ability (refund)
   */
  resetCooldown(id: string): void {
    const state = this.cooldowns.get(id);
    if (!state) return;

    state.currentCooldownMs = 0;
    state.isReady = true;

    if (state.charges !== undefined && state.maxCharges !== undefined) {
      state.charges = state.maxCharges;
    }
  }

  /**
   * Reduz cooldown em uma quantidade
   */
  reduceCooldown(id: string, amountMs: number): void {
    const state = this.cooldowns.get(id);
    if (!state) return;

    state.currentCooldownMs = Math.max(0, state.currentCooldownMs - amountMs);

    if (state.currentCooldownMs === 0) {
      state.isReady = true;

      // Restaurar uma charge
      if (state.charges !== undefined && state.maxCharges !== undefined) {
        state.charges = Math.min(state.maxCharges, state.charges + 1);
      }
    }
  }

  /**
   * Reduz cooldown por porcentagem
   */
  reduceCooldownPercent(id: string, percent: number): void {
    const state = this.cooldowns.get(id);
    if (!state) return;

    const reduction = state.currentCooldownMs * (percent / 100);
    this.reduceCooldown(id, reduction);
  }

  /**
   * Reduz cooldown de TODAS as abilities
   */
  reduceAllCooldowns(amountMs: number): void {
    this.cooldowns.forEach((_, id) => {
      this.reduceCooldown(id, amountMs);
    });
  }

  // ==========================================
  // UPDATE
  // ==========================================

  /**
   * Atualiza todos os cooldowns
   * Chamar a cada frame
   */
  update(deltaTimeMs: number): void {
    this.cooldowns.forEach((state, _id) => {
      if (state.currentCooldownMs > 0) {
        state.currentCooldownMs -= deltaTimeMs;

        if (state.currentCooldownMs <= 0) {
          state.currentCooldownMs = 0;
          state.isReady = true;

          // Restaurar uma charge
          if (state.charges !== undefined && state.maxCharges !== undefined) {
            if (state.charges < state.maxCharges) {
              state.charges++;

              // Se não está no máximo de charges, continuar cooldown
              if (state.charges < state.maxCharges) {
                const finalCooldown = calculateCooldownMs(state.baseCooldownMs, this.abilityHaste);
                state.currentCooldownMs = finalCooldown;
                state.isReady = false; // Ainda em cooldown para próxima charge
              }
            }
          }
        }
      }
    });
  }

  // ==========================================
  // ABILITY HASTE
  // ==========================================

  /**
   * Atualiza ability haste (afeta todos os cooldowns futuros)
   */
  setAbilityHaste(haste: number): void {
    this.abilityHaste = haste;
  }

  getAbilityHaste(): number {
    return this.abilityHaste;
  }

  // ==========================================
  // QUERIES
  // ==========================================

  /**
   * Verifica se ability está pronta
   */
  isReady(id: string): boolean {
    const state = this.cooldowns.get(id);
    if (!state) return false;

    // Se tem charges, verificar se tem pelo menos uma
    if (state.charges !== undefined) {
      return state.charges > 0;
    }

    return state.isReady;
  }

  /**
   * Retorna tempo restante de cooldown
   */
  getRemainingCooldown(id: string): number {
    return this.cooldowns.get(id)?.currentCooldownMs ?? DEFAULT_COOLDOWN.REMAINING_COOLDOWN;
  }

  /**
   * Retorna cooldown restante em segundos (para UI)
   */
  getRemainingCooldownSeconds(id: string): number {
    return Math.ceil(this.getRemainingCooldown(id) / 1000);
  }

  /**
   * Retorna progresso do cooldown (0-1, 1 = pronto)
   */
  getCooldownProgress(id: string): number {
    const state = this.cooldowns.get(id);
    if (!state || state.baseCooldownMs === 0) return 1;

    const finalCooldown = calculateCooldownMs(state.baseCooldownMs, this.abilityHaste);
    return 1 - (state.currentCooldownMs / finalCooldown);
  }

  /**
   * Retorna número de charges disponíveis
   */
  getCharges(id: string): number {
    return this.cooldowns.get(id)?.charges ?? 0;
  }

  /**
   * Retorna máximo de charges
   */
  getMaxCharges(id: string): number {
    return this.cooldowns.get(id)?.maxCharges ?? DEFAULT_COOLDOWN.MAX_CHARGES;
  }

  /**
   * Retorna estado completo de uma ability
   */
  getState(id: string): CooldownState | undefined {
    const state = this.cooldowns.get(id);
    return state ? { ...state } : undefined;
  }

  /**
   * Retorna todas as abilities e seus estados
   */
  getAllStates(): Map<string, CooldownState> {
    const result = new Map<string, CooldownState>();
    this.cooldowns.forEach((state, id) => {
      result.set(id, { ...state });
    });
    return result;
  }

  // ==========================================
  // RESET
  // ==========================================

  /**
   * Reseta todos os cooldowns (respawn)
   */
  resetAll(): void {
    this.cooldowns.forEach((state) => {
      state.currentCooldownMs = 0;
      state.isReady = true;
      if (state.charges !== undefined && state.maxCharges !== undefined) {
        state.charges = state.maxCharges;
      }
    });
  }
}

// ==========================================
// FACTORY FUNCTION
// ==========================================

/**
 * Cria CooldownManager com abilities padrão
 */
export function createCooldownManager(abilities: { id: string; cooldownMs: number; charges?: number }[]): CooldownManager {
  const manager = new CooldownManager();

  abilities.forEach((ability) => {
    manager.registerAbility(ability.id, ability.cooldownMs, ability.charges ?? DEFAULT_COOLDOWN.MAX_CHARGES);
  });

  return manager;
}
