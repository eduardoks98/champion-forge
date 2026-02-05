import { useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import {
  getAllWeapons,
  getWeaponsByType,
  WeaponType,
  WeaponDefinition,
  RARITY_COLORS,
  WEAPON_TYPES,
  WEAPON_TYPE_NAMES,
} from '../../game/data/weapons';
import './WeaponSelector.css';

interface WeaponSelectorProps {
  currentWeaponId: string;
  onSelect: (weaponId: string) => void;
  onClose: () => void;
}

export default function WeaponSelector({
  currentWeaponId,
  onSelect,
  onClose,
}: WeaponSelectorProps) {
  const { unlockedWeapons } = useCharacter();
  const [filter, setFilter] = useState<WeaponType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrar armas
  const getFilteredWeapons = (): WeaponDefinition[] => {
    let weapons =
      filter === 'all' ? getAllWeapons() : getWeaponsByType(filter);

    // Filtrar por busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      weapons = weapons.filter(
        (w) =>
          w.name.toLowerCase().includes(query) ||
          w.description.toLowerCase().includes(query)
      );
    }

    // Ordenar: desbloqueadas primeiro, depois por tipo e raridade
    const rarityOrder = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
    return weapons.sort((a, b) => {
      const aUnlocked = unlockedWeapons.includes(a.id);
      const bUnlocked = unlockedWeapons.includes(b.id);
      if (aUnlocked !== bUnlocked) return bUnlocked ? 1 : -1;

      // Por raridade (mais rara primeiro)
      const aRarity = rarityOrder.indexOf(a.rarity);
      const bRarity = rarityOrder.indexOf(b.rarity);
      if (aRarity !== bRarity) return aRarity - bRarity;

      return a.name.localeCompare(b.name);
    });
  };

  const filteredWeapons = getFilteredWeapons();

  // Renderizar card de arma
  const renderWeaponCard = (weapon: WeaponDefinition) => {
    const isUnlocked = unlockedWeapons.includes(weapon.id);
    const isCurrent = weapon.id === currentWeaponId;

    return (
      <div
        key={weapon.id}
        className={`weapon-selector__card ${!isUnlocked ? 'weapon-selector__card--locked' : ''} ${isCurrent ? 'weapon-selector__card--current' : ''}`}
        style={{ borderColor: RARITY_COLORS[weapon.rarity] }}
        onClick={() => isUnlocked && onSelect(weapon.id)}
      >
        <div className="weapon-selector__card-icon">{weapon.icon}</div>
        <div className="weapon-selector__card-info">
          <div
            className="weapon-selector__card-name"
            style={{ color: RARITY_COLORS[weapon.rarity] }}
          >
            {weapon.name}
          </div>
          <div className="weapon-selector__card-type">
            {WEAPON_TYPE_NAMES[weapon.type]}
          </div>
          <div className="weapon-selector__card-stats">
            <div className="weapon-selector__stat">
              <span className="weapon-selector__stat-label">Dano</span>
              <span className="weapon-selector__stat-value">{weapon.damage}</span>
            </div>
            <div className="weapon-selector__stat">
              <span className="weapon-selector__stat-label">Vel</span>
              <span className="weapon-selector__stat-value">{weapon.speed}x</span>
            </div>
            <div className="weapon-selector__stat">
              <span className="weapon-selector__stat-label">Range</span>
              <span className="weapon-selector__stat-value">{weapon.range}px</span>
            </div>
          </div>
          <div className="weapon-selector__card-desc">{weapon.description}</div>
          {weapon.special && (
            <div className="weapon-selector__card-special">
              Especial: {weapon.special}
            </div>
          )}
        </div>
        {!isUnlocked && (
          <div className="weapon-selector__card-lock">🔒</div>
        )}
        {isCurrent && (
          <div className="weapon-selector__card-badge">Equipada</div>
        )}
      </div>
    );
  };

  return (
    <div className="weapon-selector__overlay" onClick={onClose}>
      <div
        className="weapon-selector__modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="weapon-selector__header">
          <h2 className="weapon-selector__title">Selecionar Arma</h2>
          <button className="weapon-selector__close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Filters */}
        <div className="weapon-selector__filters">
          <div className="weapon-selector__search">
            <input
              type="text"
              placeholder="Buscar arma..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="weapon-selector__type-filters">
            <button
              className={`weapon-selector__type-btn ${filter === 'all' ? 'weapon-selector__type-btn--active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Todas
            </button>
            {WEAPON_TYPES.map((type) => (
              <button
                key={type}
                className={`weapon-selector__type-btn ${filter === type ? 'weapon-selector__type-btn--active' : ''}`}
                onClick={() => setFilter(type)}
              >
                {WEAPON_TYPE_NAMES[type]}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="weapon-selector__grid">
          {filteredWeapons.map(renderWeaponCard)}
        </div>

        {/* Footer */}
        <div className="weapon-selector__footer">
          <span className="weapon-selector__count">
            {filteredWeapons.filter((w) => unlockedWeapons.includes(w.id)).length} /{' '}
            {filteredWeapons.length} desbloqueadas
          </span>
        </div>
      </div>
    </div>
  );
}
