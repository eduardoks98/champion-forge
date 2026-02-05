// Mapeamento de tipos de arma para categorias de habilidades permitidas
// Sistema de Weapon Mastery - a arma define quais habilidades podem ser usadas

import { WeaponType } from './weapons';
import { AbilityCategory } from './abilities';

// Mapa principal: cada tipo de arma permite certas categorias de habilidades
export const WEAPON_ABILITY_CATEGORIES: Record<WeaponType, AbilityCategory[]> = {
  // Espadas - melee físico básico
  sword: ['physical_melee', 'universal'],

  // Machados - melee físico pesado
  axe: ['physical_melee', 'universal'],

  // Martelos - melee físico + CC
  hammer: ['physical_melee', 'defense', 'universal'],

  // Lanças - melee com alcance + ranged básico
  spear: ['physical_melee', 'physical_ranged', 'universal'],

  // Arcos - ranged físico
  bow: ['physical_ranged', 'universal'],

  // Cajados - todas as magias
  staff: ['magic_fire', 'magic_ice', 'magic_lightning', 'healing', 'universal'],

  // Adagas - melee rápido + furtividade
  dagger: ['physical_melee', 'stealth', 'universal'],

  // Escudos - defesa + utilidade
  shield: ['defense', 'universal'],
};

// Verificar se uma categoria de habilidade é permitida para um tipo de arma
export function isCategoryAllowedForWeapon(
  category: AbilityCategory,
  weaponType: WeaponType
): boolean {
  const allowedCategories = WEAPON_ABILITY_CATEGORIES[weaponType];
  return allowedCategories.includes(category);
}

// Obter todas as categorias permitidas para um tipo de arma
export function getAllowedCategoriesForWeapon(weaponType: WeaponType): AbilityCategory[] {
  return WEAPON_ABILITY_CATEGORIES[weaponType];
}

// Verificar se múltiplas armas compartilham alguma categoria
export function getSharedCategories(weaponTypes: WeaponType[]): AbilityCategory[] {
  if (weaponTypes.length === 0) return [];
  if (weaponTypes.length === 1) return WEAPON_ABILITY_CATEGORIES[weaponTypes[0]];

  // Interseção de todas as categorias
  let shared = [...WEAPON_ABILITY_CATEGORIES[weaponTypes[0]]];
  for (let i = 1; i < weaponTypes.length; i++) {
    const categories = WEAPON_ABILITY_CATEGORIES[weaponTypes[i]];
    shared = shared.filter(cat => categories.includes(cat));
  }
  return shared;
}

// Nomes amigáveis para as categorias
export const CATEGORY_DISPLAY_NAMES: Record<AbilityCategory, string> = {
  physical_melee: 'Físico Corpo a Corpo',
  physical_ranged: 'Físico à Distância',
  magic_fire: 'Magia de Fogo',
  magic_ice: 'Magia de Gelo',
  magic_lightning: 'Magia de Raio',
  healing: 'Cura',
  defense: 'Defesa',
  stealth: 'Furtividade',
  universal: 'Universal',
};

// Cores por categoria (para UI)
export const CATEGORY_COLORS: Record<AbilityCategory, string> = {
  physical_melee: '#e74c3c',     // Vermelho
  physical_ranged: '#27ae60',    // Verde
  magic_fire: '#e67e22',         // Laranja
  magic_ice: '#3498db',          // Azul
  magic_lightning: '#f1c40f',    // Amarelo
  healing: '#2ecc71',            // Verde claro
  defense: '#95a5a6',            // Cinza
  stealth: '#9b59b6',            // Roxo
  universal: '#c8aa6e',          // Dourado
};

// Descrição de cada tipo de arma (para tooltips)
export const WEAPON_TYPE_DESCRIPTIONS: Record<WeaponType, string> = {
  sword: 'Arma versátil para combate corpo a corpo. Equilibrada entre dano e velocidade.',
  axe: 'Arma pesada de alto dano. Ideal para ataques devastadores.',
  hammer: 'Arma de impacto com capacidade de atordoar inimigos.',
  spear: 'Arma de longo alcance que pode ser usada tanto melee quanto ranged.',
  bow: 'Arma de longa distância. Perfeita para atacar de longe.',
  staff: 'Canaliza poder mágico. Permite usar todas as magias elementais e cura.',
  dagger: 'Arma rápida e letal. Ideal para ataques furtivos.',
  shield: 'Equipamento defensivo. Permite habilidades de proteção.',
};
