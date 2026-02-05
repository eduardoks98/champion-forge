/**
 * SpriteManager - Sistema de gerenciamento de sprites e animações
 *
 * Suporta:
 * - Carregamento de sprite sheets
 * - Animações com múltiplos frames
 * - Cache de sprites carregadas
 * - Fallback para renderização procedural
 */

export interface SpriteFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Animation {
  name: string;
  frames: SpriteFrame[];
  frameTime: number; // ms por frame
  loop: boolean;
}

export interface SpriteSheet {
  image: HTMLImageElement;
  frameWidth: number;
  frameHeight: number;
  animations: Map<string, Animation>;
  loaded: boolean;
}

export interface AnimationState {
  currentAnimation: string;
  currentFrame: number;
  elapsedTime: number;
  finished: boolean;
}

// Tipos de armas para sprites
export type WeaponSpriteType = 'sword' | 'axe' | 'hammer' | 'spear' | 'bow' | 'staff' | 'dagger' | 'shield';

// Configuração de cores para renderização procedural (fallback)
export const WEAPON_COLORS: Record<WeaponSpriteType, { primary: string; secondary: string; glow: string }> = {
  sword: { primary: '#c0c0c0', secondary: '#808080', glow: '#ffffff' },
  axe: { primary: '#8b4513', secondary: '#a0522d', glow: '#ff6600' },
  hammer: { primary: '#696969', secondary: '#404040', glow: '#ffcc00' },
  spear: { primary: '#daa520', secondary: '#b8860b', glow: '#ffd700' },
  bow: { primary: '#8b4513', secondary: '#654321', glow: '#90ee90' },
  staff: { primary: '#4b0082', secondary: '#800080', glow: '#9400d3' },
  dagger: { primary: '#2f4f4f', secondary: '#1a1a1a', glow: '#00ffff' },
  shield: { primary: '#b8860b', secondary: '#8b4513', glow: '#ffd700' },
};

// Configuração de formas para cada arma (fallback procedural)
export const WEAPON_SHAPES: Record<WeaponSpriteType, 'blade' | 'heavy' | 'polearm' | 'ranged' | 'magic' | 'shield'> = {
  sword: 'blade',
  axe: 'heavy',
  hammer: 'heavy',
  spear: 'polearm',
  bow: 'ranged',
  staff: 'magic',
  dagger: 'blade',
  shield: 'shield',
};

class SpriteManagerClass {
  private spriteSheets: Map<string, SpriteSheet> = new Map();
  private loadingPromises: Map<string, Promise<SpriteSheet>> = new Map();

  /**
   * Carrega uma sprite sheet
   */
  async loadSpriteSheet(
    key: string,
    src: string,
    frameWidth: number,
    frameHeight: number,
    animations: Record<string, { row: number; frames: number; frameTime: number; loop?: boolean }>
  ): Promise<SpriteSheet> {
    // Retorna do cache se já carregado
    if (this.spriteSheets.has(key)) {
      return this.spriteSheets.get(key)!;
    }

    // Retorna promise existente se já está carregando
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key)!;
    }

    const loadPromise = new Promise<SpriteSheet>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const animMap = new Map<string, Animation>();

        for (const [animName, config] of Object.entries(animations)) {
          const frames: SpriteFrame[] = [];
          for (let i = 0; i < config.frames; i++) {
            frames.push({
              x: i * frameWidth,
              y: config.row * frameHeight,
              width: frameWidth,
              height: frameHeight,
            });
          }
          animMap.set(animName, {
            name: animName,
            frames,
            frameTime: config.frameTime,
            loop: config.loop ?? true,
          });
        }

        const spriteSheet: SpriteSheet = {
          image,
          frameWidth,
          frameHeight,
          animations: animMap,
          loaded: true,
        };

        this.spriteSheets.set(key, spriteSheet);
        this.loadingPromises.delete(key);
        resolve(spriteSheet);
      };

      image.onerror = () => {
        this.loadingPromises.delete(key);
        reject(new Error(`Failed to load sprite sheet: ${src}`));
      };

      image.src = src;
    });

    this.loadingPromises.set(key, loadPromise);
    return loadPromise;
  }

  /**
   * Obtém uma sprite sheet carregada
   */
  getSpriteSheet(key: string): SpriteSheet | undefined {
    return this.spriteSheets.get(key);
  }

  /**
   * Verifica se uma sprite sheet está carregada
   */
  isLoaded(key: string): boolean {
    return this.spriteSheets.has(key) && this.spriteSheets.get(key)!.loaded;
  }

  /**
   * Cria um novo estado de animação
   */
  createAnimationState(initialAnimation: string = 'idle'): AnimationState {
    return {
      currentAnimation: initialAnimation,
      currentFrame: 0,
      elapsedTime: 0,
      finished: false,
    };
  }

  /**
   * Atualiza o estado da animação
   */
  updateAnimation(state: AnimationState, spriteSheet: SpriteSheet, deltaTime: number): void {
    const animation = spriteSheet.animations.get(state.currentAnimation);
    if (!animation) return;

    state.elapsedTime += deltaTime;

    if (state.elapsedTime >= animation.frameTime) {
      state.elapsedTime -= animation.frameTime;
      state.currentFrame++;

      if (state.currentFrame >= animation.frames.length) {
        if (animation.loop) {
          state.currentFrame = 0;
        } else {
          state.currentFrame = animation.frames.length - 1;
          state.finished = true;
        }
      }
    }
  }

  /**
   * Muda a animação atual
   */
  setAnimation(state: AnimationState, animationName: string, resetFrame: boolean = true): void {
    if (state.currentAnimation !== animationName) {
      state.currentAnimation = animationName;
      if (resetFrame) {
        state.currentFrame = 0;
        state.elapsedTime = 0;
      }
      state.finished = false;
    }
  }

  /**
   * Renderiza o frame atual da animação
   */
  renderSprite(
    ctx: CanvasRenderingContext2D,
    spriteSheet: SpriteSheet,
    state: AnimationState,
    x: number,
    y: number,
    width?: number,
    height?: number,
    flipX: boolean = false,
    rotation: number = 0
  ): void {
    const animation = spriteSheet.animations.get(state.currentAnimation);
    if (!animation || animation.frames.length === 0) return;

    const frame = animation.frames[state.currentFrame];
    const renderWidth = width ?? spriteSheet.frameWidth;
    const renderHeight = height ?? spriteSheet.frameHeight;

    ctx.save();
    ctx.translate(x + renderWidth / 2, y + renderHeight / 2);

    if (rotation !== 0) {
      ctx.rotate(rotation);
    }

    if (flipX) {
      ctx.scale(-1, 1);
    }

    ctx.drawImage(
      spriteSheet.image,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      -renderWidth / 2,
      -renderHeight / 2,
      renderWidth,
      renderHeight
    );

    ctx.restore();
  }

  /**
   * Renderiza arma procedural (fallback quando não há sprite)
   */
  renderProceduralWeapon(
    ctx: CanvasRenderingContext2D,
    weaponType: WeaponSpriteType,
    x: number,
    y: number,
    rotation: number,
    scale: number = 1,
    isAttacking: boolean = false
  ): void {
    const colors = WEAPON_COLORS[weaponType];
    const shape = WEAPON_SHAPES[weaponType];

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Glow effect quando atacando
    if (isAttacking) {
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 15 * scale;
    }

    switch (shape) {
      case 'blade':
        this.renderBlade(ctx, colors, scale, weaponType === 'dagger' ? 0.6 : 1);
        break;
      case 'heavy':
        this.renderHeavyWeapon(ctx, colors, scale, weaponType);
        break;
      case 'polearm':
        this.renderPolearm(ctx, colors, scale);
        break;
      case 'ranged':
        this.renderBow(ctx, colors, scale);
        break;
      case 'magic':
        this.renderStaff(ctx, colors, scale, isAttacking);
        break;
      case 'shield':
        this.renderShield(ctx, colors, scale);
        break;
    }

    ctx.restore();
  }

  private renderBlade(
    ctx: CanvasRenderingContext2D,
    colors: { primary: string; secondary: string },
    scale: number,
    lengthMultiplier: number = 1
  ): void {
    const length = 40 * scale * lengthMultiplier;
    const width = 6 * scale;

    // Lâmina
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    ctx.moveTo(0, -width / 2);
    ctx.lineTo(length * 0.8, -width / 3);
    ctx.lineTo(length, 0);
    ctx.lineTo(length * 0.8, width / 3);
    ctx.lineTo(0, width / 2);
    ctx.closePath();
    ctx.fill();

    // Linha central
    ctx.strokeStyle = colors.secondary;
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    ctx.moveTo(5 * scale, 0);
    ctx.lineTo(length * 0.7, 0);
    ctx.stroke();

    // Guarda
    ctx.fillStyle = colors.secondary;
    ctx.fillRect(-2 * scale, -width, 4 * scale, width * 2);

    // Cabo
    ctx.fillStyle = '#4a3728';
    ctx.fillRect(-12 * scale, -width / 2, 10 * scale, width);
  }

  private renderHeavyWeapon(
    ctx: CanvasRenderingContext2D,
    colors: { primary: string; secondary: string },
    scale: number,
    type: WeaponSpriteType
  ): void {
    const handleLength = 25 * scale;
    const headSize = type === 'hammer' ? 18 * scale : 20 * scale;

    // Cabo
    ctx.fillStyle = '#4a3728';
    ctx.fillRect(-handleLength / 2, -3 * scale, handleLength, 6 * scale);

    // Cabeça
    ctx.fillStyle = colors.primary;
    if (type === 'hammer') {
      // Martelo - retângulo
      ctx.fillRect(handleLength / 2 - 5 * scale, -headSize / 2, headSize, headSize);
      ctx.strokeStyle = colors.secondary;
      ctx.lineWidth = 2 * scale;
      ctx.strokeRect(handleLength / 2 - 5 * scale, -headSize / 2, headSize, headSize);
    } else {
      // Machado - forma de machado
      ctx.beginPath();
      ctx.moveTo(handleLength / 2, -headSize / 2);
      ctx.quadraticCurveTo(handleLength / 2 + headSize, -headSize / 2, handleLength / 2 + headSize * 0.8, 0);
      ctx.quadraticCurveTo(handleLength / 2 + headSize, headSize / 2, handleLength / 2, headSize / 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = colors.secondary;
      ctx.lineWidth = 2 * scale;
      ctx.stroke();
    }
  }

  private renderPolearm(
    ctx: CanvasRenderingContext2D,
    colors: { primary: string; secondary: string },
    scale: number
  ): void {
    const length = 55 * scale;
    const tipLength = 15 * scale;

    // Cabo longo
    ctx.fillStyle = '#4a3728';
    ctx.fillRect(-length / 3, -2 * scale, length * 0.8, 4 * scale);

    // Ponta
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    ctx.moveTo(length / 2, 0);
    ctx.lineTo(length / 2 - tipLength, -5 * scale);
    ctx.lineTo(length / 2 - tipLength, 5 * scale);
    ctx.closePath();
    ctx.fill();

    // Detalhe na ponta
    ctx.strokeStyle = colors.secondary;
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    ctx.moveTo(length / 2 - tipLength + 3 * scale, 0);
    ctx.lineTo(length / 2 - 3 * scale, 0);
    ctx.stroke();
  }

  private renderBow(
    ctx: CanvasRenderingContext2D,
    colors: { primary: string; secondary: string },
    scale: number
  ): void {
    const bowHeight = 35 * scale;

    // Arco (curva)
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 4 * scale;
    ctx.beginPath();
    ctx.arc(0, 0, bowHeight / 2, -Math.PI / 2 - 0.3, Math.PI / 2 + 0.3);
    ctx.stroke();

    // Corda
    ctx.strokeStyle = '#d4c4a8';
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    ctx.moveTo(0, -bowHeight / 2 + 3 * scale);
    ctx.lineTo(0, bowHeight / 2 - 3 * scale);
    ctx.stroke();

    // Detalhes
    ctx.fillStyle = colors.secondary;
    ctx.beginPath();
    ctx.arc(0, -bowHeight / 2 + 3 * scale, 2 * scale, 0, Math.PI * 2);
    ctx.arc(0, bowHeight / 2 - 3 * scale, 2 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderStaff(
    ctx: CanvasRenderingContext2D,
    colors: { primary: string; secondary: string; glow: string },
    scale: number,
    isAttacking: boolean
  ): void {
    const length = 50 * scale;
    const orbSize = 8 * scale;

    // Cabo
    ctx.fillStyle = colors.secondary;
    ctx.fillRect(-length / 3, -2 * scale, length * 0.8, 4 * scale);

    // Orbe mágico
    const gradient = ctx.createRadialGradient(
      length / 2 - orbSize / 2, 0, 0,
      length / 2 - orbSize / 2, 0, orbSize
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, colors.glow);
    gradient.addColorStop(1, colors.primary);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(length / 2 - orbSize / 2, 0, orbSize, 0, Math.PI * 2);
    ctx.fill();

    // Partículas mágicas quando atacando
    if (isAttacking) {
      ctx.fillStyle = colors.glow;
      for (let i = 0; i < 5; i++) {
        const angle = (Date.now() / 200 + i * Math.PI * 2 / 5) % (Math.PI * 2);
        const dist = orbSize * 1.5;
        const px = length / 2 - orbSize / 2 + Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist;
        ctx.beginPath();
        ctx.arc(px, py, 2 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private renderShield(
    ctx: CanvasRenderingContext2D,
    colors: { primary: string; secondary: string },
    scale: number
  ): void {
    const width = 25 * scale;
    const height = 30 * scale;

    // Forma do escudo
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    ctx.moveTo(0, -height / 2);
    ctx.lineTo(width / 2, -height / 3);
    ctx.lineTo(width / 2, height / 4);
    ctx.lineTo(0, height / 2);
    ctx.lineTo(-width / 2, height / 4);
    ctx.lineTo(-width / 2, -height / 3);
    ctx.closePath();
    ctx.fill();

    // Borda
    ctx.strokeStyle = colors.secondary;
    ctx.lineWidth = 3 * scale;
    ctx.stroke();

    // Emblema central
    ctx.fillStyle = colors.secondary;
    ctx.beginPath();
    ctx.arc(0, 0, 6 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Renderiza personagem procedural (fallback)
   */
  renderProceduralCharacter(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: string,
    facingAngle: number,
    state: 'idle' | 'walk' | 'attack' | 'dash' | 'cast' | 'hit' | 'stunned',
    animationProgress: number = 0
  ): void {
    ctx.save();
    ctx.translate(x, y);

    // Efeito de estado
    let glowColor = '#00000000';
    let glowIntensity = 0;
    let bodyColor = color;

    switch (state) {
      case 'attack':
        glowColor = '#ff8800';
        glowIntensity = 15;
        break;
      case 'dash':
        glowColor = '#00ffff';
        glowIntensity = 20;
        break;
      case 'cast':
        glowColor = '#ff00ff';
        glowIntensity = 25 + Math.sin(animationProgress * Math.PI * 4) * 10;
        break;
      case 'hit':
        bodyColor = animationProgress > 0.5 ? '#ff4444' : color;
        break;
      case 'stunned':
        bodyColor = '#8888ff';
        glowColor = '#0000ff';
        glowIntensity = 10;
        break;
    }

    // Glow
    if (glowIntensity > 0) {
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = glowIntensity;
    }

    // Corpo principal
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Indicador de direção (olhos/face)
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    const eyeOffset = radius * 0.4;
    const eyeSize = radius * 0.15;

    ctx.save();
    ctx.rotate(facingAngle);

    // Olhos
    ctx.beginPath();
    ctx.arc(eyeOffset, -eyeSize * 1.5, eyeSize, 0, Math.PI * 2);
    ctx.arc(eyeOffset, eyeSize * 1.5, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    // Pupilas
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(eyeOffset + eyeSize * 0.3, -eyeSize * 1.5, eyeSize * 0.5, 0, Math.PI * 2);
    ctx.arc(eyeOffset + eyeSize * 0.3, eyeSize * 1.5, eyeSize * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Efeito de movimento (walk)
    if (state === 'walk') {
      const bounceOffset = Math.sin(animationProgress * Math.PI * 8) * 2;
      ctx.translate(0, bounceOffset);
    }

    // Efeito de stunned (estrelas girando)
    if (state === 'stunned') {
      ctx.fillStyle = '#ffff00';
      for (let i = 0; i < 3; i++) {
        const angle = animationProgress * Math.PI * 4 + (i * Math.PI * 2 / 3);
        const starX = Math.cos(angle) * (radius + 8);
        const starY = Math.sin(angle) * (radius + 8) - radius - 5;
        this.renderStar(ctx, starX, starY, 4, 5);
      }
    }

    ctx.restore();
  }

  private renderStar(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, points: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? radius : radius / 2;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      if (i === 0) {
        ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
      } else {
        ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /**
   * Limpa todas as sprites carregadas
   */
  clear(): void {
    this.spriteSheets.clear();
    this.loadingPromises.clear();
  }
}

// Singleton export
export const SpriteManager = new SpriteManagerClass();
