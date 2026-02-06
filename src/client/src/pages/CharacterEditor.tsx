// ==========================================
// CHARACTER EDITOR PAGE
// Editor visual para criar personagens e animacoes
// ==========================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { Skeleton, SkeletonFactory, BodyType } from '../game/animation/Skeleton';
import { ProceduralAnimator, AnimationState } from '../game/animation/ProceduralAnimator';
import { SkeletonRenderer, BoneShape, PartStyle } from '../game/animation/SkeletonRenderer';
import { Direction8, getDirectionName, DIRECTION_NAMES } from '../game/animation/Direction';
import { Vector2 } from '../game/utils/Vector2';
import './CharacterEditor.css';

// Configuracao de um bone editavel
interface BoneConfig {
  name: string;
  length: number;
  angle: number;
  thickness: number;
  color: string;
  shape: BoneShape;
}

// Preset de personagem
interface CharacterPreset {
  name: string;
  bodyType: BodyType;
  primaryColor: string;
  secondaryColor: string;
  scale: number;
  bones: Record<string, Partial<BoneConfig>>;
}

// Presets de personagens
const CHARACTER_PRESETS: CharacterPreset[] = [
  {
    name: 'Guerreiro',
    bodyType: 'heroic',
    primaryColor: '#4a90d9',
    secondaryColor: '#3a7bc4',
    scale: 2.5,
    bones: {},
  },
  {
    name: 'Mago',
    bodyType: 'slim',
    primaryColor: '#9b4ad9',
    secondaryColor: '#8a3ac4',
    scale: 2.3,
    bones: {},
  },
  {
    name: 'Tanque',
    bodyType: 'bruiser',
    primaryColor: '#8b4513',
    secondaryColor: '#6b3510',
    scale: 3.0,
    bones: {},
  },
  {
    name: 'Mercador',
    bodyType: 'fat',
    primaryColor: '#cd853f',
    secondaryColor: '#b8742f',
    scale: 2.6,
    bones: {},
  },
  {
    name: 'Inimigo',
    bodyType: 'standard',
    primaryColor: '#d94a4a',
    secondaryColor: '#c43a3a',
    scale: 2.2,
    bones: {},
  },
];

// Lista de shapes disponiveis
const BONE_SHAPES: BoneShape[] = [
  'capsule',
  'circle',
  'oval',
  'tapered',
  'trapezoid',
  'inv-trapezoid',
  'rounded-rect',
  'rectangle',
  'diamond',
  'line',
];

// Lista de bones editaveis
const EDITABLE_BONES = [
  'head',
  'neck',
  'chest',
  'spine',
  'hip',
  'shoulder_L',
  'shoulder_R',
  'arm_L',
  'arm_R',
  'forearm_L',
  'forearm_R',
  'hand_L',
  'hand_R',
  'thigh_L',
  'thigh_R',
  'shin_L',
  'shin_R',
  'foot_L',
  'foot_R',
];

export default function CharacterEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fps, setFps] = useState(0);

  // Estado do personagem
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [primaryColor, setPrimaryColor] = useState('#4a90d9');
  const [secondaryColor, setSecondaryColor] = useState('#3a7bc4');
  const [scale, setScale] = useState(2.5);
  const [bodyType, setBodyType] = useState<BodyType>('standard');

  // Estado da animacao
  const [currentState, setCurrentState] = useState<AnimationState>('idle');
  const [direction, setDirection] = useState<Direction8>(Direction8.S);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);

  // Estado do editor
  const [selectedBone, setSelectedBone] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showBoneNames, setShowBoneNames] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Configuracoes de bones
  const [boneStyles, setBoneStyles] = useState<Record<string, Partial<PartStyle>>>({});

  // Estado de salvamento
  const [characterName, setCharacterName] = useState('MeuPersonagem');

  // Refs para game loop
  const skeletonRef = useRef<Skeleton | null>(null);
  const animatorRef = useRef<ProceduralAnimator | null>(null);
  const rendererRef = useRef<SkeletonRenderer | null>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const fpsCounterRef = useRef({ frames: 0, lastTime: 0 });

  // Criar/recriar skeleton quando parametros mudam
  const createSkeleton = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Criar skeleton com body type selecionado e scale do slider
    const skeleton = SkeletonFactory.createWithBodyType(bodyType, primaryColor, scale);
    skeleton.setFacing(direction);

    // Criar animator
    const animator = new ProceduralAnimator(skeleton);
    animator.setState(currentState);

    // Criar renderer
    const renderer = new SkeletonRenderer(ctx, {
      shadow: true,
      shadowColor: 'rgba(0, 0, 0, 0.4)',
      shadowOffset: { x: 2, y: 4 },
      outlineWidth: 2,
      outlineColor: darkenColor(primaryColor, 40),
      showJoints: showBoneNames,
      showFace: true,
      scale: scale,
    });

    // Aplicar cores
    applyColors(renderer, primaryColor, secondaryColor);

    // Aplicar estilos customizados
    Object.entries(boneStyles).forEach(([boneName, style]) => {
      renderer.setPartStyle(boneName, style);
    });

    skeletonRef.current = skeleton;
    animatorRef.current = animator;
    rendererRef.current = renderer;
  }, [bodyType, primaryColor, secondaryColor, scale, direction, currentState, showBoneNames, boneStyles]);

  // Aplicar cores ao renderer
  const applyColors = (renderer: SkeletonRenderer, primary: string, secondary: string) => {
    const lightColor = lightenColor(primary, 15);

    renderer.setPartStyle('head', { fillColor: lightColor });
    renderer.setPartStyle('chest', { fillColor: primary });
    renderer.setPartStyle('spine', { fillColor: primary });
    renderer.setPartStyle('hip', { fillColor: secondary });
    renderer.setPartStyle('neck', { fillColor: lightColor });

    // Membros
    renderer.setPartStyle('shoulder_L', { fillColor: secondary });
    renderer.setPartStyle('shoulder_R', { fillColor: secondary });
    renderer.setPartStyle('arm_L', { fillColor: secondary });
    renderer.setPartStyle('arm_R', { fillColor: secondary });
    renderer.setPartStyle('forearm_L', { fillColor: secondary });
    renderer.setPartStyle('forearm_R', { fillColor: secondary });
    renderer.setPartStyle('hand_L', { fillColor: lightColor });
    renderer.setPartStyle('hand_R', { fillColor: lightColor });
    renderer.setPartStyle('thigh_L', { fillColor: secondary });
    renderer.setPartStyle('thigh_R', { fillColor: secondary });
    renderer.setPartStyle('shin_L', { fillColor: secondary });
    renderer.setPartStyle('shin_R', { fillColor: secondary });
    renderer.setPartStyle('foot_L', { fillColor: lightColor });
    renderer.setPartStyle('foot_R', { fillColor: lightColor });
  };

  // Inicializacao
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 600;
    canvas.height = 500;

    createSkeleton();

    // Game loop
    const gameLoop = (timestamp: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const skeleton = skeletonRef.current;
      const animator = animatorRef.current;
      const renderer = rendererRef.current;

      if (!canvas || !ctx || !skeleton || !animator || !renderer) {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      // Delta time
      const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0.016;
      lastTimeRef.current = timestamp;

      // FPS counter
      fpsCounterRef.current.frames++;
      if (timestamp - fpsCounterRef.current.lastTime >= 1000) {
        setFps(fpsCounterRef.current.frames);
        fpsCounterRef.current.frames = 0;
        fpsCounterRef.current.lastTime = timestamp;
      }

      // Limpar canvas
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Desenhar grid
      if (showGrid) {
        drawGrid(ctx, canvas.width, canvas.height, zoom);
      }

      // Aplicar zoom
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      // Atualizar animacao
      if (isPlaying) {
        animator.update(deltaTime * animationSpeed, new Vector2(0, 0));
      }

      // Posicionar skeleton no centro
      skeleton.setPosition(canvas.width / 2, canvas.height / 2 + 50);

      // Renderizar
      renderer.render(skeleton);

      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    lastTimeRef.current = performance.now();
    fpsCounterRef.current.lastTime = performance.now();
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Recriar skeleton quando parametros mudam
  useEffect(() => {
    createSkeleton();
  }, [createSkeleton]);

  // Atualizar estado da animacao
  useEffect(() => {
    if (animatorRef.current) {
      animatorRef.current.setState(currentState);
    }
  }, [currentState]);

  // Atualizar direcao
  useEffect(() => {
    if (skeletonRef.current) {
      skeletonRef.current.setFacing(direction);
    }
  }, [direction]);

  // Carregar preset
  const loadPreset = (index: number) => {
    const preset = CHARACTER_PRESETS[index];
    setSelectedPreset(index);
    setPrimaryColor(preset.primaryColor);
    setSecondaryColor(preset.secondaryColor);
    setScale(preset.scale);
    setBodyType(preset.bodyType);
    setBoneStyles({});
  };

  // Atualizar estilo de um bone
  const updateBoneStyle = (boneName: string, style: Partial<PartStyle>) => {
    setBoneStyles(prev => ({
      ...prev,
      [boneName]: { ...prev[boneName], ...style },
    }));
  };

  // Exportar personagem como JSON
  const exportCharacterJSON = () => {
    const characterData = {
      name: characterName,
      bodyType,
      primaryColor,
      secondaryColor,
      scale,
      boneStyles,
      createdAt: new Date().toISOString(),
    };

    const json = JSON.stringify(characterData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${characterName.replace(/\s+/g, '_')}.character.json`;
    a.click();

    URL.revokeObjectURL(url);
  };

  // Exportar como imagem PNG
  const exportCharacterPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Criar canvas limpo com fundo transparente
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 200;
    exportCanvas.height = 250;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Fundo transparente
    ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Criar skeleton temporário para export
    const tempSkeleton = SkeletonFactory.createWithBodyType(bodyType, primaryColor);
    tempSkeleton.setFacing(Direction8.S);
    tempSkeleton.setPosition(exportCanvas.width / 2, exportCanvas.height / 2 + 30);

    const tempRenderer = new SkeletonRenderer(ctx, {
      shadow: true,
      shadowColor: 'rgba(0, 0, 0, 0.4)',
      shadowOffset: { x: 2, y: 4 },
      outlineWidth: 2,
      outlineColor: darkenColor(primaryColor, 40),
      showFace: true,
      scale: scale,
    });

    applyColors(tempRenderer, primaryColor, secondaryColor);
    Object.entries(boneStyles).forEach(([boneName, style]) => {
      tempRenderer.setPartStyle(boneName, style);
    });

    tempSkeleton.updateWorldTransforms();
    tempRenderer.render(tempSkeleton);

    // Download
    const url = exportCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${characterName.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  // Exportar spritesheet com todas as direções
  const exportSpritesheet = () => {
    const frameWidth = 100;
    const frameHeight = 120;
    const directions = [Direction8.S, Direction8.SE, Direction8.E, Direction8.NE, Direction8.N, Direction8.NW, Direction8.W, Direction8.SW];
    const animations: AnimationState[] = ['idle', 'walk', 'attack'];
    const framesPerAnimation = 4;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = frameWidth * framesPerAnimation * animations.length;
    exportCanvas.height = frameHeight * directions.length;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Criar skeleton e renderer
    const tempSkeleton = SkeletonFactory.createWithBodyType(bodyType, primaryColor);
    const tempAnimator = new ProceduralAnimator(tempSkeleton);
    const tempRenderer = new SkeletonRenderer(ctx, {
      shadow: true,
      shadowColor: 'rgba(0, 0, 0, 0.4)',
      shadowOffset: { x: 1, y: 2 },
      outlineWidth: 1.5,
      outlineColor: darkenColor(primaryColor, 40),
      showFace: true,
      scale: scale * 0.4,
    });

    applyColors(tempRenderer, primaryColor, secondaryColor);
    Object.entries(boneStyles).forEach(([boneName, style]) => {
      tempRenderer.setPartStyle(boneName, style);
    });

    // Renderizar cada frame
    directions.forEach((dir, dirIndex) => {
      animations.forEach((anim, animIndex) => {
        tempAnimator.setState(anim);

        for (let frame = 0; frame < framesPerAnimation; frame++) {
          const x = (animIndex * framesPerAnimation + frame) * frameWidth + frameWidth / 2;
          const y = dirIndex * frameHeight + frameHeight / 2 + 20;

          tempSkeleton.setFacing(dir);
          tempSkeleton.setPosition(x, y);

          // Simular tempo da animação
          tempAnimator.update(frame * 0.15, new Vector2(0, 0));
          tempSkeleton.updateWorldTransforms();
          tempRenderer.render(tempSkeleton);
        }
      });
    });

    // Download
    const url = exportCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${characterName.replace(/\s+/g, '_')}_spritesheet.png`;
    a.click();
  };

  // Importar personagem de JSON
  const importCharacterJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.name) setCharacterName(data.name);
        if (data.bodyType) setBodyType(data.bodyType);
        if (data.primaryColor) setPrimaryColor(data.primaryColor);
        if (data.secondaryColor) setSecondaryColor(data.secondaryColor);
        if (data.scale) setScale(data.scale);
        if (data.boneStyles) setBoneStyles(data.boneStyles);
      } catch (err) {
        console.error('Erro ao importar personagem:', err);
        alert('Arquivo inválido!');
      }
    };
    reader.readAsText(file);
  };

  // Desenhar grid
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number, zoom: number) => {
    const gridSize = 20 * zoom;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Linhas centrais
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  };

  return (
    <div className="character-editor">
      <div className="character-editor__header">
        <h1>Character Editor</h1>
        <span className="character-editor__fps">FPS: {fps}</span>
      </div>

      <div className="character-editor__content">
        {/* Painel Esquerdo - Presets e Cores */}
        <div className="character-editor__panel character-editor__panel--left">
          <section className="character-editor__section">
            <h3>Presets</h3>
            <div className="character-editor__presets">
              {CHARACTER_PRESETS.map((preset, index) => (
                <button
                  key={preset.name}
                  className={`character-editor__preset-btn ${selectedPreset === index ? 'active' : ''}`}
                  onClick={() => loadPreset(index)}
                  style={{ borderColor: preset.primaryColor }}
                >
                  <span
                    className="character-editor__preset-color"
                    style={{ background: preset.primaryColor }}
                  />
                  {preset.name}
                </button>
              ))}
            </div>
          </section>

          <section className="character-editor__section">
            <h3>Body Type</h3>
            <div className="character-editor__body-types">
              {(['standard', 'heroic', 'bruiser', 'slim', 'fat'] as BodyType[]).map((type) => (
                <button
                  key={type}
                  className={`character-editor__btn ${bodyType === type ? 'active' : ''}`}
                  onClick={() => setBodyType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </section>

          <section className="character-editor__section">
            <h3>Colors</h3>
            <div className="character-editor__colors">
              <label>
                Primary
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                />
              </label>
              <label>
                Secondary
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="character-editor__section">
            <h3>Scale</h3>
            <div className="character-editor__slider">
              <input
                type="range"
                min="1"
                max="5"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
              />
              <span>{scale.toFixed(1)}x</span>
            </div>
          </section>

          <section className="character-editor__section">
            <h3>Save / Export</h3>
            <div className="character-editor__save">
              <input
                type="text"
                placeholder="Nome do personagem"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                className="character-editor__name-input"
              />
              <div className="character-editor__export-buttons">
                <button className="character-editor__btn" onClick={exportCharacterJSON}>
                  Save JSON
                </button>
                <button className="character-editor__btn" onClick={exportCharacterPNG}>
                  Export PNG
                </button>
                <button className="character-editor__btn" onClick={exportSpritesheet}>
                  Spritesheet
                </button>
              </div>
              <label className="character-editor__import-btn">
                Import JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={importCharacterJSON}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </section>
        </div>

        {/* Canvas Central */}
        <div className="character-editor__canvas-wrapper">
          <canvas ref={canvasRef} className="character-editor__canvas" />

          {/* Direction Wheel */}
          <div className="character-editor__direction-wheel">
            {Object.entries(DIRECTION_NAMES).map(([dir, name]) => {
              const dirNum = parseInt(dir) as Direction8;
              // E=0 deve estar na DIREITA (0°), S=2 em BAIXO (90°), W=4 na ESQUERDA (180°), N=6 em CIMA (-90°)
              // Cada direção = 45°, então dirNum * 45 dá o ângulo correto
              const angle = (dirNum * 45) * (Math.PI / 180);
              const radius = 35;
              const x = Math.cos(angle) * radius + 40;
              const y = Math.sin(angle) * radius + 40;

              return (
                <button
                  key={dir}
                  className={`character-editor__direction-btn ${direction === dirNum ? 'active' : ''}`}
                  style={{ left: x, top: y }}
                  onClick={() => setDirection(dirNum)}
                  title={name}
                >
                  {name}
                </button>
              );
            })}
            <span className="character-editor__direction-label">
              {getDirectionName(direction)}
            </span>
          </div>
        </div>

        {/* Painel Direito - Animacao e Bones */}
        <div className="character-editor__panel character-editor__panel--right">
          <section className="character-editor__section">
            <h3>Animation</h3>
            <div className="character-editor__animations">
              {(['idle', 'walk', 'run', 'attack', 'hit', 'death', 'tpose'] as AnimationState[]).map((state) => (
                <button
                  key={state}
                  className={`character-editor__btn ${currentState === state ? 'active' : ''}`}
                  onClick={() => setCurrentState(state)}
                >
                  {state}
                </button>
              ))}
            </div>

            <div className="character-editor__playback">
              <button
                className={`character-editor__btn ${isPlaying ? 'active' : ''}`}
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <div className="character-editor__slider">
                <label>Speed</label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={animationSpeed}
                  onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                />
                <span>{animationSpeed.toFixed(1)}x</span>
              </div>
            </div>
          </section>

          <section className="character-editor__section">
            <h3>View Options</h3>
            <div className="character-editor__options">
              <label>
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                />
                Show Grid
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={showBoneNames}
                  onChange={(e) => setShowBoneNames(e.target.checked)}
                />
                Show Joints
              </label>
            </div>
            <div className="character-editor__slider">
              <label>Zoom</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
              />
              <span>{zoom.toFixed(1)}x</span>
            </div>
          </section>

          <section className="character-editor__section">
            <h3>Bone Editor</h3>
            <div className="character-editor__bone-list">
              {EDITABLE_BONES.map((bone) => (
                <button
                  key={bone}
                  className={`character-editor__bone-btn ${selectedBone === bone ? 'active' : ''}`}
                  onClick={() => setSelectedBone(selectedBone === bone ? null : bone)}
                >
                  {bone.replace('_', ' ')}
                </button>
              ))}
            </div>

            {selectedBone && (
              <div className="character-editor__bone-editor">
                <h4>Editing: {selectedBone}</h4>
                <label>
                  Shape
                  <select
                    value={boneStyles[selectedBone]?.shape || 'capsule'}
                    onChange={(e) => updateBoneStyle(selectedBone, { shape: e.target.value as BoneShape })}
                  >
                    {BONE_SHAPES.map((shape) => (
                      <option key={shape} value={shape}>{shape}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Color
                  <input
                    type="color"
                    value={boneStyles[selectedBone]?.fillColor || primaryColor}
                    onChange={(e) => updateBoneStyle(selectedBone, { fillColor: e.target.value })}
                  />
                </label>
                <label>
                  Thickness
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={boneStyles[selectedBone]?.thicknessMultiplier || 1}
                    onChange={(e) => updateBoneStyle(selectedBone, { thicknessMultiplier: parseFloat(e.target.value) })}
                  />
                </label>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

// Utility functions
function lightenColor(hex: string, amount: number): string {
  hex = hex.replace('#', '');
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  r = Math.min(255, r + amount);
  g = Math.min(255, g + amount);
  b = Math.min(255, b + amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function darkenColor(hex: string, amount: number): string {
  hex = hex.replace('#', '');
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  r = Math.max(0, r - amount);
  g = Math.max(0, g - amount);
  b = Math.max(0, b - amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
