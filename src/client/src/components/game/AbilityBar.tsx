import { AbilitySlot, Loadout } from '../../game/data/loadout';
import { getAbility } from '../../game/data/abilities';
import './AbilityBar.css';

interface AbilitySlotProps {
  slot: AbilitySlot;
  abilityId: string;
  cooldown: number;
  maxCooldown: number;
}

function AbilitySlotComponent({ slot, abilityId, cooldown, maxCooldown }: AbilitySlotProps) {
  const ability = getAbility(abilityId);
  if (!ability) return null;

  const isReady = cooldown <= 0;
  const cooldownPercent = maxCooldown > 0 ? (cooldown / maxCooldown) * 100 : 0;
  const cooldownDisplay = cooldown > 0 ? (cooldown / 1000).toFixed(1) : '';

  return (
    <div className={`ability-slot ${isReady ? 'ability-slot--ready' : 'ability-slot--cooldown'}`}>
      {/* Icon */}
      <div className="ability-slot__icon">
        <span className="ability-slot__emoji">{ability.icon}</span>
      </div>

      {/* Cooldown overlay */}
      {!isReady && (
        <div
          className="ability-slot__cooldown-overlay"
          style={{ height: `${cooldownPercent}%` }}
        />
      )}

      {/* Cooldown text */}
      {!isReady && (
        <span className="ability-slot__cooldown-text">{cooldownDisplay}</span>
      )}

      {/* Key binding */}
      <span className="ability-slot__key">{slot}</span>
    </div>
  );
}

interface AbilityBarProps {
  loadout: Loadout;
  cooldowns: Record<string, number>;
  maxCooldowns: Record<string, number>;
  currentHp: number;
  maxHp: number;
  currentMana?: number;
  maxMana?: number;
}

export default function AbilityBar({
  loadout,
  cooldowns,
  maxCooldowns,
  currentHp,
  maxHp,
  currentMana = 100,
  maxMana = 100,
}: AbilityBarProps) {
  const hpPercent = (currentHp / maxHp) * 100;
  const manaPercent = (currentMana / maxMana) * 100;

  const mainSlots: AbilitySlot[] = ['Q', 'W', 'E', 'R'];
  const summonerSlots: AbilitySlot[] = ['D', 'F'];

  return (
    <div className="ability-bar">
      {/* Resource bars */}
      <div className="ability-bar__resources">
        <div className="ability-bar__hp-container">
          <div className="ability-bar__hp-fill" style={{ width: `${hpPercent}%` }} />
          <span className="ability-bar__hp-text">
            {Math.floor(currentHp)} / {maxHp}
          </span>
        </div>
        <div className="ability-bar__mana-container">
          <div className="ability-bar__mana-fill" style={{ width: `${manaPercent}%` }} />
          <span className="ability-bar__mana-text">
            {Math.floor(currentMana)} / {maxMana}
          </span>
        </div>
      </div>

      {/* Abilities */}
      <div className="ability-bar__abilities">
        {/* Main abilities - Q W E R */}
        <div className="ability-bar__main-slots">
          {mainSlots.map((slot) => {
            const abilityId = loadout[slot];
            return (
              <AbilitySlotComponent
                key={slot}
                slot={slot}
                abilityId={abilityId}
                cooldown={cooldowns[abilityId] ?? 0}
                maxCooldown={maxCooldowns[abilityId] ?? 0}
              />
            );
          })}
        </div>

        {/* Separator */}
        <div className="ability-bar__separator" />

        {/* Summoner spells - D F */}
        <div className="ability-bar__summoner-slots">
          {summonerSlots.map((slot) => {
            const abilityId = loadout[slot];
            return (
              <AbilitySlotComponent
                key={slot}
                slot={slot}
                abilityId={abilityId}
                cooldown={cooldowns[abilityId] ?? 0}
                maxCooldown={maxCooldowns[abilityId] ?? 0}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
