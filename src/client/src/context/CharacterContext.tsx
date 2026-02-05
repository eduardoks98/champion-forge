import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import {
  CharacterState,
  CharacterManager,
  DEFAULT_CHARACTER_STATE,
} from '../game/data/character';
import { Loadout, FullLoadout } from '../game/data/loadout';

// Contexto
interface CharacterContextType {
  // Estado
  state: CharacterState;
  loadout: FullLoadout;
  equippedWeapon: string;
  equippedPassive: string;
  unlockedAbilities: string[];
  unlockedWeapons: string[];
  unlockedPassives: string[];

  // Acoes de loadout
  setAbilitySlot: (slot: keyof Loadout, abilityId: string) => boolean;
  setEquippedWeapon: (weaponId: string) => boolean;
  setPassive: (passiveId: string) => boolean;

  // Acoes de unlock
  unlockAbility: (abilityId: string) => boolean;
  unlockWeapon: (weaponId: string) => boolean;
  unlockPassive: (passiveId: string) => boolean;
  unlockAll: () => void;

  // Validacao
  isAbilityUnlocked: (abilityId: string) => boolean;
  isWeaponUnlocked: (weaponId: string) => boolean;
  isPassiveUnlocked: (passiveId: string) => boolean;
  isAbilityEquipped: (abilityId: string) => keyof Loadout | null;
  isPassiveEquipped: (passiveId: string) => boolean;

  // Persistencia
  reset: () => void;
  exportData: () => string;
  importData: (data: string) => boolean;
}

const CharacterContext = createContext<CharacterContextType | null>(null);

// Provider
interface CharacterProviderProps {
  children: ReactNode;
}

export function CharacterProvider({ children }: CharacterProviderProps) {
  // Manager singleton
  const [manager] = useState(() => new CharacterManager());

  // Estado reativo
  const [state, setState] = useState<CharacterState>(() => manager.getState());

  // Sincronizar estado apos acoes
  const syncState = useCallback(() => {
    setState(manager.getState());
  }, [manager]);

  // Carregar estado ao montar
  useEffect(() => {
    syncState();
  }, [syncState]);

  // ==================== ACOES ====================

  const setAbilitySlot = useCallback(
    (slot: keyof Loadout, abilityId: string): boolean => {
      const success = manager.setAbilitySlot(slot, abilityId);
      if (success) syncState();
      return success;
    },
    [manager, syncState]
  );

  const setEquippedWeapon = useCallback(
    (weaponId: string): boolean => {
      const success = manager.setEquippedWeapon(weaponId);
      if (success) syncState();
      return success;
    },
    [manager, syncState]
  );

  const setPassive = useCallback(
    (passiveId: string): boolean => {
      const success = manager.setPassive(passiveId);
      if (success) syncState();
      return success;
    },
    [manager, syncState]
  );

  const unlockAbility = useCallback(
    (abilityId: string): boolean => {
      const success = manager.unlockAbility(abilityId);
      if (success) syncState();
      return success;
    },
    [manager, syncState]
  );

  const unlockWeapon = useCallback(
    (weaponId: string): boolean => {
      const success = manager.unlockWeapon(weaponId);
      if (success) syncState();
      return success;
    },
    [manager, syncState]
  );

  const unlockPassive = useCallback(
    (passiveId: string): boolean => {
      const success = manager.unlockPassive(passiveId);
      if (success) syncState();
      return success;
    },
    [manager, syncState]
  );

  const unlockAll = useCallback(() => {
    manager.unlockAll();
    syncState();
  }, [manager, syncState]);

  const reset = useCallback(() => {
    manager.reset();
    syncState();
  }, [manager, syncState]);

  const exportData = useCallback((): string => {
    return manager.export();
  }, [manager]);

  const importData = useCallback(
    (data: string): boolean => {
      const success = manager.import(data);
      if (success) syncState();
      return success;
    },
    [manager, syncState]
  );

  // ==================== VALIDACAO ====================

  const isAbilityUnlocked = useCallback(
    (abilityId: string): boolean => {
      return manager.isAbilityUnlocked(abilityId);
    },
    [manager]
  );

  const isWeaponUnlocked = useCallback(
    (weaponId: string): boolean => {
      return manager.isWeaponUnlocked(weaponId);
    },
    [manager]
  );

  const isPassiveUnlocked = useCallback(
    (passiveId: string): boolean => {
      return manager.isPassiveUnlocked(passiveId);
    },
    [manager]
  );

  const isAbilityEquipped = useCallback(
    (abilityId: string): keyof Loadout | null => {
      return manager.isAbilityEquipped(abilityId);
    },
    [manager]
  );

  const isPassiveEquipped = useCallback(
    (passiveId: string): boolean => {
      return manager.isPassiveEquipped(passiveId);
    },
    [manager]
  );

  // ==================== CONTEXTO ====================

  const value: CharacterContextType = {
    // Estado
    state,
    loadout: state.loadout,
    equippedWeapon: state.equippedWeapon,
    equippedPassive: state.loadout.P,
    unlockedAbilities: state.unlockedAbilities,
    unlockedWeapons: state.unlockedWeapons,
    unlockedPassives: state.unlockedPassives,

    // Acoes de loadout
    setAbilitySlot,
    setEquippedWeapon,
    setPassive,

    // Acoes de unlock
    unlockAbility,
    unlockWeapon,
    unlockPassive,
    unlockAll,

    // Validacao
    isAbilityUnlocked,
    isWeaponUnlocked,
    isPassiveUnlocked,
    isAbilityEquipped,
    isPassiveEquipped,

    // Persistencia
    reset,
    exportData,
    importData,
  };

  return (
    <CharacterContext.Provider value={value}>{children}</CharacterContext.Provider>
  );
}

// Hook
export function useCharacter(): CharacterContextType {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error('useCharacter must be used within a CharacterProvider');
  }
  return context;
}

// Export default state for reference
export { DEFAULT_CHARACTER_STATE };
