// ==========================================
// SPRITE ANIMATOR - Sistema de animacao com sprite sheets
// ==========================================

/**
 * Configuracao de uma animacao
 */
export interface AnimationConfig {
  row: number;        // Linha no spritesheet (0-indexed)
  frameCount: number; // Quantos frames tem a animacao
  frameRate: number;  // FPS da animacao
  loop: boolean;      // Se deve repetir
  startFrame?: number; // Frame inicial (default 0)
}

/**
 * Callback para eventos de animacao
 */
export type AnimationCallback = (animationName: string) => void;

/**
 * Animador de sprites usando sprite sheets
 *
 * Sprite sheet deve estar organizado assim:
 * [frame0][frame1][frame2][frame3] <- row 0 (ex: idle)
 * [frame0][frame1][frame2][frame3] <- row 1 (ex: walk)
 * [frame0][frame1][frame2][frame3] <- row 2 (ex: run)
 */
export class SpriteAnimator {
  private image: HTMLImageElement;
  private loaded: boolean = false;

  // Dimensoes de cada frame
  private frameWidth: number;
  private frameHeight: number;

  // Animacoes registradas
  private animations: Map<string, AnimationConfig> = new Map();

  // Estado atual
  private currentAnimation: string = '';
  private currentFrame: number = 0;
  private frameTimer: number = 0;
  private paused: boolean = false;

  // Callbacks
  private onAnimationEnd: AnimationCallback | null = null;
  private onFrameChange: AnimationCallback | null = null;

  // Flip horizontal (para direcao)
  private flipX: boolean = false;

  // Scale
  private scale: number = 1;

  constructor(imageSrc: string, frameWidth: number, frameHeight: number) {
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;

    this.image = new Image();
    this.image.onload = () => {
      this.loaded = true;
    };
    this.image.onerror = () => {
      console.error(`Failed to load sprite sheet: ${imageSrc}`);
    };
    this.image.src = imageSrc;
  }

  /**
   * Verifica se a imagem ja carregou
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Adiciona uma animacao
   */
  addAnimation(name: string, config: AnimationConfig): this {
    this.animations.set(name, {
      ...config,
      startFrame: config.startFrame ?? 0,
    });
    return this;
  }

  /**
   * Remove uma animacao
   */
  removeAnimation(name: string): this {
    this.animations.delete(name);
    return this;
  }

  /**
   * Inicia uma animacao
   */
  play(name: string, forceRestart: boolean = false): this {
    if (!this.animations.has(name)) {
      console.warn(`Animation "${name}" not found`);
      return this;
    }

    if (this.currentAnimation === name && !forceRestart) {
      return this;
    }

    const config = this.animations.get(name)!;
    this.currentAnimation = name;
    this.currentFrame = config.startFrame ?? 0;
    this.frameTimer = 0;
    this.paused = false;

    return this;
  }

  /**
   * Pausa a animacao atual
   */
  pause(): this {
    this.paused = true;
    return this;
  }

  /**
   * Resume a animacao atual
   */
  resume(): this {
    this.paused = false;
    return this;
  }

  /**
   * Para a animacao e reseta para o primeiro frame
   */
  stop(): this {
    const config = this.animations.get(this.currentAnimation);
    if (config) {
      this.currentFrame = config.startFrame ?? 0;
    }
    this.paused = true;
    return this;
  }

  /**
   * Define flip horizontal (para mudar direcao do personagem)
   */
  setFlipX(flip: boolean): this {
    this.flipX = flip;
    return this;
  }

  /**
   * Define escala de renderizacao
   */
  setScale(scale: number): this {
    this.scale = scale;
    return this;
  }

  /**
   * Define callback para quando animacao terminar (se nao for loop)
   */
  onEnd(callback: AnimationCallback | null): this {
    this.onAnimationEnd = callback;
    return this;
  }

  /**
   * Define callback para quando frame mudar
   */
  onFrame(callback: AnimationCallback | null): this {
    this.onFrameChange = callback;
    return this;
  }

  /**
   * Atualiza o estado da animacao
   * @param deltaTime tempo em segundos
   */
  update(deltaTime: number): void {
    if (!this.loaded || this.paused || !this.currentAnimation) {
      return;
    }

    const config = this.animations.get(this.currentAnimation);
    if (!config) return;

    // Tempo por frame em segundos
    const frameDuration = 1 / config.frameRate;

    this.frameTimer += deltaTime;

    if (this.frameTimer >= frameDuration) {
      this.frameTimer -= frameDuration;

      const prevFrame = this.currentFrame;
      this.currentFrame++;

      // Verificar se chegou ao fim
      if (this.currentFrame >= config.frameCount) {
        if (config.loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = config.frameCount - 1;
          this.paused = true;

          if (this.onAnimationEnd) {
            this.onAnimationEnd(this.currentAnimation);
          }
        }
      }

      // Callback de frame change
      if (prevFrame !== this.currentFrame && this.onFrameChange) {
        this.onFrameChange(this.currentAnimation);
      }
    }
  }

  /**
   * Renderiza o frame atual
   * @param ctx contexto do canvas
   * @param x posicao X (centro do sprite)
   * @param y posicao Y (centro do sprite)
   */
  render(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    if (!this.loaded || !this.currentAnimation) {
      return;
    }

    const config = this.animations.get(this.currentAnimation);
    if (!config) return;

    // Calcular posicao no sprite sheet
    const srcX = this.currentFrame * this.frameWidth;
    const srcY = config.row * this.frameHeight;

    // Dimensoes de destino com scale
    const destWidth = this.frameWidth * this.scale;
    const destHeight = this.frameHeight * this.scale;

    // Posicao centralizada
    const destX = x - destWidth / 2;
    const destY = y - destHeight / 2;

    ctx.save();

    // Aplicar flip se necessario
    if (this.flipX) {
      ctx.translate(x, 0);
      ctx.scale(-1, 1);
      ctx.translate(-x, 0);
    }

    // Desenhar o frame
    ctx.drawImage(
      this.image,
      srcX, srcY,              // Posicao no sprite sheet
      this.frameWidth, this.frameHeight,  // Tamanho do frame
      destX, destY,            // Posicao no canvas
      destWidth, destHeight    // Tamanho no canvas
    );

    ctx.restore();
  }

  /**
   * Retorna informacoes do estado atual
   */
  getState(): {
    animation: string;
    frame: number;
    paused: boolean;
    loaded: boolean;
  } {
    return {
      animation: this.currentAnimation,
      frame: this.currentFrame,
      paused: this.paused,
      loaded: this.loaded,
    };
  }

  /**
   * Retorna o nome da animacao atual
   */
  getCurrentAnimation(): string {
    return this.currentAnimation;
  }

  /**
   * Retorna o frame atual
   */
  getCurrentFrame(): number {
    return this.currentFrame;
  }

  /**
   * Verifica se esta pausado
   */
  isPaused(): boolean {
    return this.paused;
  }

  /**
   * Retorna as dimensoes do frame
   */
  getFrameSize(): { width: number; height: number } {
    return {
      width: this.frameWidth * this.scale,
      height: this.frameHeight * this.scale,
    };
  }
}

/**
 * Factory para criar animadores com configuracoes comuns
 */
export const SpriteAnimatorFactory = {
  /**
   * Cria um animador para personagem com animacoes padrao
   */
  createCharacter(
    imageSrc: string,
    frameWidth: number,
    frameHeight: number,
    config?: {
      idleFrames?: number;
      walkFrames?: number;
      runFrames?: number;
      attackFrames?: number;
    }
  ): SpriteAnimator {
    const animator = new SpriteAnimator(imageSrc, frameWidth, frameHeight);

    const {
      idleFrames = 4,
      walkFrames = 8,
      runFrames = 8,
      attackFrames = 6,
    } = config || {};

    animator
      .addAnimation('idle', { row: 0, frameCount: idleFrames, frameRate: 8, loop: true })
      .addAnimation('walk', { row: 1, frameCount: walkFrames, frameRate: 12, loop: true })
      .addAnimation('run', { row: 2, frameCount: runFrames, frameRate: 15, loop: true })
      .addAnimation('attack', { row: 3, frameCount: attackFrames, frameRate: 15, loop: false });

    return animator;
  },
};
