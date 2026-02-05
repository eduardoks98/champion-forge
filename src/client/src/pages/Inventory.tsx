import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCharacter } from '../context/CharacterContext';
import { useSocket } from '../context/SocketContext';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import AbilitySelector from '../components/inventory/AbilitySelector';
import WeaponSelector from '../components/inventory/WeaponSelector';
import PassiveSelector from '../components/inventory/PassiveSelector';
import CharacterPreview from '../components/inventory/CharacterPreview';
import { getAbility } from '../game/data/abilities';
import { getWeapon, RARITY_COLORS } from '../game/data/weapons';
import { getPassive, PASSIVE_CATEGORY_COLORS } from '../game/data/passives';
import { getWeaponActive, getWeaponPassive } from '../game/data/weaponAbilities';
import { Loadout } from '../game/data/loadout';
import './Inventory.css';

type SelectorMode = 'ability' | 'weapon' | 'passive' | null;

export default function Inventory() {
  const navigate = useNavigate();
  const { onlineCount } = useSocket();
  const {
    loadout,
    equippedWeapon,
    equippedPassive,
    setAbilitySlot,
    setEquippedWeapon,
    setPassive,
    unlockAll,
  } = useCharacter();

  // Estado dos modais
  const [selectorMode, setSelectorMode] = useState<SelectorMode>(null);
  const [selectedSlot, setSelectedSlot] = useState<keyof Loadout | null>(null);

  // Abrir seletor de habilidade
  const openAbilitySelector = (slot: keyof Loadout) => {
    setSelectedSlot(slot);
    setSelectorMode('ability');
  };

  // Abrir seletor de arma
  const openWeaponSelector = () => {
    setSelectorMode('weapon');
  };

  // Abrir seletor de passiva
  const openPassiveSelector = () => {
    setSelectorMode('passive');
  };

  // Fechar seletor
  const closeSelector = () => {
    setSelectorMode(null);
    setSelectedSlot(null);
  };

  // Selecionar habilidade
  const handleSelectAbility = (abilityId: string) => {
    if (selectedSlot) {
      setAbilitySlot(selectedSlot, abilityId);
    }
    closeSelector();
  };

  // Selecionar arma
  const handleSelectWeapon = (weaponId: string) => {
    setEquippedWeapon(weaponId);
    closeSelector();
  };

  // Selecionar passiva
  const handleSelectPassive = (passiveId: string) => {
    setPassive(passiveId);
    closeSelector();
  };

  // Renderizar slot de habilidade
  const renderAbilitySlot = (slot: keyof Loadout, label: string) => {
    const abilityId = loadout[slot];
    const ability = getAbility(abilityId);

    return (
      <div
        className="inventory__ability-slot"
        onClick={() => openAbilitySelector(slot)}
      >
        <div className="inventory__ability-slot-key">{label}</div>
        <div className="inventory__ability-slot-icon">
          {ability?.icon ?? '?'}
        </div>
        <div className="inventory__ability-slot-name">
          {ability?.name ?? 'Empty'}
        </div>
        <div className="inventory__ability-slot-type">
          {ability?.type ?? ''}
        </div>
      </div>
    );
  };

  // Renderizar arma equipada
  const renderEquippedWeapon = () => {
    const weapon = getWeapon(equippedWeapon);
    if (!weapon) return null;

    const weaponPassive = getWeaponPassive(equippedWeapon);
    const weaponActive = getWeaponActive(equippedWeapon);

    return (
      <div
        className="inventory__weapon-card"
        onClick={openWeaponSelector}
        style={{ borderColor: RARITY_COLORS[weapon.rarity] }}
      >
        <div className="inventory__weapon-icon">{weapon.icon}</div>
        <div className="inventory__weapon-info">
          <div
            className="inventory__weapon-name"
            style={{ color: RARITY_COLORS[weapon.rarity] }}
          >
            {weapon.name}
          </div>
          <div className="inventory__weapon-stats">
            <span>Dano: {weapon.damage}</span>
            <span>Vel: {weapon.speed}x</span>
            <span>Range: {weapon.range}px</span>
          </div>
          <div className="inventory__weapon-desc">{weapon.description}</div>
          {/* Habilidades da arma */}
          {weaponPassive && (
            <div className="inventory__weapon-passive">
              <span className="inventory__weapon-passive-label">Passiva:</span>
              <span>{weaponPassive.description}</span>
            </div>
          )}
          {weaponActive && (
            <div className="inventory__weapon-active">
              <span className="inventory__weapon-active-label">[1] {weaponActive.name}:</span>
              <span>{weaponActive.description}</span>
            </div>
          )}
        </div>
        <div className="inventory__weapon-change">Trocar</div>
      </div>
    );
  };

  // Renderizar passiva do personagem equipada
  const renderEquippedPassive = () => {
    const passive = getPassive(equippedPassive);
    if (!passive) return null;

    return (
      <div
        className="inventory__passive-card"
        onClick={openPassiveSelector}
        style={{ borderColor: PASSIVE_CATEGORY_COLORS[passive.category] }}
      >
        <div className="inventory__passive-slot-key">P</div>
        <div className="inventory__passive-icon">{passive.icon}</div>
        <div className="inventory__passive-info">
          <div
            className="inventory__passive-name"
            style={{ color: PASSIVE_CATEGORY_COLORS[passive.category] }}
          >
            {passive.name}
          </div>
          <div className="inventory__passive-desc">{passive.description}</div>
          <div className="inventory__passive-hint">Sempre ativa (nao precisa ativar)</div>
        </div>
        <div className="inventory__passive-change">Trocar</div>
      </div>
    );
  };

  return (
    <div className="inventory">
      <Header variant="full" onlineCount={onlineCount} />

      <main className="inventory__content">
        <div className="inventory__container">
          {/* Header */}
          <div className="inventory__header">
            <button
              className="inventory__back-btn"
              onClick={() => navigate('/lobby')}
            >
              ← Voltar ao Lobby
            </button>
            <h1 className="inventory__title">Inventario</h1>
            <button
              className="inventory__debug-btn"
              onClick={unlockAll}
              title="Desbloquear tudo (debug)"
            >
              Desbloquear Tudo
            </button>
          </div>

          {/* Main Content Grid */}
          <div className="inventory__grid inventory__grid--three-col">
            {/* Coluna Esquerda - Preview do Personagem */}
            <div className="inventory__section inventory__section--preview">
              <h2 className="inventory__section-title">Preview</h2>
              <CharacterPreview
                weaponId={equippedWeapon}
                loadout={loadout}
                passiveId={equippedPassive}
              />
            </div>

            {/* Coluna Central - Equipamento */}
            <div className="inventory__section">
              <h2 className="inventory__section-title">Arma Equipada</h2>
              {renderEquippedWeapon()}

              <h2 className="inventory__section-title inventory__section-title--passive">
                Passiva do Personagem
              </h2>
              {renderEquippedPassive()}
            </div>

            {/* Coluna Direita - Loadout */}
            <div className="inventory__section">
              <h2 className="inventory__section-title">Loadout de Habilidades</h2>

              {/* Main Abilities */}
              <div className="inventory__loadout-group">
                <h3 className="inventory__loadout-label">Habilidades Principais</h3>
                <div className="inventory__loadout-slots">
                  {renderAbilitySlot('Q', 'Q')}
                  {renderAbilitySlot('W', 'W')}
                  {renderAbilitySlot('E', 'E')}
                  {renderAbilitySlot('R', 'R')}
                </div>
              </div>

              {/* Summoner Spells */}
              <div className="inventory__loadout-group">
                <h3 className="inventory__loadout-label">Summoner Spells</h3>
                <div className="inventory__loadout-slots inventory__loadout-slots--summoner">
                  {renderAbilitySlot('D', 'D')}
                  {renderAbilitySlot('F', 'F')}
                </div>
              </div>
            </div>
          </div>

          {/* Botao Jogar */}
          <div className="inventory__actions">
            <button
              className="inventory__play-btn"
              onClick={() => navigate('/game')}
            >
              Jogar
            </button>
          </div>
        </div>
      </main>

      <Footer />

      {/* Modais */}
      {selectorMode === 'ability' && selectedSlot && (
        <AbilitySelector
          currentAbilityId={loadout[selectedSlot]}
          slot={selectedSlot}
          onSelect={handleSelectAbility}
          onClose={closeSelector}
        />
      )}

      {selectorMode === 'weapon' && (
        <WeaponSelector
          currentWeaponId={equippedWeapon}
          onSelect={handleSelectWeapon}
          onClose={closeSelector}
        />
      )}

      {selectorMode === 'passive' && (
        <PassiveSelector
          currentPassiveId={equippedPassive}
          onSelect={handleSelectPassive}
          onClose={closeSelector}
        />
      )}
    </div>
  );
}
