import { useEffect, useRef, useState } from 'react';
import { SpriteManager, WeaponSpriteType } from '../../game/sprites';
import { getWeapon } from '../../game/data/weapons';
import { getAbility } from '../../game/data/abilities';
import { getPassive } from '../../game/data/passives';
import { Loadout } from '../../game/data/loadout';
import './CharacterPreview.css';

interface CharacterPreviewProps {
  weaponId: string;
  loadout: Loadout;
  passiveId: string;
}

export default function CharacterPreview({ weaponId, loadout, passiveId }: CharacterPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationTime, setAnimationTime] = useState(0);
  const [currentState, setCurrentState] = useState<'idle' | 'walk' | 'attack'>('idle');
  const animationFrameRef = useRef<number>();

  const weapon = getWeapon(weaponId);
  const weaponType = (weapon?.type || 'sword') as WeaponSpriteType;
  const passive = getPassive(passiveId);

  // Animation loop
  useEffect(() => {
    let lastTime = performance.now();

    const animate = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      setAnimationTime(prev => prev + deltaTime);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Cycle through animations
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentState(prev => {
        if (prev === 'idle') return 'walk';
        if (prev === 'walk') return 'attack';
        return 'idle';
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 35;

    // Background glow based on passive
    const passiveColors: Record<string, string> = {
      offensive: '#ff4444',
      defensive: '#4444ff',
      utility: '#44ff44',
      hybrid: '#ffaa00',
    };
    const glowColor = passiveColors[passive?.category || 'offensive'] || '#c8aa6e';

    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 30;
    ctx.fillStyle = 'transparent';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Calculate animation progress
    const animProgress = (animationTime % 1000) / 1000;
    const facingAngle = Math.PI * 0.25 + Math.sin(animationTime / 500) * 0.1;

    // Render character
    SpriteManager.renderProceduralCharacter(
      ctx,
      centerX,
      centerY,
      radius,
      '#c8aa6e', // Player color
      facingAngle,
      currentState,
      animProgress
    );

    // Render weapon
    const isAttacking = currentState === 'attack';
    let weaponAngle = facingAngle;

    if (isAttacking) {
      // Swing animation
      const attackProgress = animProgress;
      if (attackProgress < 0.5) {
        weaponAngle += attackProgress * Math.PI / 2;
      } else {
        weaponAngle += (1 - attackProgress) * Math.PI / 2;
      }
    }

    SpriteManager.renderProceduralWeapon(
      ctx,
      weaponType,
      centerX,
      centerY,
      weaponAngle,
      1,
      isAttacking
    );

    // Ability icons ring
    const abilities = [loadout.Q, loadout.W, loadout.E, loadout.R];
    const ringRadius = 70;

    abilities.forEach((abilityId, index) => {
      const ability = getAbility(abilityId);
      if (!ability) return;

      const angle = -Math.PI / 2 + (index / abilities.length) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * ringRadius;
      const y = centerY + Math.sin(angle) * ringRadius;

      // Glow
      ctx.save();
      ctx.shadowColor = '#c8aa6e';
      ctx.shadowBlur = 8;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Icon
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ability.icon, x, y);

      // Key label
      const keys = ['Q', 'W', 'E', 'R'];
      ctx.font = 'bold 9px Arial';
      ctx.fillStyle = '#888';
      ctx.fillText(keys[index], x, y + 22);
    });

  }, [animationTime, currentState, weaponType, loadout, passive]);

  return (
    <div className="character-preview">
      <div className="character-preview__canvas-container">
        <canvas
          ref={canvasRef}
          width={200}
          height={200}
          className="character-preview__canvas"
        />
        <div className="character-preview__state-indicator">
          {currentState === 'idle' && 'Parado'}
          {currentState === 'walk' && 'Andando'}
          {currentState === 'attack' && 'Atacando'}
        </div>
      </div>

      <div className="character-preview__info">
        <div className="character-preview__weapon">
          <span className="character-preview__weapon-icon">{weapon?.icon}</span>
          <span className="character-preview__weapon-name">{weapon?.name}</span>
        </div>

        {passive && (
          <div className="character-preview__passive">
            <span className="character-preview__passive-icon">{passive.icon}</span>
            <span className="character-preview__passive-name">{passive.name}</span>
          </div>
        )}
      </div>

      <div className="character-preview__abilities">
        {(['Q', 'W', 'E', 'R'] as const).map(key => {
          const ability = getAbility(loadout[key]);
          return (
            <div key={key} className="character-preview__ability">
              <span className="character-preview__ability-key">{key}</span>
              <span className="character-preview__ability-icon">{ability?.icon}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
