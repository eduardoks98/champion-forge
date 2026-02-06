// ==========================================
// SPRITE PART RENDERER - Renderiza partes de sprite no skeleton
// ==========================================

import { Skeleton } from './Skeleton';
import { Direction8, DIRECTION_NAMES } from './Direction';

/**
 * Configuracao de uma parte do corpo
 */
export interface PartConfig {
  row: number;          // Linha no sprite sheet
  offsetX?: number;     // Offset X de renderizacao
  offsetY?: number;     // Offset Y de renderizacao
  scale?: number;       // Escala da parte
}

/**
 * Mapeamento de bone para parte do sprite
 * Ex: 'head' -> { row: 0 }
 */
export interface BoneToPartMapping {
  [boneName: string]: PartConfig;
}

/**
 * Configuracao completa do personagem
 */
export interface CharacterConfig {
  name: string;
  cellSize: number;
  directions: string[];  // ["S", "SE", "E", "NE", "N"]
  parts: BoneToPartMapping;
  flipDirections: Record<string, string>;  // { "W": "E", "SW": "SE", "NW": "NE" }
}

/**
 * Configuracao padrao para um personagem gladiador
 */
export const DEFAULT_CHARACTER_CONFIG: CharacterConfig = {
  name: 'gladiator',
  cellSize: 128,
  directions: ['S', 'SE', 'E', 'NE', 'N'],
  parts: {
    // Mapeamento de bone para row no sprite sheet
    head: { row: 0, offsetY: -10 },
    chest: { row: 1 },      // Torso
    spine: { row: 1 },      // Usa mesmo sprite do torso
    arm_L: { row: 2 },      // Upper arm (usamos arm_R e flipamos para L)
    arm_R: { row: 2 },
    forearm_L: { row: 3 },  // Lower arm
    forearm_R: { row: 3 },
    thigh_L: { row: 4 },    // Upper leg (usamos leg_R e flipamos para L)
    thigh_R: { row: 4 },
    shin_L: { row: 5 },     // Lower leg
    shin_R: { row: 5 },
  },
  flipDirections: {
    W: 'E',
    SW: 'SE',
    NW: 'NE',
  },
};

/**
 * Renderizador de partes de sprite
 *
 * Carrega um sprite sheet com partes do corpo e renderiza
 * cada parte na posicao do bone correspondente do skeleton.
 */
export class SpritePartRenderer {
  private image: HTMLImageElement;
  private config: CharacterConfig;
  private loaded: boolean = false;
  private loadError: boolean = false;

  constructor(imagePath: string, config: CharacterConfig = DEFAULT_CHARACTER_CONFIG) {
    this.config = config;
    this.image = new Image();

    this.image.onload = () => {
      this.loaded = true;
      console.log(`[SpritePartRenderer] Loaded: ${imagePath}`);
    };

    this.image.onerror = () => {
      this.loadError = true;
      console.error(`[SpritePartRenderer] Failed to load: ${imagePath}`);
    };

    this.image.src = imagePath;
  }

  /**
   * Verifica se a imagem foi carregada
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Verifica se houve erro ao carregar
   */
  hasError(): boolean {
    return this.loadError;
  }

  /**
   * Obtem o indice da coluna para uma direcao
   */
  private getColumnForDirection(direction: Direction8): { col: number; needsFlip: boolean } {
    const dirName = DIRECTION_NAMES[direction];
    const { directions, flipDirections } = this.config;

    // Verifica se precisa flip horizontal
    if (dirName in flipDirections) {
      const actualDir = flipDirections[dirName];
      const col = directions.indexOf(actualDir);
      return { col, needsFlip: true };
    }

    const col = directions.indexOf(dirName);
    return { col, needsFlip: false };
  }

  /**
   * Renderiza o skeleton usando sprites
   *
   * @param ctx Contexto do canvas
   * @param skeleton O skeleton a renderizar
   * @param direction Direcao atual do personagem (opcional, usa skeleton.getFacing())
   */
  render(
    ctx: CanvasRenderingContext2D,
    skeleton: Skeleton,
    direction?: Direction8
  ): void {
    if (!this.loaded) return;

    const dir = direction ?? skeleton.getFacing();
    const { col, needsFlip } = this.getColumnForDirection(dir);
    const { cellSize, parts } = this.config;

    // Obter ordem de renderizacao do skeleton
    const renderOrder = skeleton.getRenderOrder();
    const hiddenBones = skeleton.getHiddenBones();

    // Renderizar cada bone na ordem correta
    for (const bone of renderOrder) {
      // Verificar se deve esconder este bone
      if (this.shouldHideBone(bone.name, hiddenBones)) {
        continue;
      }

      // Obter configuracao da parte para este bone
      const partConfig = parts[bone.name];
      if (!partConfig) {
        continue; // Bone nao tem sprite (ex: clavicle, pelvis)
      }

      const { row, offsetX = 0, offsetY = 0, scale = 1 } = partConfig;

      // Calcular posicao no sprite sheet
      const srcX = col * cellSize;
      const srcY = row * cellSize;

      // Tamanho de destino
      const destSize = cellSize * scale;

      // Determinar se este bone especifico precisa de flip
      // Bones do lado esquerdo (_L) precisam de flip adicional
      const isLeftBone = bone.name.endsWith('_L');
      const boneFlip = needsFlip !== isLeftBone; // XOR: flip se apenas um for true

      ctx.save();

      // Mover para posicao do bone (centro do bone)
      const boneCenter = bone.worldCenter;
      ctx.translate(boneCenter.x, boneCenter.y);

      // Aplicar rotacao do bone
      ctx.rotate(bone.worldAngle);

      // Aplicar flip se necessario
      if (boneFlip) {
        ctx.scale(-1, 1);
      }

      // Desenhar a parte (centrada)
      ctx.drawImage(
        this.image,
        srcX, srcY, cellSize, cellSize,
        -destSize / 2 + offsetX, -destSize / 2 + offsetY,
        destSize, destSize
      );

      ctx.restore();
    }
  }

  /**
   * Verifica se um bone deve ser escondido
   */
  private shouldHideBone(
    boneName: string,
    hidden: { hideArmL: boolean; hideArmR: boolean; hideLegL: boolean; hideLegR: boolean }
  ): boolean {
    // Bones de braco esquerdo
    if (hidden.hideArmL && (boneName === 'arm_L' || boneName === 'forearm_L' || boneName === 'hand_L')) {
      return true;
    }

    // Bones de braco direito
    if (hidden.hideArmR && (boneName === 'arm_R' || boneName === 'forearm_R' || boneName === 'hand_R')) {
      return true;
    }

    // Bones de perna esquerda
    if (hidden.hideLegL && (boneName === 'thigh_L' || boneName === 'shin_L' || boneName === 'foot_L')) {
      return true;
    }

    // Bones de perna direita
    if (hidden.hideLegR && (boneName === 'thigh_R' || boneName === 'shin_R' || boneName === 'foot_R')) {
      return true;
    }

    return false;
  }

  /**
   * Renderiza uma unica parte (para debug/preview)
   */
  renderPart(
    ctx: CanvasRenderingContext2D,
    partName: string,
    x: number,
    y: number,
    direction: Direction8,
    rotation: number = 0,
    scale: number = 1
  ): void {
    if (!this.loaded) return;

    const partConfig = this.config.parts[partName];
    if (!partConfig) return;

    const { col, needsFlip } = this.getColumnForDirection(direction);
    const { cellSize } = this.config;
    const { row, offsetX = 0, offsetY = 0 } = partConfig;

    const srcX = col * cellSize;
    const srcY = row * cellSize;
    const destSize = cellSize * scale;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    if (needsFlip) {
      ctx.scale(-1, 1);
    }

    ctx.drawImage(
      this.image,
      srcX, srcY, cellSize, cellSize,
      -destSize / 2 + offsetX, -destSize / 2 + offsetY,
      destSize, destSize
    );

    ctx.restore();
  }

  /**
   * Retorna a configuracao atual
   */
  getConfig(): CharacterConfig {
    return this.config;
  }

  /**
   * Atualiza a configuracao
   */
  setConfig(config: CharacterConfig): void {
    this.config = config;
  }

  /**
   * Carrega uma nova imagem
   */
  loadImage(imagePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.loaded = false;
      this.loadError = false;

      this.image = new Image();

      this.image.onload = () => {
        this.loaded = true;
        resolve();
      };

      this.image.onerror = () => {
        this.loadError = true;
        reject(new Error(`Failed to load image: ${imagePath}`));
      };

      this.image.src = imagePath;
    });
  }
}

/**
 * Factory para criar renderers com configuracoes pre-definidas
 */
export const SpritePartRendererFactory = {
  /**
   * Cria renderer para gladiador padrao
   */
  createGladiator(imagePath: string): SpritePartRenderer {
    return new SpritePartRenderer(imagePath, DEFAULT_CHARACTER_CONFIG);
  },

  /**
   * Cria renderer com config customizada
   */
  create(imagePath: string, config: CharacterConfig): SpritePartRenderer {
    return new SpritePartRenderer(imagePath, config);
  },

  /**
   * Carrega configuracao de um JSON
   */
  async fromJSON(imagePath: string, configPath: string): Promise<SpritePartRenderer> {
    const response = await fetch(configPath);
    const config = await response.json() as CharacterConfig;
    return new SpritePartRenderer(imagePath, config);
  },
};
