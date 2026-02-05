import { ABILITIES, AbilityDefinition, getAbility } from './abilities';
import { PASSIVES, PassiveDefinition, getPassive, DEFAULT_PASSIVE } from './passives';
import { WeaponType } from './weapons';
import { BuildSystem } from '../systems/BuildSystem';

// Slots de habilidade ativáveis (Q W E R D F)
export type AbilitySlot = 'Q' | 'W' | 'E' | 'R' | 'D' | 'F';

// Todos os slots incluindo P (passiva - não ativável)
export type AllSlots = AbilitySlot | 'P';

// Array dos slots para iteração
export const ABILITY_SLOTS: AbilitySlot[] = ['Q', 'W', 'E', 'R', 'D', 'F'];
export const ALL_SLOTS: AllSlots[] = ['Q', 'W', 'E', 'R', 'D', 'F', 'P'];

// Loadout do jogador - mapeia slots para ability IDs
export interface Loadout {
  Q: string;
  W: string;
  E: string;
  R: string;     // Apenas Ultimates
  D: string;     // Summoner spell 1
  F: string;     // Summoner spell 2
}

// Loadout completo incluindo passiva
export interface FullLoadout extends Loadout {
  P: string;     // Passiva do personagem (não ativável)
}

// Loadout padrão para novos jogadores
export const DEFAULT_LOADOUT: FullLoadout = {
  Q: 'fireball',
  W: 'iceSpear',
  E: 'lightning',
  R: 'meteor',
  D: 'dash',
  F: 'heal',
  P: DEFAULT_PASSIVE,
};

// Resultado de uma operação de set
export interface SetSlotResult {
  success: boolean;
  error?: string;
}

// Classe para gerenciar o loadout
export class LoadoutManager {
  private loadout: FullLoadout;
  private equippedWeaponType: WeaponType;

  constructor(
    initialLoadout: FullLoadout = DEFAULT_LOADOUT,
    weaponType: WeaponType = 'staff'
  ) {
    this.loadout = { ...initialLoadout };
    this.equippedWeaponType = weaponType;
  }

  // Definir arma equipada (para validações)
  setWeaponType(weaponType: WeaponType): void {
    this.equippedWeaponType = weaponType;
  }

  // Obter arma equipada
  getWeaponType(): WeaponType {
    return this.equippedWeaponType;
  }

  // Obter ability ID de um slot
  getAbilityId(slot: AbilitySlot): string {
    return this.loadout[slot];
  }

  // Obter passiva ID
  getPassiveId(): string {
    return this.loadout.P;
  }

  // Obter definição da ability de um slot
  getAbility(slot: AbilitySlot): AbilityDefinition | undefined {
    const id = this.loadout[slot];
    return getAbility(id);
  }

  // Obter definição da passiva
  getPassive(): PassiveDefinition | undefined {
    return getPassive(this.loadout.P);
  }

  // Trocar ability de um slot com validação completa
  setSlot(slot: AbilitySlot, abilityId: string): SetSlotResult {
    const ability = ABILITIES[abilityId];
    if (!ability) {
      return { success: false, error: `Habilidade "${abilityId}" não encontrada` };
    }

    // Validação: Slot R só aceita ultimates
    if (slot === 'R' && ability.type !== 'ultimate') {
      return {
        success: false,
        error: 'Slot R é reservado para habilidades Ultimate',
      };
    }

    // Validação: Ultimates só podem ir no slot R
    if (ability.type === 'ultimate' && slot !== 'R') {
      return {
        success: false,
        error: 'Habilidades Ultimate só podem ser colocadas no slot R',
      };
    }

    // Validação: Habilidade compatível com arma equipada
    const weaponCheck = BuildSystem.canUseAbility(abilityId, this.equippedWeaponType);
    if (!weaponCheck.valid) {
      return {
        success: false,
        error: weaponCheck.reason || 'Habilidade incompatível com arma',
      };
    }

    this.loadout[slot] = abilityId;
    return { success: true };
  }

  // Trocar passiva com validação
  setPassive(passiveId: string): SetSlotResult {
    const passive = PASSIVES[passiveId];
    if (!passive) {
      return { success: false, error: `Passiva "${passiveId}" não encontrada` };
    }

    // Validação: Passiva compatível com arma equipada
    const weaponCheck = BuildSystem.canUsePassive(passiveId, this.equippedWeaponType);
    if (!weaponCheck.valid) {
      return {
        success: false,
        error: weaponCheck.reason || 'Passiva incompatível com arma',
      };
    }

    this.loadout.P = passiveId;
    return { success: true };
  }

  // Obter loadout de abilities (sem passiva)
  getLoadout(): Loadout {
    const { P, ...abilityLoadout } = this.loadout;
    return abilityLoadout;
  }

  // Obter loadout completo (com passiva)
  getFullLoadout(): FullLoadout {
    return { ...this.loadout };
  }

  // Obter todas as abilities equipadas com suas definições
  getEquippedAbilities(): Record<AbilitySlot, AbilityDefinition | undefined> {
    return {
      Q: this.getAbility('Q'),
      W: this.getAbility('W'),
      E: this.getAbility('E'),
      R: this.getAbility('R'),
      D: this.getAbility('D'),
      F: this.getAbility('F'),
    };
  }

  // Verificar se uma ability está equipada em algum slot
  isAbilityEquipped(abilityId: string): AbilitySlot | null {
    for (const slot of ABILITY_SLOTS) {
      if (this.loadout[slot] === abilityId) {
        return slot;
      }
    }
    return null;
  }

  // Verificar se loadout atual é válido para a arma equipada
  validateCurrentLoadout(): SetSlotResult[] {
    const errors: SetSlotResult[] = [];

    // Validar cada slot de ability
    for (const slot of ABILITY_SLOTS) {
      const abilityId = this.loadout[slot];
      const ability = getAbility(abilityId);

      if (!ability) {
        errors.push({ success: false, error: `Slot ${slot}: Habilidade não encontrada` });
        continue;
      }

      // Verificar slot R = ultimate
      if (slot === 'R' && ability.type !== 'ultimate') {
        errors.push({ success: false, error: `Slot R: Apenas ultimates permitidas` });
      }

      // Verificar compatibilidade com arma
      const weaponCheck = BuildSystem.canUseAbility(abilityId, this.equippedWeaponType);
      if (!weaponCheck.valid) {
        errors.push({ success: false, error: `Slot ${slot}: ${weaponCheck.reason}` });
      }
    }

    // Validar passiva
    const passiveCheck = BuildSystem.canUsePassive(this.loadout.P, this.equippedWeaponType);
    if (!passiveCheck.valid) {
      errors.push({ success: false, error: `Passiva: ${passiveCheck.reason}` });
    }

    return errors;
  }

  // Verificar se loadout é completamente válido
  isValid(): boolean {
    return this.validateCurrentLoadout().length === 0;
  }

  // Resetar para loadout padrão
  reset(): void {
    this.loadout = { ...DEFAULT_LOADOUT };
  }

  // Limpar habilidades inválidas para a arma atual
  clearInvalidAbilities(): string[] {
    const clearedSlots: string[] = [];

    for (const slot of ABILITY_SLOTS) {
      const abilityId = this.loadout[slot];
      const weaponCheck = BuildSystem.canUseAbility(abilityId, this.equippedWeaponType);

      if (!weaponCheck.valid) {
        // Encontrar uma habilidade válida padrão
        const defaultAbility = this.getDefaultAbilityForSlot(slot);
        if (defaultAbility) {
          this.loadout[slot] = defaultAbility;
          clearedSlots.push(slot);
        }
      }
    }

    // Verificar passiva
    const passiveCheck = BuildSystem.canUsePassive(this.loadout.P, this.equippedWeaponType);
    if (!passiveCheck.valid) {
      this.loadout.P = DEFAULT_PASSIVE;
      clearedSlots.push('P');
    }

    return clearedSlots;
  }

  // Obter habilidade padrão para um slot
  private getDefaultAbilityForSlot(slot: AbilitySlot): string | null {
    if (slot === 'R') {
      // Encontrar uma ultimate válida para a arma
      const ultimates = Object.values(ABILITIES).filter(a => a.type === 'ultimate');
      for (const ult of ultimates) {
        const check = BuildSystem.canUseAbility(ult.id, this.equippedWeaponType);
        if (check.valid) return ult.id;
      }
      return null;
    }

    // Para outros slots, encontrar qualquer habilidade válida
    const abilities = Object.values(ABILITIES).filter(a => a.type !== 'ultimate');
    for (const ability of abilities) {
      const check = BuildSystem.canUseAbility(ability.id, this.equippedWeaponType);
      if (check.valid) return ability.id;
    }
    return null;
  }

  // Serializar para salvar
  serialize(): string {
    return JSON.stringify({
      loadout: this.loadout,
      weaponType: this.equippedWeaponType,
    });
  }

  // Carregar de string serializada
  static deserialize(data: string): LoadoutManager {
    try {
      const parsed = JSON.parse(data);
      return new LoadoutManager(parsed.loadout, parsed.weaponType);
    } catch {
      return new LoadoutManager();
    }
  }
}

// Instância global do loadout (pode ser substituída por Context no React)
export const globalLoadout = new LoadoutManager();

// Descrições dos slots
export const SLOT_DESCRIPTIONS: Record<AllSlots, string> = {
  Q: 'Habilidade Básica 1',
  W: 'Habilidade Básica 2',
  E: 'Habilidade Básica 3',
  R: 'Ultimate (apenas habilidades Ultimate)',
  D: 'Feitiço de Invocador 1',
  F: 'Feitiço de Invocador 2',
  P: 'Passiva do Personagem (sempre ativa)',
};

// Teclas padrão dos slots
export const SLOT_KEYBINDS: Record<AllSlots, string> = {
  Q: 'Q',
  W: 'W',
  E: 'E',
  R: 'R',
  D: 'D',
  F: 'F',
  P: '-',  // Passiva não tem tecla
};
