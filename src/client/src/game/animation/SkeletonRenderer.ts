// ==========================================
// SKELETON RENDERER
// Renderiza esqueletos procedurais no canvas
// ==========================================

import { Bone } from './Bone';
import { Skeleton } from './Skeleton';
import { getDirectionConfig, shouldFlipX } from './Direction';
import { DEFAULT_SKELETON } from '../constants/gameDefaults';

/**
 * Tipos de shape para bones
 */
export type BoneShape =
  | 'line'           // Linha simples
  | 'capsule'        // Pontas arredondadas (padrão)
  | 'circle'         // Círculo (cabeça, mãos, joints)
  | 'oval'           // Elipse (corpo gordo)
  | 'rectangle'      // Retângulo
  | 'rounded-rect'   // Retângulo arredondado (corpo musculoso)
  | 'trapezoid'      // Trapézio (torso heroico - largo em cima)
  | 'inv-trapezoid'  // Trapézio invertido (quadril largo)
  | 'tapered'        // Afunila de start para end (membros)
  | 'diamond';       // Losango (articulações)

/**
 * Estilo de renderizacao
 */
export interface RenderStyle {
  debug?: boolean;
  outlineColor?: string;
  outlineWidth?: number;
  shadow?: boolean;
  shadowColor?: string;
  shadowOffset?: { x: number; y: number };
  scale?: number;
  /** Mostrar joints (articulações) */
  showJoints?: boolean;
  jointColor?: string;
  jointRadius?: number;
  /** Mostrar face (olhos) na cabeça */
  showFace?: boolean;
  /** Usar gradientes para dar volume */
  useGradients?: boolean;
  /** Glow ao redor do personagem */
  glow?: boolean;
  glowColor?: string;
  glowBlur?: number;
  /** Mostrar cabelo na cabeça */
  showHair?: boolean;
  hairColor?: string;
}

/**
 * Configuracao de rendering para partes especificas
 */
export interface PartStyle {
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  shape?: BoneShape;
  thicknessMultiplier?: number;
  /** Para shapes tapered: espessura no início */
  startThickness?: number;
  /** Para shapes tapered: espessura no fim */
  endThickness?: number;
  /** Para shapes trapezoid: ratio de largura no topo */
  topWidthRatio?: number;
  /** Para shapes trapezoid: ratio de largura na base */
  bottomWidthRatio?: number;
  /** Para oval: ratio X (largura relativa à altura) */
  ovalRatioX?: number;
  /** Para oval: ratio Y */
  ovalRatioY?: number;
  /** Sprite para substituir o bone procedural */
  sprite?: HTMLImageElement | HTMLCanvasElement;
  /** Offset do sprite em relação ao bone */
  spriteOffset?: { x: number; y: number };
  /** Escala do sprite */
  spriteScale?: number;
  /** Rotacionar sprite junto com o bone */
  spriteRotate?: boolean;
  /** Âncora do sprite (0-1, onde 0.5 = centro) */
  spriteAnchor?: { x: number; y: number };
  /** Se true, o bone não será renderizado (útil para bones estruturais) */
  hidden?: boolean;
}

/**
 * Renderizador de esqueletos com suporte a múltiplos shapes e direções
 */
export class SkeletonRenderer {
  private ctx: CanvasRenderingContext2D;
  private style: RenderStyle = {};
  private partStyles: Map<string, PartStyle> = new Map();

  constructor(ctx: CanvasRenderingContext2D, style: RenderStyle = {}) {
    this.ctx = ctx;
    this.style = {
      debug: false,
      outlineColor: '#000000',
      outlineWidth: 2.5,
      shadow: true,
      shadowColor: 'rgba(0, 0, 0, 0.3)',
      shadowOffset: { x: 2, y: 4 },
      scale: 1,
      showJoints: false,
      jointColor: '#ffffff',
      jointRadius: 3,
      useGradients: true,
      glow: false,
      glowColor: 'rgba(255, 255, 255, 0.5)',
      glowBlur: 10,
      showHair: true,
      hairColor: '#4a3728',
      ...style,
    };

    this.setupDefaultPartStyles();
  }

  /**
   * Configura estilos padrao para partes do corpo
   * Proporções CHIBI - cabeça grande, corpo compacto, membros curtos
   */
  private setupDefaultPartStyles(): void {
    // === CABEÇA ===
    // Círculo grande - característica principal do chibi
    this.partStyles.set('head', {
      shape: 'circle',
      thicknessMultiplier: 1.0, // Usa o thickness do bone diretamente
    });

    // === PESCOÇO ===
    // Muito fino, quase invisível no estilo chibi
    this.partStyles.set('neck', {
      shape: 'tapered',
      thicknessMultiplier: 0.5,
      startThickness: 0.6,
      endThickness: 0.4,
    });

    // === TORSO ===
    // Chest - oval horizontal para dar largura aos ombros
    this.partStyles.set('chest', {
      shape: 'oval',
      thicknessMultiplier: 1.0,
      ovalRatioX: 1.3,
      ovalRatioY: 0.9,
    });

    // Spine - conecta hip ao chest
    this.partStyles.set('spine', {
      shape: 'tapered',
      thicknessMultiplier: 0.9,
      startThickness: 0.9,
      endThickness: 1.1,
    });

    // Hip - ponto de pivot, oval pequeno
    this.partStyles.set('hip', {
      shape: 'oval',
      thicknessMultiplier: 0.8,
      ovalRatioX: 1.2,
      ovalRatioY: 0.7,
    });

    // === CLAVÍCULAS ===
    // Bones estruturais INVISÍVEIS que criam distância lateral para os ombros
    this.partStyles.set('clavicle_L', { hidden: true });
    this.partStyles.set('clavicle_R', { hidden: true });

    // === PELVIS ===
    // Bones estruturais INVISÍVEIS que criam distância lateral para as pernas
    this.partStyles.set('pelvis_L', { hidden: true });
    this.partStyles.set('pelvis_R', { hidden: true });

    // === OMBROS ===
    // Pequenos círculos para articulação
    this.partStyles.set('shoulder_L', { shape: 'circle', thicknessMultiplier: 0.6 });
    this.partStyles.set('shoulder_R', { shape: 'circle', thicknessMultiplier: 0.6 });

    // === BRAÇOS ===
    // Tapered - mais grosso próximo ao corpo
    this.partStyles.set('arm_L', {
      shape: 'tapered',
      thicknessMultiplier: 0.8,
      startThickness: 1.0,
      endThickness: 0.75,
    });
    this.partStyles.set('arm_R', {
      shape: 'tapered',
      thicknessMultiplier: 0.8,
      startThickness: 1.0,
      endThickness: 0.75,
    });

    // === ANTEBRAÇOS ===
    this.partStyles.set('forearm_L', {
      shape: 'tapered',
      thicknessMultiplier: 0.75,
      startThickness: 0.85,
      endThickness: 0.6,
    });
    this.partStyles.set('forearm_R', {
      shape: 'tapered',
      thicknessMultiplier: 0.75,
      startThickness: 0.85,
      endThickness: 0.6,
    });

    // === MÃOS ===
    // Círculos pequenos (metade do tamanho normal para chibi)
    this.partStyles.set('hand_L', { shape: 'circle', thicknessMultiplier: 0.65 });
    this.partStyles.set('hand_R', { shape: 'circle', thicknessMultiplier: 0.65 });

    // === COXAS ===
    // Tapered - mais grosso no quadril
    this.partStyles.set('thigh_L', {
      shape: 'tapered',
      thicknessMultiplier: 0.9,
      startThickness: 1.1,
      endThickness: 0.8,
    });
    this.partStyles.set('thigh_R', {
      shape: 'tapered',
      thicknessMultiplier: 0.9,
      startThickness: 1.1,
      endThickness: 0.8,
    });

    // === CANELAS ===
    this.partStyles.set('shin_L', {
      shape: 'tapered',
      thicknessMultiplier: 0.8,
      startThickness: 0.9,
      endThickness: 0.6,
    });
    this.partStyles.set('shin_R', {
      shape: 'tapered',
      thicknessMultiplier: 0.8,
      startThickness: 0.9,
      endThickness: 0.6,
    });

    // === PÉS ===
    // Oval horizontal - sapatos/botas chibi
    this.partStyles.set('foot_L', {
      shape: 'oval',
      thicknessMultiplier: 0.8,
      ovalRatioX: 1.4,
      ovalRatioY: 0.7,
    });
    this.partStyles.set('foot_R', {
      shape: 'oval',
      thicknessMultiplier: 0.8,
      ovalRatioX: 1.4,
      ovalRatioY: 0.7,
    });
  }

  /**
   * Renderiza um esqueleto completo
   */
  render(skeleton: Skeleton): void {
    const scale = this.style.scale ?? DEFAULT_SKELETON.SCALE;
    const direction = skeleton.getFacing();
    const config = getDirectionConfig(direction);
    const flipX = shouldFlipX(direction);
    const hiddenBones = skeleton.getHiddenBones();

    // Atualizar world transforms antes de renderizar
    skeleton.updateWorldTransforms();

    // Obter bones na ordem correta de renderização
    const bones = skeleton.getRenderOrder();

    // Filtrar bones que devem ser escondidos nesta direção
    const visibleBones = bones.filter(bone => {
      if (hiddenBones.hideArmL && (bone.name === 'shoulder_L' || bone.name === 'arm_L' || bone.name === 'forearm_L' || bone.name === 'hand_L')) {
        return false;
      }
      if (hiddenBones.hideArmR && (bone.name === 'shoulder_R' || bone.name === 'arm_R' || bone.name === 'forearm_R' || bone.name === 'hand_R')) {
        return false;
      }
      if (hiddenBones.hideLegL && (bone.name === 'thigh_L' || bone.name === 'shin_L' || bone.name === 'foot_L')) {
        return false;
      }
      if (hiddenBones.hideLegR && (bone.name === 'thigh_R' || bone.name === 'shin_R' || bone.name === 'foot_R')) {
        return false;
      }
      return true;
    });

    // Aplicar transformação de flip se necessário
    this.ctx.save();

    if (flipX) {
      const pos = skeleton.getPosition();
      this.ctx.translate(pos.x * 2, 0);
      this.ctx.scale(-1, 1);
    }

    // Desenhar sombra primeiro
    if (this.style.shadow) {
      this.ctx.save();
      this.ctx.translate(
        this.style.shadowOffset?.x || 2,
        this.style.shadowOffset?.y || 4
      );
      for (const bone of visibleBones) {
        this.renderBoneShadow(bone, scale, config.bodyScaleX);
      }
      this.ctx.restore();
    }

    // Desenhar bones
    for (const bone of visibleBones) {
      this.renderBone(bone, scale, config.bodyScaleX);
    }

    // Desenhar face na cabeça
    const headBone = visibleBones.find(b => b.name === 'head');
    if (headBone && this.style.showFace !== false) {
      this.renderFace(headBone, scale, config.showBack);
    }

    // Desenhar joints (articulações)
    if (this.style.showJoints) {
      for (const bone of visibleBones) {
        this.renderJoint(bone, scale);
      }
    }

    // Desenhar debug info
    if (this.style.debug) {
      for (const bone of visibleBones) {
        this.renderBoneDebug(bone, scale);
      }
    }

    this.ctx.restore();
  }

  /**
   * Renderiza um bone usando sprite
   */
  private renderBoneSprite(bone: Bone, partStyle: PartStyle, scale: number): void {
    const sprite = partStyle.sprite!;
    const spriteScale = (partStyle.spriteScale ?? DEFAULT_SKELETON.SPRITE_SCALE) * scale;
    const offset = partStyle.spriteOffset || { x: 0, y: 0 };
    const anchor = partStyle.spriteAnchor || { x: 0.5, y: 0.5 };
    const shouldRotate = partStyle.spriteRotate !== false; // default true

    const start = bone.worldStart;
    const end = bone.worldEnd;

    // Posição do sprite (centro do bone por padrão)
    const posX = (start.x + end.x) / 2 + offset.x * scale;
    const posY = (start.y + end.y) / 2 + offset.y * scale;

    // Calcular rotação do bone
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);

    // Tamanho do sprite escalado
    const width = sprite.width * spriteScale;
    const height = sprite.height * spriteScale;

    this.ctx.save();
    this.ctx.translate(posX, posY);

    if (shouldRotate) {
      this.ctx.rotate(angle);
    }

    // Desenhar sprite com âncora
    this.ctx.drawImage(
      sprite,
      -width * anchor.x,
      -height * anchor.y,
      width,
      height
    );

    this.ctx.restore();
  }

  /**
   * Renderiza a face (olhos) na cabeça
   * Estilo CHIBI - olhos grandes e expressivos
   */
  private renderFace(headBone: Bone, scale: number, showBack: boolean): void {
    // Não mostrar face se está de costas
    if (showBack) return;

    const center = headBone.worldEnd;
    const headRadius = headBone.thickness * scale; // Raio da cabeça

    // === OLHOS CHIBI ===
    // Olhos grandes - característica marcante do estilo chibi
    // Ocupam ~25% da altura da cabeça cada
    const eyeRadius = headRadius * 0.22;
    const eyeSpacing = headRadius * 0.38;
    const eyeOffsetY = -headRadius * 0.05; // Levemente acima do centro

    // Pupila grande (estilo anime/chibi)
    const pupilRadius = eyeRadius * 0.7;

    // === OLHO ESQUERDO ===
    // Branco do olho
    this.ctx.beginPath();
    this.ctx.arc(center.x - eyeSpacing, center.y + eyeOffsetY, eyeRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fill();
    this.ctx.strokeStyle = '#2a2a2a';
    this.ctx.lineWidth = scale * 0.8;
    this.ctx.stroke();

    // Pupila (íris + pupila combinadas para chibi)
    this.ctx.beginPath();
    this.ctx.arc(
      center.x - eyeSpacing + scale * 0.5,
      center.y + eyeOffsetY + scale * 0.5,
      pupilRadius,
      0,
      Math.PI * 2
    );
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fill();

    // Brilho principal (grande)
    this.ctx.beginPath();
    this.ctx.arc(
      center.x - eyeSpacing - eyeRadius * 0.25,
      center.y + eyeOffsetY - eyeRadius * 0.3,
      eyeRadius * 0.35,
      0,
      Math.PI * 2
    );
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fill();

    // Brilho secundário (pequeno)
    this.ctx.beginPath();
    this.ctx.arc(
      center.x - eyeSpacing + eyeRadius * 0.3,
      center.y + eyeOffsetY + eyeRadius * 0.25,
      eyeRadius * 0.15,
      0,
      Math.PI * 2
    );
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.fill();

    // === OLHO DIREITO ===
    // Branco do olho
    this.ctx.beginPath();
    this.ctx.arc(center.x + eyeSpacing, center.y + eyeOffsetY, eyeRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fill();
    this.ctx.strokeStyle = '#2a2a2a';
    this.ctx.lineWidth = scale * 0.8;
    this.ctx.stroke();

    // Pupila
    this.ctx.beginPath();
    this.ctx.arc(
      center.x + eyeSpacing + scale * 0.5,
      center.y + eyeOffsetY + scale * 0.5,
      pupilRadius,
      0,
      Math.PI * 2
    );
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fill();

    // Brilho principal
    this.ctx.beginPath();
    this.ctx.arc(
      center.x + eyeSpacing - eyeRadius * 0.25,
      center.y + eyeOffsetY - eyeRadius * 0.3,
      eyeRadius * 0.35,
      0,
      Math.PI * 2
    );
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fill();

    // Brilho secundário
    this.ctx.beginPath();
    this.ctx.arc(
      center.x + eyeSpacing + eyeRadius * 0.3,
      center.y + eyeOffsetY + eyeRadius * 0.25,
      eyeRadius * 0.15,
      0,
      Math.PI * 2
    );
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.fill();

    // === BOCHECHAS (BLUSH) ===
    const blushRadius = headRadius * 0.18;
    const blushOffsetY = headRadius * 0.25;
    const blushOffsetX = headRadius * 0.5;

    // Bochecha esquerda
    this.ctx.beginPath();
    this.ctx.arc(center.x - blushOffsetX, center.y + blushOffsetY, blushRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 150, 150, 0.35)';
    this.ctx.fill();

    // Bochecha direita
    this.ctx.beginPath();
    this.ctx.arc(center.x + blushOffsetX, center.y + blushOffsetY, blushRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 150, 150, 0.35)';
    this.ctx.fill();

    // === SOBRANCELHAS ===
    const browWidth = eyeRadius * 0.8;
    const browHeight = eyeRadius * 0.15;
    const browOffsetY = eyeOffsetY - eyeRadius * 1.1;

    this.ctx.fillStyle = '#3a2a1a';

    // Sobrancelha esquerda
    this.ctx.beginPath();
    this.ctx.ellipse(
      center.x - eyeSpacing,
      center.y + browOffsetY,
      browWidth,
      browHeight,
      -0.15, 0, Math.PI * 2
    );
    this.ctx.fill();

    // Sobrancelha direita
    this.ctx.beginPath();
    this.ctx.ellipse(
      center.x + eyeSpacing,
      center.y + browOffsetY,
      browWidth,
      browHeight,
      0.15, 0, Math.PI * 2
    );
    this.ctx.fill();

    // === CABELO ===
    if (this.style.showHair) {
      this.renderHair(center, headRadius);
    }
  }

  /**
   * Renderiza cabelo simples no topo da cabeça
   */
  private renderHair(center: { x: number; y: number }, headRadius: number): void {
    const hairColor = this.style.hairColor || '#4a3728';
    const darkHair = darkenColor(hairColor, 20);

    this.ctx.save();

    // Mechas de cabelo (arcos no topo)
    const hairCount = 7;
    const hairWidth = headRadius * 0.25;
    const hairLength = headRadius * 0.4;

    this.ctx.strokeStyle = hairColor;
    this.ctx.lineWidth = hairWidth;
    this.ctx.lineCap = 'round';

    for (let i = 0; i < hairCount; i++) {
      const angle = -Math.PI * 0.8 + (Math.PI * 0.6 / (hairCount - 1)) * i;
      const startX = center.x + Math.cos(angle) * (headRadius * 0.7);
      const startY = center.y + Math.sin(angle) * (headRadius * 0.7);
      const endX = center.x + Math.cos(angle) * (headRadius + hairLength * (0.8 + Math.random() * 0.4));
      const endY = center.y + Math.sin(angle) * (headRadius + hairLength * (0.8 + Math.random() * 0.4));

      // Alternar cores para dar volume
      this.ctx.strokeStyle = i % 2 === 0 ? hairColor : darkHair;

      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);
      this.ctx.quadraticCurveTo(
        (startX + endX) / 2 + (Math.random() - 0.5) * hairWidth,
        (startY + endY) / 2 - hairWidth,
        endX,
        endY
      );
      this.ctx.stroke();
    }

    // Franja (mechas na frente)
    this.ctx.strokeStyle = hairColor;
    this.ctx.lineWidth = hairWidth * 0.8;

    for (let i = 0; i < 3; i++) {
      const offsetX = (i - 1) * headRadius * 0.3;
      const startX = center.x + offsetX;
      const startY = center.y - headRadius * 0.8;
      const endX = startX + (i - 1) * headRadius * 0.15;
      const endY = center.y - headRadius * 0.3;

      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);
      this.ctx.quadraticCurveTo(
        startX,
        (startY + endY) / 2,
        endX,
        endY
      );
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  /**
   * Renderiza um bone individual
   */
  private renderBone(bone: Bone, scale: number, _bodyScaleX: number = 1): void {
    const partStyle = this.partStyles.get(bone.name) || {};

    // Se bone está marcado como hidden, não renderizar
    if (partStyle.hidden) {
      return;
    }

    // Se tem sprite configurado, usar sprite em vez de shape procedural
    if (partStyle.sprite) {
      this.renderBoneSprite(bone, partStyle, scale);
      return;
    }

    const shape = partStyle.shape || 'capsule';
    const thicknessMult = partStyle.thicknessMultiplier ?? DEFAULT_SKELETON.THICKNESS_MULTIPLIER;

    const start = bone.worldStart;
    const end = bone.worldEnd;
    const thickness = bone.thickness * scale * thicknessMult;
    const color = partStyle.fillColor || bone.color;
    const strokeColor = partStyle.strokeColor || this.style.outlineColor || '#000';
    const strokeWidth = partStyle.strokeWidth ?? this.style.outlineWidth ?? DEFAULT_SKELETON.STROKE_WIDTH;

    this.ctx.save();

    switch (shape) {
      case 'circle':
        this.drawCircle(end, thickness, color, strokeColor, strokeWidth);
        break;

      case 'oval':
        this.drawOval(
          start,
          end,
          thickness,
          partStyle.ovalRatioX ?? DEFAULT_SKELETON.OVAL_RATIO_X,
          partStyle.ovalRatioY ?? DEFAULT_SKELETON.OVAL_RATIO_Y,
          color,
          strokeColor,
          strokeWidth
        );
        break;

      case 'capsule':
        this.drawCapsule(start, end, thickness, color, strokeColor, strokeWidth);
        break;

      case 'tapered':
        this.drawTapered(
          start,
          end,
          thickness * (partStyle.startThickness ?? DEFAULT_SKELETON.START_THICKNESS),
          thickness * (partStyle.endThickness ?? DEFAULT_SKELETON.END_THICKNESS),
          color,
          strokeColor,
          strokeWidth
        );
        break;

      case 'trapezoid':
        this.drawTrapezoid(
          start,
          end,
          thickness,
          partStyle.topWidthRatio ?? DEFAULT_SKELETON.TOP_WIDTH_RATIO,
          partStyle.bottomWidthRatio ?? DEFAULT_SKELETON.BOTTOM_WIDTH_RATIO,
          color,
          strokeColor,
          strokeWidth
        );
        break;

      case 'inv-trapezoid':
        this.drawTrapezoid(
          start,
          end,
          thickness,
          partStyle.topWidthRatio ?? DEFAULT_SKELETON.BOTTOM_WIDTH_RATIO,
          partStyle.bottomWidthRatio ?? DEFAULT_SKELETON.TOP_WIDTH_RATIO,
          color,
          strokeColor,
          strokeWidth
        );
        break;

      case 'rounded-rect':
        this.drawRoundedRect(start, end, thickness, color, strokeColor, strokeWidth);
        break;

      case 'diamond':
        this.drawDiamond(start, end, thickness, color, strokeColor, strokeWidth);
        break;

      case 'rectangle':
        this.drawRectangle(start, end, thickness, color, strokeColor, strokeWidth);
        break;

      case 'line':
      default:
        this.drawLine(start, end, thickness, color, strokeColor, strokeWidth);
        break;
    }

    this.ctx.restore();
  }

  /**
   * Renderiza sombra de um bone
   */
  private renderBoneShadow(bone: Bone, scale: number, _bodyScaleX: number = 1): void {
    const partStyle = this.partStyles.get(bone.name) || {};
    const shape = partStyle.shape || 'capsule';
    const thicknessMult = partStyle.thicknessMultiplier ?? DEFAULT_SKELETON.THICKNESS_MULTIPLIER;

    const start = bone.worldStart;
    const end = bone.worldEnd;
    const thickness = bone.thickness * scale * thicknessMult;
    const shadowColor = this.style.shadowColor || 'rgba(0, 0, 0, 0.3)';

    this.ctx.save();
    this.ctx.globalAlpha = 0.3;

    switch (shape) {
      case 'circle':
        this.drawCircle(end, thickness, shadowColor, 'transparent', 0);
        break;

      case 'oval':
        this.drawOval(
          start, end, thickness,
          partStyle.ovalRatioX ?? DEFAULT_SKELETON.OVAL_RATIO_X,
          partStyle.ovalRatioY ?? DEFAULT_SKELETON.OVAL_RATIO_Y,
          shadowColor, 'transparent', 0
        );
        break;

      case 'tapered':
        this.drawTapered(
          start, end,
          thickness * (partStyle.startThickness ?? DEFAULT_SKELETON.START_THICKNESS),
          thickness * (partStyle.endThickness ?? DEFAULT_SKELETON.END_THICKNESS),
          shadowColor, 'transparent', 0
        );
        break;

      case 'capsule':
      default:
        this.drawCapsule(start, end, thickness, shadowColor, 'transparent', 0);
        break;
    }

    this.ctx.restore();
  }

  /**
   * Renderiza joint (articulação)
   */
  private renderJoint(bone: Bone, scale: number): void {
    const radius = (this.style.jointRadius || 3) * scale;
    const color = this.style.jointColor || '#ffffff';

    this.ctx.beginPath();
    this.ctx.arc(bone.worldStart.x, bone.worldStart.y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  /**
   * Renderiza info de debug
   */
  private renderBoneDebug(bone: Bone, scale: number): void {
    const start = bone.worldStart;
    const end = bone.worldEnd;

    // Joint point
    this.ctx.beginPath();
    this.ctx.arc(start.x, start.y, 3 * scale, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ff0000';
    this.ctx.fill();

    // End point
    this.ctx.beginPath();
    this.ctx.arc(end.x, end.y, 2 * scale, 0, Math.PI * 2);
    this.ctx.fillStyle = '#00ff00';
    this.ctx.fill();

    // Bone name
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    this.ctx.font = `${8 * scale}px monospace`;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.strokeText(bone.name, midX, midY);
    this.ctx.fillText(bone.name, midX, midY);
  }

  // ==========================================
  // PRIMITIVAS DE DESENHO
  // ==========================================

  /**
   * Desenha um círculo (com gradiente opcional)
   */
  private drawCircle(
    center: { x: number; y: number },
    radius: number,
    fillColor: string,
    strokeColor: string,
    strokeWidth: number
  ): void {
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);

    // Usar gradiente se habilitado
    if (this.style.useGradients) {
      const gradient = this.ctx.createRadialGradient(
        center.x - radius * 0.3, center.y - radius * 0.3, 0,
        center.x, center.y, radius * 1.1
      );
      gradient.addColorStop(0, lightenColor(fillColor, 50));
      gradient.addColorStop(0.5, fillColor);
      gradient.addColorStop(1, darkenColor(fillColor, 30));
      this.ctx.fillStyle = gradient;
    } else {
      this.ctx.fillStyle = fillColor;
    }
    this.ctx.fill();

    if (strokeWidth > 0 && strokeColor !== 'transparent') {
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = strokeWidth;
      this.ctx.stroke();
    }
  }

  /**
   * Desenha uma oval/elipse no centro do bone
   */
  private drawOval(
    start: { x: number; y: number },
    end: { x: number; y: number },
    thickness: number,
    ratioX: number,
    ratioY: number,
    fillColor: string,
    strokeColor: string,
    strokeWidth: number
  ): void {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);
    const length = Math.sqrt(dx * dx + dy * dy);

    // Centro da oval
    const centerX = (start.x + end.x) / 2;
    const centerY = (start.y + end.y) / 2;

    // Raios baseados no comprimento e espessura
    const radiusX = (length / 2 + thickness * 0.5) * ratioX;
    const radiusY = thickness * ratioY;

    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(angle);

    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);

    this.ctx.fillStyle = fillColor;
    this.ctx.fill();

    if (strokeWidth > 0 && strokeColor !== 'transparent') {
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = strokeWidth;
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  /**
   * Desenha uma cápsula (linha com pontas arredondadas)
   */
  private drawCapsule(
    start: { x: number; y: number },
    end: { x: number; y: number },
    thickness: number,
    fillColor: string,
    strokeColor: string,
    strokeWidth: number
  ): void {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length < thickness) {
      this.drawCircle(start, thickness, fillColor, strokeColor, strokeWidth);
      return;
    }

    this.ctx.save();
    this.ctx.translate(start.x, start.y);
    this.ctx.rotate(angle);

    this.ctx.beginPath();
    this.ctx.arc(0, 0, thickness, Math.PI / 2, -Math.PI / 2);
    this.ctx.lineTo(length, -thickness);
    this.ctx.arc(length, 0, thickness, -Math.PI / 2, Math.PI / 2);
    this.ctx.lineTo(0, thickness);
    this.ctx.closePath();

    // Usar gradiente se habilitado
    if (this.style.useGradients) {
      const gradient = this.ctx.createLinearGradient(0, -thickness, 0, thickness);
      gradient.addColorStop(0, lightenColor(fillColor, 35));
      gradient.addColorStop(0.4, fillColor);
      gradient.addColorStop(1, darkenColor(fillColor, 25));
      this.ctx.fillStyle = gradient;
    } else {
      this.ctx.fillStyle = fillColor;
    }
    this.ctx.fill();

    if (strokeWidth > 0 && strokeColor !== 'transparent') {
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = strokeWidth;
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  /**
   * Desenha uma forma que afunila (tapered) - para membros
   */
  private drawTapered(
    start: { x: number; y: number },
    end: { x: number; y: number },
    startThickness: number,
    endThickness: number,
    fillColor: string,
    strokeColor: string,
    strokeWidth: number
  ): void {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length < Math.max(startThickness, endThickness)) {
      this.drawCircle(start, startThickness, fillColor, strokeColor, strokeWidth);
      return;
    }

    this.ctx.save();
    this.ctx.translate(start.x, start.y);
    this.ctx.rotate(angle);

    this.ctx.beginPath();
    // Semicírculo no início
    this.ctx.arc(0, 0, startThickness, Math.PI / 2, -Math.PI / 2);
    // Linha superior (diagonal se tapered)
    this.ctx.lineTo(length, -endThickness);
    // Semicírculo no fim
    this.ctx.arc(length, 0, endThickness, -Math.PI / 2, Math.PI / 2);
    // Linha inferior
    this.ctx.lineTo(0, startThickness);
    this.ctx.closePath();

    // Usar gradiente se habilitado
    if (this.style.useGradients) {
      const maxThickness = Math.max(startThickness, endThickness);
      const gradient = this.ctx.createLinearGradient(0, -maxThickness, 0, maxThickness);
      gradient.addColorStop(0, lightenColor(fillColor, 35));
      gradient.addColorStop(0.4, fillColor);
      gradient.addColorStop(1, darkenColor(fillColor, 25));
      this.ctx.fillStyle = gradient;
    } else {
      this.ctx.fillStyle = fillColor;
    }
    this.ctx.fill();

    if (strokeWidth > 0 && strokeColor !== 'transparent') {
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = strokeWidth;
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  /**
   * Desenha um trapézio (para torso heroico)
   */
  private drawTrapezoid(
    start: { x: number; y: number },
    end: { x: number; y: number },
    thickness: number,
    topWidthRatio: number,
    bottomWidthRatio: number,
    fillColor: string,
    strokeColor: string,
    strokeWidth: number
  ): void {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);
    const length = Math.sqrt(dx * dx + dy * dy);

    const topWidth = thickness * topWidthRatio;
    const bottomWidth = thickness * bottomWidthRatio;

    this.ctx.save();
    this.ctx.translate(start.x, start.y);
    this.ctx.rotate(angle);

    this.ctx.beginPath();
    this.ctx.moveTo(0, -bottomWidth);
    this.ctx.lineTo(length, -topWidth);
    this.ctx.lineTo(length, topWidth);
    this.ctx.lineTo(0, bottomWidth);
    this.ctx.closePath();

    this.ctx.fillStyle = fillColor;
    this.ctx.fill();

    if (strokeWidth > 0 && strokeColor !== 'transparent') {
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = strokeWidth;
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  /**
   * Desenha um retângulo arredondado
   */
  private drawRoundedRect(
    start: { x: number; y: number },
    end: { x: number; y: number },
    thickness: number,
    fillColor: string,
    strokeColor: string,
    strokeWidth: number
  ): void {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);
    const length = Math.sqrt(dx * dx + dy * dy);
    const cornerRadius = thickness * 0.3;

    this.ctx.save();
    this.ctx.translate(start.x, start.y);
    this.ctx.rotate(angle);

    this.ctx.beginPath();
    this.ctx.roundRect(-cornerRadius, -thickness, length + cornerRadius * 2, thickness * 2, cornerRadius);

    this.ctx.fillStyle = fillColor;
    this.ctx.fill();

    if (strokeWidth > 0 && strokeColor !== 'transparent') {
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = strokeWidth;
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  /**
   * Desenha um losango (diamond)
   */
  private drawDiamond(
    start: { x: number; y: number },
    end: { x: number; y: number },
    thickness: number,
    fillColor: string,
    strokeColor: string,
    strokeWidth: number
  ): void {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);
    const length = Math.sqrt(dx * dx + dy * dy);
    const midLength = length / 2;

    this.ctx.save();
    this.ctx.translate(start.x, start.y);
    this.ctx.rotate(angle);

    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(midLength, -thickness);
    this.ctx.lineTo(length, 0);
    this.ctx.lineTo(midLength, thickness);
    this.ctx.closePath();

    this.ctx.fillStyle = fillColor;
    this.ctx.fill();

    if (strokeWidth > 0 && strokeColor !== 'transparent') {
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = strokeWidth;
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  /**
   * Desenha uma linha com espessura
   */
  private drawLine(
    start: { x: number; y: number },
    end: { x: number; y: number },
    thickness: number,
    fillColor: string,
    strokeColor: string,
    strokeWidth: number
  ): void {
    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);

    this.ctx.strokeStyle = fillColor;
    this.ctx.lineWidth = thickness * 2;
    this.ctx.lineCap = 'round';
    this.ctx.stroke();

    if (strokeWidth > 0 && strokeColor !== 'transparent') {
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = thickness * 2 + strokeWidth * 2;
      this.ctx.stroke();

      this.ctx.strokeStyle = fillColor;
      this.ctx.lineWidth = thickness * 2;
      this.ctx.stroke();
    }
  }

  /**
   * Desenha um retângulo rotacionado
   */
  private drawRectangle(
    start: { x: number; y: number },
    end: { x: number; y: number },
    thickness: number,
    fillColor: string,
    strokeColor: string,
    strokeWidth: number
  ): void {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);
    const length = Math.sqrt(dx * dx + dy * dy);

    this.ctx.save();
    this.ctx.translate(start.x, start.y);
    this.ctx.rotate(angle);

    this.ctx.beginPath();
    this.ctx.rect(0, -thickness, length, thickness * 2);

    this.ctx.fillStyle = fillColor;
    this.ctx.fill();

    if (strokeWidth > 0 && strokeColor !== 'transparent') {
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = strokeWidth;
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  // ==========================================
  // CONFIGURACAO
  // ==========================================

  setStyle(style: Partial<RenderStyle>): void {
    this.style = { ...this.style, ...style };
  }

  setPartStyle(partName: string, style: PartStyle): void {
    this.partStyles.set(partName, { ...this.partStyles.get(partName), ...style });
  }

  setDebug(enabled: boolean): void {
    this.style.debug = enabled;
  }

  setShowJoints(enabled: boolean): void {
    this.style.showJoints = enabled;
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }
}

/**
 * Factory para criar renderers pre-configurados
 */
export const RendererFactory = {
  /**
   * Renderer para jogador (estilo heroico)
   */
  createPlayerRenderer(ctx: CanvasRenderingContext2D): SkeletonRenderer {
    const renderer = new SkeletonRenderer(ctx, {
      shadow: true,
      shadowColor: 'rgba(0, 0, 0, 0.4)',
      shadowOffset: { x: 2, y: 3 },
      outlineWidth: 1.5,
      outlineColor: '#1a3a5c',
      showJoints: false,
    });

    // Cores do jogador (azul)
    renderer.setPartStyle('head', { fillColor: '#5ba3e0', shape: 'circle' });
    renderer.setPartStyle('chest', { fillColor: '#4a90d9', shape: 'oval' });
    renderer.setPartStyle('spine', { fillColor: '#4a90d9' });
    renderer.setPartStyle('hip', { fillColor: '#3a7bc4' });
    renderer.setPartStyle('neck', { fillColor: '#5ba3e0' });

    // Membros
    const limbColor = '#3a7bc4';
    renderer.setPartStyle('shoulder_L', { fillColor: limbColor });
    renderer.setPartStyle('shoulder_R', { fillColor: limbColor });
    renderer.setPartStyle('arm_L', { fillColor: limbColor });
    renderer.setPartStyle('arm_R', { fillColor: limbColor });
    renderer.setPartStyle('forearm_L', { fillColor: limbColor });
    renderer.setPartStyle('forearm_R', { fillColor: limbColor });
    renderer.setPartStyle('hand_L', { fillColor: '#5ba3e0' });
    renderer.setPartStyle('hand_R', { fillColor: '#5ba3e0' });

    renderer.setPartStyle('thigh_L', { fillColor: limbColor });
    renderer.setPartStyle('thigh_R', { fillColor: limbColor });
    renderer.setPartStyle('shin_L', { fillColor: limbColor });
    renderer.setPartStyle('shin_R', { fillColor: limbColor });
    renderer.setPartStyle('foot_L', { fillColor: '#5ba3e0' });
    renderer.setPartStyle('foot_R', { fillColor: '#5ba3e0' });

    return renderer;
  },

  /**
   * Renderer para inimigo
   */
  createEnemyRenderer(ctx: CanvasRenderingContext2D): SkeletonRenderer {
    const renderer = new SkeletonRenderer(ctx, {
      shadow: true,
      shadowColor: 'rgba(0, 0, 0, 0.4)',
      shadowOffset: { x: 2, y: 3 },
      outlineWidth: 1.5,
      outlineColor: '#5c1a1a',
      showJoints: false,
    });

    // Cores do inimigo (vermelho)
    renderer.setPartStyle('head', { fillColor: '#e05b5b', shape: 'circle' });
    renderer.setPartStyle('chest', { fillColor: '#d94a4a', shape: 'oval' });
    renderer.setPartStyle('spine', { fillColor: '#d94a4a' });
    renderer.setPartStyle('hip', { fillColor: '#c43a3a' });
    renderer.setPartStyle('neck', { fillColor: '#e05b5b' });

    // Membros
    const limbColor = '#c43a3a';
    renderer.setPartStyle('shoulder_L', { fillColor: limbColor });
    renderer.setPartStyle('shoulder_R', { fillColor: limbColor });
    renderer.setPartStyle('arm_L', { fillColor: limbColor });
    renderer.setPartStyle('arm_R', { fillColor: limbColor });
    renderer.setPartStyle('forearm_L', { fillColor: limbColor });
    renderer.setPartStyle('forearm_R', { fillColor: limbColor });
    renderer.setPartStyle('hand_L', { fillColor: '#e05b5b' });
    renderer.setPartStyle('hand_R', { fillColor: '#e05b5b' });

    renderer.setPartStyle('thigh_L', { fillColor: limbColor });
    renderer.setPartStyle('thigh_R', { fillColor: limbColor });
    renderer.setPartStyle('shin_L', { fillColor: limbColor });
    renderer.setPartStyle('shin_R', { fillColor: limbColor });
    renderer.setPartStyle('foot_L', { fillColor: '#e05b5b' });
    renderer.setPartStyle('foot_R', { fillColor: '#e05b5b' });

    return renderer;
  },

  /**
   * Renderer para boss
   */
  createBossRenderer(ctx: CanvasRenderingContext2D): SkeletonRenderer {
    const renderer = new SkeletonRenderer(ctx, {
      shadow: true,
      shadowColor: 'rgba(0, 0, 0, 0.5)',
      shadowOffset: { x: 3, y: 5 },
      outlineWidth: 2,
      outlineColor: '#3a1a5c',
      scale: 1.5,
      showJoints: false,
    });

    // Cores do boss (roxo)
    renderer.setPartStyle('head', { fillColor: '#b05be0', shape: 'circle' });
    renderer.setPartStyle('chest', {
      fillColor: '#9b4ad9',
      shape: 'trapezoid',
      topWidthRatio: 1.8,
      bottomWidthRatio: 1.2,
    });
    renderer.setPartStyle('spine', { fillColor: '#9b4ad9' });
    renderer.setPartStyle('hip', { fillColor: '#8a3ac4' });

    return renderer;
  },

  // ==========================================
  // BODY TYPE RENDERERS
  // ==========================================

  /**
   * Renderer heroico (△) - Ombros largos, cintura fina
   */
  createHeroicRenderer(ctx: CanvasRenderingContext2D, color: string = '#4a90d9'): SkeletonRenderer {
    const renderer = new SkeletonRenderer(ctx, {
      shadow: true,
      shadowColor: 'rgba(0, 0, 0, 0.4)',
      shadowOffset: { x: 2, y: 4 },
      outlineWidth: 1.5,
      outlineColor: darkenColor(color, 40),
    });

    const lightColor = lightenColor(color, 20);

    // Cabeça
    renderer.setPartStyle('head', { fillColor: lightColor, shape: 'circle' });

    // Torso heroico - trapézio (largo em cima)
    renderer.setPartStyle('chest', {
      fillColor: color,
      shape: 'trapezoid',
      topWidthRatio: 1.6,
      bottomWidthRatio: 1.0,
      thicknessMultiplier: 1.5,
    });
    renderer.setPartStyle('spine', {
      fillColor: color,
      shape: 'tapered',
      startThickness: 1.0,
      endThickness: 1.4,
    });
    renderer.setPartStyle('hip', {
      fillColor: darkenColor(color, 10),
      shape: 'oval',
      thicknessMultiplier: 0.9,
    });

    // Braços fortes
    renderer.setPartStyle('arm_L', { fillColor: color, thicknessMultiplier: 1.1 });
    renderer.setPartStyle('arm_R', { fillColor: color, thicknessMultiplier: 1.1 });
    renderer.setPartStyle('forearm_L', { fillColor: color });
    renderer.setPartStyle('forearm_R', { fillColor: color });

    // Pernas proporcionais
    renderer.setPartStyle('thigh_L', { fillColor: darkenColor(color, 10) });
    renderer.setPartStyle('thigh_R', { fillColor: darkenColor(color, 10) });

    return renderer;
  },

  /**
   * Renderer bruiser (□) - Corpo quadrado, musculoso
   */
  createBruiserRenderer(ctx: CanvasRenderingContext2D, color: string = '#8b4513'): SkeletonRenderer {
    const renderer = new SkeletonRenderer(ctx, {
      shadow: true,
      shadowColor: 'rgba(0, 0, 0, 0.5)',
      shadowOffset: { x: 3, y: 5 },
      outlineWidth: 2,
      outlineColor: darkenColor(color, 50),
    });

    const lightColor = lightenColor(color, 15);

    // Cabeça pequena relativa ao corpo
    renderer.setPartStyle('head', {
      fillColor: lightColor,
      shape: 'circle',
      thicknessMultiplier: 1.0,
    });

    // Torso quadrado/retangular
    renderer.setPartStyle('chest', {
      fillColor: color,
      shape: 'rounded-rect',
      thicknessMultiplier: 1.8,
    });
    renderer.setPartStyle('spine', {
      fillColor: color,
      shape: 'capsule',
      thicknessMultiplier: 1.5,
    });
    renderer.setPartStyle('hip', {
      fillColor: darkenColor(color, 10),
      shape: 'rounded-rect',
      thicknessMultiplier: 1.4,
    });

    // Braços muito grossos
    renderer.setPartStyle('arm_L', { fillColor: color, thicknessMultiplier: 1.4 });
    renderer.setPartStyle('arm_R', { fillColor: color, thicknessMultiplier: 1.4 });
    renderer.setPartStyle('forearm_L', { fillColor: color, thicknessMultiplier: 1.3 });
    renderer.setPartStyle('forearm_R', { fillColor: color, thicknessMultiplier: 1.3 });

    // Pernas grossas
    renderer.setPartStyle('thigh_L', { fillColor: darkenColor(color, 10), thicknessMultiplier: 1.4 });
    renderer.setPartStyle('thigh_R', { fillColor: darkenColor(color, 10), thicknessMultiplier: 1.4 });
    renderer.setPartStyle('shin_L', { fillColor: darkenColor(color, 10), thicknessMultiplier: 1.2 });
    renderer.setPartStyle('shin_R', { fillColor: darkenColor(color, 10), thicknessMultiplier: 1.2 });

    return renderer;
  },

  /**
   * Renderer slim (▽) - Corpo fino, ágil
   */
  createSlimRenderer(ctx: CanvasRenderingContext2D, color: string = '#2e8b57'): SkeletonRenderer {
    const renderer = new SkeletonRenderer(ctx, {
      shadow: true,
      shadowColor: 'rgba(0, 0, 0, 0.3)',
      shadowOffset: { x: 1, y: 3 },
      outlineWidth: 1,
      outlineColor: darkenColor(color, 30),
    });

    const lightColor = lightenColor(color, 25);

    // Cabeça normal
    renderer.setPartStyle('head', { fillColor: lightColor, shape: 'circle' });

    // Torso fino - trapézio invertido (mais largo embaixo)
    renderer.setPartStyle('chest', {
      fillColor: color,
      shape: 'inv-trapezoid',
      topWidthRatio: 0.8,
      bottomWidthRatio: 1.0,
      thicknessMultiplier: 1.0,
    });
    renderer.setPartStyle('spine', {
      fillColor: color,
      shape: 'tapered',
      startThickness: 0.9,
      endThickness: 1.0,
      thicknessMultiplier: 0.9,
    });
    renderer.setPartStyle('hip', {
      fillColor: darkenColor(color, 10),
      thicknessMultiplier: 0.8,
    });

    // Braços finos
    renderer.setPartStyle('arm_L', { fillColor: color, thicknessMultiplier: 0.7 });
    renderer.setPartStyle('arm_R', { fillColor: color, thicknessMultiplier: 0.7 });
    renderer.setPartStyle('forearm_L', { fillColor: color, thicknessMultiplier: 0.6 });
    renderer.setPartStyle('forearm_R', { fillColor: color, thicknessMultiplier: 0.6 });

    // Pernas longas e finas
    renderer.setPartStyle('thigh_L', { fillColor: darkenColor(color, 10), thicknessMultiplier: 0.8 });
    renderer.setPartStyle('thigh_R', { fillColor: darkenColor(color, 10), thicknessMultiplier: 0.8 });
    renderer.setPartStyle('shin_L', { fillColor: darkenColor(color, 10), thicknessMultiplier: 0.7 });
    renderer.setPartStyle('shin_R', { fillColor: darkenColor(color, 10), thicknessMultiplier: 0.7 });

    return renderer;
  },

  /**
   * Renderer fat (○) - Corpo gordo, redondo
   */
  createFatRenderer(ctx: CanvasRenderingContext2D, color: string = '#cd853f'): SkeletonRenderer {
    const renderer = new SkeletonRenderer(ctx, {
      shadow: true,
      shadowColor: 'rgba(0, 0, 0, 0.4)',
      shadowOffset: { x: 3, y: 5 },
      outlineWidth: 1.5,
      outlineColor: darkenColor(color, 35),
    });

    const lightColor = lightenColor(color, 20);

    // Cabeça redonda
    renderer.setPartStyle('head', {
      fillColor: lightColor,
      shape: 'circle',
      thicknessMultiplier: 1.3,
    });

    // Torso oval/redondo (barriga grande)
    renderer.setPartStyle('chest', {
      fillColor: color,
      shape: 'oval',
      ovalRatioX: 1.4,
      ovalRatioY: 1.3,
      thicknessMultiplier: 2.0,
    });
    renderer.setPartStyle('spine', {
      fillColor: color,
      shape: 'oval',
      ovalRatioX: 1.3,
      ovalRatioY: 1.2,
      thicknessMultiplier: 1.8,
    });
    renderer.setPartStyle('hip', {
      fillColor: darkenColor(color, 10),
      shape: 'oval',
      ovalRatioX: 1.5,
      ovalRatioY: 1.0,
      thicknessMultiplier: 1.5,
    });

    // Braços gordinhos
    renderer.setPartStyle('arm_L', { fillColor: color, thicknessMultiplier: 1.2 });
    renderer.setPartStyle('arm_R', { fillColor: color, thicknessMultiplier: 1.2 });
    renderer.setPartStyle('forearm_L', { fillColor: color, thicknessMultiplier: 1.0 });
    renderer.setPartStyle('forearm_R', { fillColor: color, thicknessMultiplier: 1.0 });

    // Pernas curtas e grossas
    renderer.setPartStyle('thigh_L', { fillColor: darkenColor(color, 10), thicknessMultiplier: 1.3 });
    renderer.setPartStyle('thigh_R', { fillColor: darkenColor(color, 10), thicknessMultiplier: 1.3 });
    renderer.setPartStyle('shin_L', { fillColor: darkenColor(color, 10), thicknessMultiplier: 1.1 });
    renderer.setPartStyle('shin_R', { fillColor: darkenColor(color, 10), thicknessMultiplier: 1.1 });

    return renderer;
  },
};

// ==========================================
// UTILIDADES DE COR
// ==========================================

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
