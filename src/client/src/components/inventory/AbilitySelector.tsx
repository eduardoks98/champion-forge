import { useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import {
  getAllAbilities,
  getAbilitiesByType,
  AbilityType,
  AbilityDefinition,
} from '../../game/data/abilities';
import { Loadout } from '../../game/data/loadout';
import './AbilitySelector.css';

interface AbilitySelectorProps {
  currentAbilityId: string;
  slot: keyof Loadout;
  onSelect: (abilityId: string) => void;
  onClose: () => void;
}

const ABILITY_TYPES: { type: AbilityType; label: string; color: string }[] = [
  { type: 'damage', label: 'Dano', color: '#ff4444' },
  { type: 'cc', label: 'CC', color: '#ffcc00' },
  { type: 'mobility', label: 'Mobilidade', color: '#44aaff' },
  { type: 'defense', label: 'Defesa', color: '#44ff44' },
  { type: 'support', label: 'Suporte', color: '#ffffff' },
  { type: 'ultimate', label: 'Ultimate', color: '#c8aa6e' },
];

export default function AbilitySelector({
  currentAbilityId,
  slot,
  onSelect,
  onClose,
}: AbilitySelectorProps) {
  const { unlockedAbilities, isAbilityEquipped } = useCharacter();
  const [filter, setFilter] = useState<AbilityType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrar habilidades
  const getFilteredAbilities = (): AbilityDefinition[] => {
    let abilities =
      filter === 'all' ? getAllAbilities() : getAbilitiesByType(filter);

    // Filtrar por busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      abilities = abilities.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query)
      );
    }

    // Ordenar: desbloqueadas primeiro, depois por tipo
    return abilities.sort((a, b) => {
      const aUnlocked = unlockedAbilities.includes(a.id);
      const bUnlocked = unlockedAbilities.includes(b.id);
      if (aUnlocked !== bUnlocked) return bUnlocked ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
  };

  const filteredAbilities = getFilteredAbilities();

  // Renderizar card de habilidade
  const renderAbilityCard = (ability: AbilityDefinition) => {
    const isUnlocked = unlockedAbilities.includes(ability.id);
    const isCurrent = ability.id === currentAbilityId;
    const equippedSlot = isAbilityEquipped(ability.id);
    const isEquippedElsewhere = equippedSlot && equippedSlot !== slot;

    const typeInfo = ABILITY_TYPES.find((t) => t.type === ability.type);

    return (
      <div
        key={ability.id}
        className={`ability-selector__card ${!isUnlocked ? 'ability-selector__card--locked' : ''} ${isCurrent ? 'ability-selector__card--current' : ''} ${isEquippedElsewhere ? 'ability-selector__card--equipped' : ''}`}
        onClick={() => isUnlocked && !isEquippedElsewhere && onSelect(ability.id)}
      >
        <div className="ability-selector__card-icon">{ability.icon}</div>
        <div className="ability-selector__card-info">
          <div className="ability-selector__card-name">{ability.name}</div>
          <div
            className="ability-selector__card-type"
            style={{ color: typeInfo?.color }}
          >
            {typeInfo?.label}
          </div>
          <div className="ability-selector__card-desc">{ability.description}</div>
          <div className="ability-selector__card-stats">
            <span>CD: {(ability.cooldown / 1000).toFixed(1)}s</span>
            {ability.damage && <span>Dano: {ability.damage}</span>}
            {ability.range && <span>Range: {ability.range}px</span>}
          </div>
        </div>
        {!isUnlocked && (
          <div className="ability-selector__card-lock">🔒</div>
        )}
        {isCurrent && (
          <div className="ability-selector__card-badge">Atual</div>
        )}
        {isEquippedElsewhere && (
          <div className="ability-selector__card-badge ability-selector__card-badge--equipped">
            Em {equippedSlot}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="ability-selector__overlay" onClick={onClose}>
      <div
        className="ability-selector__modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="ability-selector__header">
          <h2 className="ability-selector__title">
            Selecionar Habilidade para {slot}
          </h2>
          <button className="ability-selector__close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Filters */}
        <div className="ability-selector__filters">
          <div className="ability-selector__search">
            <input
              type="text"
              placeholder="Buscar habilidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="ability-selector__type-filters">
            <button
              className={`ability-selector__type-btn ${filter === 'all' ? 'ability-selector__type-btn--active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Todas
            </button>
            {ABILITY_TYPES.map((t) => (
              <button
                key={t.type}
                className={`ability-selector__type-btn ${filter === t.type ? 'ability-selector__type-btn--active' : ''}`}
                style={
                  filter === t.type
                    ? { borderColor: t.color, color: t.color }
                    : {}
                }
                onClick={() => setFilter(t.type)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="ability-selector__grid">
          {filteredAbilities.map(renderAbilityCard)}
        </div>

        {/* Footer */}
        <div className="ability-selector__footer">
          <span className="ability-selector__count">
            {filteredAbilities.filter((a) => unlockedAbilities.includes(a.id)).length} /{' '}
            {filteredAbilities.length} desbloqueadas
          </span>
        </div>
      </div>
    </div>
  );
}
