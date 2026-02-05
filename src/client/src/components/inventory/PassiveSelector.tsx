import { useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import {
  getAllPassives,
  getPassivesByCategory,
  getPassivesForWeapon,
  PassiveCategory,
  PassiveDefinition,
  PASSIVE_CATEGORY_COLORS,
} from '../../game/data/passives';
import { getWeapon, WEAPON_TYPE_NAMES } from '../../game/data/weapons';
import './PassiveSelector.css';

interface PassiveSelectorProps {
  currentPassiveId: string;
  onSelect: (passiveId: string) => void;
  onClose: () => void;
}

const PASSIVE_CATEGORIES: { category: PassiveCategory; label: string; color: string }[] = [
  { category: 'offensive', label: 'Ofensiva', color: PASSIVE_CATEGORY_COLORS.offensive },
  { category: 'defensive', label: 'Defensiva', color: PASSIVE_CATEGORY_COLORS.defensive },
  { category: 'utility', label: 'Utilidade', color: PASSIVE_CATEGORY_COLORS.utility },
  { category: 'hybrid', label: 'Hibrida', color: PASSIVE_CATEGORY_COLORS.hybrid },
];

export default function PassiveSelector({
  currentPassiveId,
  onSelect,
  onClose,
}: PassiveSelectorProps) {
  const { unlockedPassives, equippedWeapon } = useCharacter();
  const [filter, setFilter] = useState<PassiveCategory | 'all' | 'compatible'>('compatible');
  const [searchQuery, setSearchQuery] = useState('');

  const weapon = getWeapon(equippedWeapon);
  const weaponType = weapon?.type;

  // Filtrar passivas
  const getFilteredPassives = (): PassiveDefinition[] => {
    let passives: PassiveDefinition[];

    if (filter === 'all') {
      passives = getAllPassives();
    } else if (filter === 'compatible') {
      passives = weaponType ? getPassivesForWeapon(weaponType) : getAllPassives();
    } else {
      passives = getPassivesByCategory(filter);
    }

    // Filtrar por busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      passives = passives.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    // Ordenar: desbloqueadas primeiro, depois por categoria
    return passives.sort((a, b) => {
      const aUnlocked = unlockedPassives.includes(a.id);
      const bUnlocked = unlockedPassives.includes(b.id);
      if (aUnlocked !== bUnlocked) return bUnlocked ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
  };

  const filteredPassives = getFilteredPassives();

  // Verificar se passiva é compatível com arma atual
  const isCompatibleWithWeapon = (passive: PassiveDefinition): boolean => {
    if (!passive.requiredWeaponTypes || passive.requiredWeaponTypes.length === 0) {
      return true;
    }
    return weaponType ? passive.requiredWeaponTypes.includes(weaponType) : false;
  };

  // Renderizar card de passiva
  const renderPassiveCard = (passive: PassiveDefinition) => {
    const isUnlocked = unlockedPassives.includes(passive.id);
    const isCurrent = passive.id === currentPassiveId;
    const isCompatible = isCompatibleWithWeapon(passive);

    const categoryInfo = PASSIVE_CATEGORIES.find((c) => c.category === passive.category);

    // Descrição dos requisitos de arma
    const getWeaponRequirements = () => {
      if (!passive.requiredWeaponTypes || passive.requiredWeaponTypes.length === 0) {
        return null;
      }
      const names = passive.requiredWeaponTypes.map(t => WEAPON_TYPE_NAMES[t]).join(', ');
      return `Requer: ${names}`;
    };

    return (
      <div
        key={passive.id}
        className={`passive-selector__card ${!isUnlocked ? 'passive-selector__card--locked' : ''} ${isCurrent ? 'passive-selector__card--current' : ''} ${!isCompatible ? 'passive-selector__card--incompatible' : ''}`}
        onClick={() => isUnlocked && isCompatible && onSelect(passive.id)}
      >
        <div className="passive-selector__card-icon">{passive.icon}</div>
        <div className="passive-selector__card-info">
          <div className="passive-selector__card-name">{passive.name}</div>
          <div
            className="passive-selector__card-category"
            style={{ color: categoryInfo?.color }}
          >
            {categoryInfo?.label}
          </div>
          <div className="passive-selector__card-desc">{passive.description}</div>
          {getWeaponRequirements() && (
            <div className="passive-selector__card-requirements">
              {getWeaponRequirements()}
            </div>
          )}
        </div>
        {!isUnlocked && (
          <div className="passive-selector__card-lock">🔒</div>
        )}
        {isCurrent && (
          <div className="passive-selector__card-badge">Equipada</div>
        )}
        {!isCompatible && isUnlocked && (
          <div className="passive-selector__card-badge passive-selector__card-badge--incompatible">
            Incompativel
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="passive-selector__overlay" onClick={onClose}>
      <div
        className="passive-selector__modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="passive-selector__header">
          <h2 className="passive-selector__title">
            Selecionar Passiva do Personagem
          </h2>
          <button className="passive-selector__close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Info */}
        <div className="passive-selector__info">
          <span className="passive-selector__info-icon">ℹ️</span>
          <span>
            Passivas são efeitos permanentes que funcionam automaticamente.
            Você só pode equipar 1 passiva por vez.
          </span>
        </div>

        {/* Arma atual */}
        {weapon && (
          <div className="passive-selector__weapon-info">
            <span>Arma equipada: </span>
            <span className="passive-selector__weapon-name">
              {weapon.icon} {weapon.name}
            </span>
            <span className="passive-selector__weapon-hint">
              (algumas passivas requerem armas específicas)
            </span>
          </div>
        )}

        {/* Filters */}
        <div className="passive-selector__filters">
          <div className="passive-selector__search">
            <input
              type="text"
              placeholder="Buscar passiva..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="passive-selector__type-filters">
            <button
              className={`passive-selector__type-btn ${filter === 'compatible' ? 'passive-selector__type-btn--active' : ''}`}
              onClick={() => setFilter('compatible')}
            >
              Compativeis
            </button>
            <button
              className={`passive-selector__type-btn ${filter === 'all' ? 'passive-selector__type-btn--active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Todas
            </button>
            {PASSIVE_CATEGORIES.map((c) => (
              <button
                key={c.category}
                className={`passive-selector__type-btn ${filter === c.category ? 'passive-selector__type-btn--active' : ''}`}
                style={
                  filter === c.category
                    ? { borderColor: c.color, color: c.color }
                    : {}
                }
                onClick={() => setFilter(c.category)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="passive-selector__grid">
          {filteredPassives.map(renderPassiveCard)}
        </div>

        {/* Footer */}
        <div className="passive-selector__footer">
          <span className="passive-selector__count">
            {filteredPassives.filter((p) => unlockedPassives.includes(p.id)).length} /{' '}
            {filteredPassives.length} desbloqueadas
          </span>
        </div>
      </div>
    </div>
  );
}
