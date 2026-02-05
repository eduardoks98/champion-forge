// BuildSystem - Sistema de validação de builds
// Verifica compatibilidade entre armas, habilidades e passivas

import { getAbility, AbilityDefinition, AbilityCategory } from '../data/abilities';
import { getWeapon, WeaponType } from '../data/weapons';
import { getPassive, PassiveDefinition, isPassiveCompatibleWithWeapon } from '../data/passives';
import { WEAPON_ABILITY_CATEGORIES, isCategoryAllowedForWeapon } from '../data/weaponAbilityMap';
import { Loadout, AbilitySlot } from '../data/loadout';

// Resultado de validação
export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

// Classe principal do sistema de builds
export class BuildSystem {
  // Verificar se uma habilidade pode ser usada com uma arma
  static canUseAbility(
    abilityId: string,
    weaponType: WeaponType
  ): ValidationResult {
    const ability = getAbility(abilityId);
    if (!ability) {
      return { valid: false, reason: 'Habilidade não encontrada' };
    }

    // Habilidades universais sempre permitidas
    if (ability.category === 'universal') {
      return { valid: true };
    }

    // Verificar se a arma permite a categoria da habilidade
    if (!isCategoryAllowedForWeapon(ability.category, weaponType)) {
      const weaponName = getWeapon(weaponType)?.name || weaponType;
      return {
        valid: false,
        reason: `${ability.name} requer uma arma que permita ${ability.category}. ${weaponName} não permite.`,
      };
    }

    // Verificar se habilidade requer arma específica
    if (ability.requiredWeaponTypes && ability.requiredWeaponTypes.length > 0) {
      if (!ability.requiredWeaponTypes.includes(weaponType)) {
        const requiredNames = ability.requiredWeaponTypes.join(', ');
        return {
          valid: false,
          reason: `${ability.name} requer: ${requiredNames}`,
        };
      }
    }

    return { valid: true };
  }

  // Verificar se uma passiva pode ser usada com uma arma
  static canUsePassive(
    passiveId: string,
    weaponType: WeaponType
  ): ValidationResult {
    const passive = getPassive(passiveId);
    if (!passive) {
      return { valid: false, reason: 'Passiva não encontrada' };
    }

    if (!isPassiveCompatibleWithWeapon(passiveId, weaponType)) {
      const requiredNames = passive.requiredWeaponTypes?.join(', ') || '';
      return {
        valid: false,
        reason: `${passive.name} requer: ${requiredNames}`,
      };
    }

    return { valid: true };
  }

  // Verificar se uma habilidade pode ir em um slot específico
  static canPlaceInSlot(
    abilityId: string,
    slot: AbilitySlot
  ): ValidationResult {
    const ability = getAbility(abilityId);
    if (!ability) {
      return { valid: false, reason: 'Habilidade não encontrada' };
    }

    // Slot R só aceita ultimates
    if (slot === 'R' && ability.type !== 'ultimate') {
      return {
        valid: false,
        reason: 'Slot R é reservado para habilidades Ultimate',
      };
    }

    // Ultimates só podem ir no slot R
    if (ability.type === 'ultimate' && slot !== 'R') {
      return {
        valid: false,
        reason: 'Habilidades Ultimate só podem ser colocadas no slot R',
      };
    }

    return { valid: true };
  }

  // Validar um loadout completo
  static validateLoadout(
    loadout: Loadout,
    weaponType: WeaponType,
    passiveId?: string
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Validar cada slot de habilidade
    const abilitySlots: AbilitySlot[] = ['Q', 'W', 'E', 'R', 'D', 'F'];
    for (const slot of abilitySlots) {
      const abilityId = loadout[slot];
      if (!abilityId) continue;

      // Verificar se pode ir no slot
      const slotResult = this.canPlaceInSlot(abilityId, slot);
      if (!slotResult.valid) {
        results.push({
          valid: false,
          reason: `Slot ${slot}: ${slotResult.reason}`,
        });
        continue;
      }

      // Verificar se é compatível com a arma
      const weaponResult = this.canUseAbility(abilityId, weaponType);
      if (!weaponResult.valid) {
        results.push({
          valid: false,
          reason: `Slot ${slot}: ${weaponResult.reason}`,
        });
      }
    }

    // Validar passiva se fornecida
    if (passiveId) {
      const passiveResult = this.canUsePassive(passiveId, weaponType);
      if (!passiveResult.valid) {
        results.push({
          valid: false,
          reason: `Passiva: ${passiveResult.reason}`,
        });
      }
    }

    return results;
  }

  // Obter habilidades válidas para um tipo de arma
  static getValidAbilitiesForWeapon(
    weaponType: WeaponType,
    allAbilities: AbilityDefinition[]
  ): AbilityDefinition[] {
    return allAbilities.filter(ability => {
      const result = this.canUseAbility(ability.id, weaponType);
      return result.valid;
    });
  }

  // Obter habilidades válidas para um slot específico
  static getValidAbilitiesForSlot(
    slot: AbilitySlot,
    allAbilities: AbilityDefinition[]
  ): AbilityDefinition[] {
    return allAbilities.filter(ability => {
      const result = this.canPlaceInSlot(ability.id, slot);
      return result.valid;
    });
  }

  // Obter habilidades válidas para arma E slot
  static getValidAbilities(
    weaponType: WeaponType,
    slot: AbilitySlot,
    allAbilities: AbilityDefinition[]
  ): AbilityDefinition[] {
    return allAbilities.filter(ability => {
      const slotResult = this.canPlaceInSlot(ability.id, slot);
      const weaponResult = this.canUseAbility(ability.id, weaponType);
      return slotResult.valid && weaponResult.valid;
    });
  }

  // Obter passivas válidas para um tipo de arma
  static getValidPassivesForWeapon(
    weaponType: WeaponType,
    allPassives: PassiveDefinition[]
  ): PassiveDefinition[] {
    return allPassives.filter(passive => {
      const result = this.canUsePassive(passive.id, weaponType);
      return result.valid;
    });
  }

  // Verificar se uma build é completamente válida
  static isBuildValid(
    loadout: Loadout,
    weaponType: WeaponType,
    passiveId?: string
  ): boolean {
    const results = this.validateLoadout(loadout, weaponType, passiveId);
    return results.every(r => r.valid);
  }

  // Obter categorias permitidas para exibição na UI
  static getAllowedCategoriesForWeapon(weaponType: WeaponType): AbilityCategory[] {
    return WEAPON_ABILITY_CATEGORIES[weaponType] || [];
  }
}

// Exportar instância singleton para uso global
export const buildSystem = new BuildSystem();
