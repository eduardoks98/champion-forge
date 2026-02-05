import { Loadout, FullLoadout, DEFAULT_LOADOUT, ABILITY_SLOTS } from './loadout';
import { DEFAULT_WEAPON } from './weapons';
import { ABILITIES } from './abilities';
import { WEAPONS } from './weapons';
import { DEFAULT_PASSIVE, PASSIVES } from './passives';

// Estado completo do personagem
export interface CharacterState {
  // Loadout atual (Q W E R D F + P)
  loadout: FullLoadout;

  // Arma equipada
  equippedWeapon: string;

  // Habilidades desbloqueadas (IDs)
  unlockedAbilities: string[];

  // Armas desbloqueadas (IDs)
  unlockedWeapons: string[];

  // Passivas desbloqueadas (IDs)
  unlockedPassives: string[];
}

// Habilidades iniciais desbloqueadas
const STARTER_ABILITIES = [
  // Damage
  'fireball', 'iceSpear', 'lightning', 'cleave', 'powerStrike',
  // CC
  'frostNova', 'stun', 'slow',
  // Mobility
  'dash', 'roll', 'blink',
  // Defense
  'shield', 'heal', 'barrier',
  // Support
  'haste', 'cleanse',
  // Ultimate
  'meteor',
];

// Armas iniciais desbloqueadas
const STARTER_WEAPONS = [
  'shortSword',
  'longsword',
  'hatchet',
  'mace',
  'spear',
  'shortBow',
  'woodenStaff',
  'dagger',
];

// Passivas iniciais desbloqueadas
const STARTER_PASSIVES = [
  'ironWill',
  'quickReflexes',
  'vampiric',
  'manaFlow',
  'swiftness',
];

// Estado padrao do personagem
export const DEFAULT_CHARACTER_STATE: CharacterState = {
  loadout: DEFAULT_LOADOUT,
  equippedWeapon: DEFAULT_WEAPON,
  unlockedAbilities: STARTER_ABILITIES,
  unlockedWeapons: STARTER_WEAPONS,
  unlockedPassives: STARTER_PASSIVES,
};

// Chave para localStorage
const STORAGE_KEY = 'champion-forge-character';

// ======================================================================
// CHARACTER MANAGER
// ======================================================================

export class CharacterManager {
  private state: CharacterState;

  constructor(initialState?: CharacterState) {
    this.state = initialState ?? this.loadFromStorage() ?? { ...DEFAULT_CHARACTER_STATE };
  }

  // ==================== GETTERS ====================

  getState(): CharacterState {
    return { ...this.state };
  }

  getLoadout(): FullLoadout {
    return { ...this.state.loadout };
  }

  // Obter apenas o loadout de abilities (sem passiva)
  getAbilityLoadout(): Loadout {
    const { P, ...abilityLoadout } = this.state.loadout;
    return abilityLoadout;
  }

  getEquippedWeapon(): string {
    return this.state.equippedWeapon;
  }

  getEquippedPassive(): string {
    return this.state.loadout.P;
  }

  getUnlockedAbilities(): string[] {
    return [...this.state.unlockedAbilities];
  }

  getUnlockedWeapons(): string[] {
    return [...this.state.unlockedWeapons];
  }

  getUnlockedPassives(): string[] {
    return [...this.state.unlockedPassives];
  }

  // ==================== LOADOUT MANAGEMENT ====================

  // Trocar habilidade em um slot
  setAbilitySlot(slot: keyof Loadout, abilityId: string): boolean {
    // Verificar se a habilidade existe
    if (!ABILITIES[abilityId]) {
      console.warn(`Ability "${abilityId}" not found`);
      return false;
    }

    // Verificar se esta desbloqueada
    if (!this.state.unlockedAbilities.includes(abilityId)) {
      console.warn(`Ability "${abilityId}" not unlocked`);
      return false;
    }

    // Atualizar loadout
    this.state.loadout[slot] = abilityId;
    this.saveToStorage();
    return true;
  }

  // Trocar passiva equipada
  setPassive(passiveId: string): boolean {
    // Verificar se a passiva existe
    if (!PASSIVES[passiveId]) {
      console.warn(`Passive "${passiveId}" not found`);
      return false;
    }

    // Verificar se esta desbloqueada
    if (!this.state.unlockedPassives.includes(passiveId)) {
      console.warn(`Passive "${passiveId}" not unlocked`);
      return false;
    }

    // Atualizar passiva no loadout
    this.state.loadout.P = passiveId;
    this.saveToStorage();
    return true;
  }

  // Trocar arma equipada
  setEquippedWeapon(weaponId: string): boolean {
    // Verificar se a arma existe
    if (!WEAPONS[weaponId]) {
      console.warn(`Weapon "${weaponId}" not found`);
      return false;
    }

    // Verificar se esta desbloqueada
    if (!this.state.unlockedWeapons.includes(weaponId)) {
      console.warn(`Weapon "${weaponId}" not unlocked`);
      return false;
    }

    // Atualizar arma
    this.state.equippedWeapon = weaponId;
    this.saveToStorage();
    return true;
  }

  // ==================== UNLOCK MANAGEMENT ====================

  // Desbloquear habilidade
  unlockAbility(abilityId: string): boolean {
    if (!ABILITIES[abilityId]) {
      console.warn(`Ability "${abilityId}" not found`);
      return false;
    }

    if (this.state.unlockedAbilities.includes(abilityId)) {
      return false; // Ja desbloqueada
    }

    this.state.unlockedAbilities.push(abilityId);
    this.saveToStorage();
    return true;
  }

  // Desbloquear arma
  unlockWeapon(weaponId: string): boolean {
    if (!WEAPONS[weaponId]) {
      console.warn(`Weapon "${weaponId}" not found`);
      return false;
    }

    if (this.state.unlockedWeapons.includes(weaponId)) {
      return false; // Ja desbloqueada
    }

    this.state.unlockedWeapons.push(weaponId);
    this.saveToStorage();
    return true;
  }

  // Desbloquear passiva
  unlockPassive(passiveId: string): boolean {
    if (!PASSIVES[passiveId]) {
      console.warn(`Passive "${passiveId}" not found`);
      return false;
    }

    if (this.state.unlockedPassives.includes(passiveId)) {
      return false; // Ja desbloqueada
    }

    this.state.unlockedPassives.push(passiveId);
    this.saveToStorage();
    return true;
  }

  // Desbloquear todas (para debug/testing)
  unlockAll(): void {
    this.state.unlockedAbilities = Object.keys(ABILITIES);
    this.state.unlockedWeapons = Object.keys(WEAPONS);
    this.state.unlockedPassives = Object.keys(PASSIVES);
    this.saveToStorage();
  }

  // ==================== VALIDATION ====================

  // Verificar se habilidade esta desbloqueada
  isAbilityUnlocked(abilityId: string): boolean {
    return this.state.unlockedAbilities.includes(abilityId);
  }

  // Verificar se arma esta desbloqueada
  isWeaponUnlocked(weaponId: string): boolean {
    return this.state.unlockedWeapons.includes(weaponId);
  }

  // Verificar se passiva esta desbloqueada
  isPassiveUnlocked(passiveId: string): boolean {
    return this.state.unlockedPassives.includes(passiveId);
  }

  // Verificar se habilidade esta equipada
  isAbilityEquipped(abilityId: string): keyof Loadout | null {
    for (const slot of ABILITY_SLOTS) {
      if (this.state.loadout[slot] === abilityId) {
        return slot;
      }
    }
    return null;
  }

  // Verificar se passiva esta equipada
  isPassiveEquipped(passiveId: string): boolean {
    return this.state.loadout.P === passiveId;
  }

  // ==================== PERSISTENCE ====================

  // Salvar no localStorage
  saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.error('Error saving character state:', error);
    }
  }

  // Carregar do localStorage
  loadFromStorage(): CharacterState | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CharacterState;
        // Validar estrutura basica
        if (parsed.loadout && parsed.equippedWeapon && parsed.unlockedAbilities && parsed.unlockedWeapons) {
          // Migrar dados antigos: adicionar passiva se não existir
          if (!parsed.loadout.P) {
            parsed.loadout.P = DEFAULT_PASSIVE;
          }
          if (!parsed.unlockedPassives) {
            parsed.unlockedPassives = STARTER_PASSIVES;
          }
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error loading character state:', error);
    }
    return null;
  }

  // Resetar para padrao
  reset(): void {
    this.state = { ...DEFAULT_CHARACTER_STATE };
    this.saveToStorage();
  }

  // Exportar estado (para backup/sync)
  export(): string {
    return JSON.stringify(this.state);
  }

  // Importar estado
  import(data: string): boolean {
    try {
      const parsed = JSON.parse(data) as CharacterState;
      if (parsed.loadout && parsed.equippedWeapon && parsed.unlockedAbilities && parsed.unlockedWeapons) {
        // Migrar dados antigos
        if (!parsed.loadout.P) {
          parsed.loadout.P = DEFAULT_PASSIVE;
        }
        if (!parsed.unlockedPassives) {
          parsed.unlockedPassives = STARTER_PASSIVES;
        }
        this.state = parsed;
        this.saveToStorage();
        return true;
      }
    } catch {
      console.error('Error importing character state');
    }
    return false;
  }
}

// Instancia global (pode ser substituida por Context)
export const globalCharacter = new CharacterManager();
