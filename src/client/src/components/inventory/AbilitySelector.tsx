import { useState, useCallback } from 'react';
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

// Cores por categoria de habilidade (para borda visual)
const CATEGORY_COLORS: Record<string, string> = {
  physical_melee: '#ff6b35',
  physical_ranged: '#4ecdc4',
  magic_fire: '#ff4757',
  magic_ice: '#70a1ff',
  magic_lightning: '#ffa502',
  healing: '#2ed573',
  defense: '#747d8c',
  stealth: '#a55eea',
  universal: '#c8aa6e',
};

export default function AbilitySelector({
  currentAbilityId,
  slot,
  onSelect,
  onClose,
}: AbilitySelectorProps) {
  const { unlockedAbilities, isAbilityEquipped } = useCharacter();
  const [filter, setFilter] = useState<AbilityType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectingId, setSelectingId] = useState<string | null>(null);

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

  // Handler de seleção com animação
  const handleSelect = useCallback((abilityId: string) => {
    setSelectingId(abilityId);
    // Aguarda a animação antes de fechar
    setTimeout(() => {
      onSelect(abilityId);
    }, 400);
  }, [onSelect]);

  // Renderizar card de habilidade
  const renderAbilityCard = (ability: AbilityDefinition, index: number) => {
    const isUnlocked = unlockedAbilities.includes(ability.id);
    const isCurrent = ability.id === currentAbilityId;
    const equippedSlot = isAbilityEquipped(ability.id);
    const isEquippedElsewhere = equippedSlot && equippedSlot !== slot;
    const isSelecting = selectingId === ability.id;

    const typeInfo = ABILITY_TYPES.find((t) => t.type === ability.type);
    const categoryColor = CATEGORY_COLORS[ability.category] || CATEGORY_COLORS.universal;

    return (
      <div
        key={ability.id}
        className={`ability-selector__card ${!isUnlocked ? 'ability-selector__card--locked' : ''} ${isCurrent ? 'ability-selector__card--current' : ''} ${isEquippedElsewhere ? 'ability-selector__card--equipped' : ''} ${isSelecting ? 'ability-selector__card--selecting' : ''}`}
        onClick={() => isUnlocked && !isEquippedElsewhere && !selectingId && handleSelect(ability.id)}
        style={{
          animationDelay: `${index * 30}ms`,
          borderLeftColor: isUnlocked ? categoryColor : undefined,
          borderLeftWidth: isUnlocked ? '3px' : undefined,
        }}
      >
        <div
          className="ability-selector__card-icon"
          style={{
            boxShadow: isSelecting ? `0 0 20px ${typeInfo?.color || '#c8aa6e'}` : undefined
          }}
        >
          {ability.icon}
        </div>
        <div className="ability-selector__card-info">
          <div className="ability-selector__card-name">{ability.name}</div>
          <div className="ability-selector__card-meta">
            <span
              className="ability-selector__card-type"
              style={{ color: typeInfo?.color }}
            >
              {typeInfo?.label}
            </span>
            <span
              className="ability-selector__card-category"
              style={{ color: categoryColor }}
            >
              {ability.category.replace('_', ' ')}
            </span>
          </div>
          <div className="ability-selector__card-desc">{ability.description}</div>
          <div className="ability-selector__card-stats">
            <span>CD: {(ability.cooldown / 1000).toFixed(1)}s</span>
            {ability.damage && <span>Dano: {ability.damage}</span>}
            {ability.range && <span>Range: {ability.range}px</span>}
            {ability.manaCost && <span>Mana: {ability.manaCost}</span>}
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
        {isSelecting && (
          <div className="ability-selector__card-selecting-overlay">
            <span>Equipando...</span>
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
          {filteredAbilities.map((ability, index) => renderAbilityCard(ability, index))}
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
