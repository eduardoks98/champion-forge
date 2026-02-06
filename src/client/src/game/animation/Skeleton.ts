// ==========================================
// SKELETON - Estrutura de esqueleto humanoide
// ==========================================

import { Vector2 } from '../utils/Vector2';
import { Bone } from './Bone';
import { Direction8, getDirectionConfig, shouldFlipX, getBoneAnglesForDirection } from './Direction';

/**
 * Configuracao para criar um esqueleto
 */
export interface SkeletonConfig {
  scale?: number;          // Escala geral (default: 1)
  color?: string;          // Cor padrao dos bones
  bodyColor?: string;      // Cor do corpo
  limbColor?: string;      // Cor dos membros
}

/**
 * Direcao do personagem - agora usa 8 direções
 */
export type FacingDirection = Direction8;

/**
 * Esqueleto completo com hierarquia de bones
 *
 * Estrutura:
 *           [head]
 *             |
 *          [neck]
 *             |
 *         [chest]
 *        /   |   \
 *  [arm_L] [spine] [arm_R]
 *     |      |        |
 * [forearm_L][hip][forearm_R]
 *     |    /   \      |
 *  [hand_L][leg_L][leg_R][hand_R]
 *           |       |
 *        [shin_L][shin_R]
 *           |       |
 *        [foot_L][foot_R]
 */
export class Skeleton {
  private bones: Map<string, Bone> = new Map();
  private root: Bone;
  private position: Vector2 = new Vector2(0, 0);
  private scale: number = 1;
  private facing: Direction8 = Direction8.S;  // Default: olhando para frente (sul)

  // Cores
  bodyColor: string;
  limbColor: string;
  headColor: string;

  constructor(config: SkeletonConfig = {}) {
    this.scale = config.scale ?? 1;
    this.bodyColor = config.bodyColor ?? config.color ?? '#c8aa6e';
    this.limbColor = config.limbColor ?? config.color ?? '#a08050';
    this.headColor = config.color ?? '#c8aa6e';

    this.root = this.createHumanoidSkeleton();
  }

  /**
   * Cria estrutura de esqueleto humanoide
   *
   * Sistema de coordenadas (Canvas):
   * - Angulo 0 = direita (→)
   * - Angulo PI/2 = baixo (↓)
   * - Angulo -PI/2 = cima (↑)
   * - Angulo PI = esquerda (←)
   *
   * Referência visual (imagem Pinterest):
   * - Círculo → gordo/redondo
   * - Triângulo △ → heroico (ombros largos)
   * - Quadrado □ → musculoso
   * - Triângulo invertido ▽ → feminino
   * - Retângulo → padrão/magro
   */
  private createHumanoidSkeleton(): Bone {
    const s = this.scale;
    const baseScale = 2.5;

    // ═══════════════════════════════════════════
    // FATORES DE SCALE ANATÔMICOS
    // Baseado em como o corpo humano realmente muda com o peso
    // Fonte: Wikipedia Body Proportions, Canson Drawing Guide
    // ═══════════════════════════════════════════
    const scaleDiff = Math.max(0, (s - baseScale) / baseScale);

    // TORSO - onde a gordura mais se acumula
    const torsoThicknessBonus = 1 + scaleDiff * 0.8;  // Espessura do tronco aumenta muito

    // QUADRIS/OMBROS - articulações ficam mais afastadas
    const hipWidthBonus = 1 + scaleDiff * 1.0;        // Quadris alargam bastante
    const shoulderWidthBonus = 1 + scaleDiff * 0.6;   // Ombros alargam moderadamente

    // MEMBROS - ficam mais grossos mas não proporcionalmente
    const limbThicknessBonus = 1 + scaleDiff * 0.4;   // Braços/pernas engrossam pouco

    // EXTREMIDADES - mãos e pés quase não mudam
    const extremityBonus = 1 + scaleDiff * 0.2;       // Mãos/pés mudam muito pouco

    // CABEÇA - tamanho TOTALMENTE FIXO
    // (anatomicamente correto - cabeça não muda com peso corporal!)
    // Usa baseScale direto nos bones da cabeça

    // ═══════════════════════════════════════════
    // TORSO (coluna vertebral de baixo para cima)
    // ═══════════════════════════════════════════

    // HIP - ponto central do corpo (root) - engorda muito
    const hip = new Bone('hip', 0, 0, 6 * s * torsoThicknessBonus, this.bodyColor);

    // SPINE - sobe reto para cima (-PI/2) - engorda muito
    // Comprimento FIXO (baseScale), espessura variável (s * bonus)
    const spine = new Bone('spine', 15 * baseScale, -Math.PI / 2, 7 * s * torsoThicknessBonus, this.bodyColor);
    hip.addChild(spine);

    // CHEST - continua subindo - engorda muito
    // Comprimento FIXO (baseScale), espessura variável (s * bonus)
    const chest = new Bone('chest', 12 * baseScale, 0, 8 * s * torsoThicknessBonus, this.bodyColor);
    spine.addChild(chest);

    // NECK - curto, engorda pouco
    // Comprimento FIXO (baseScale), espessura variável (s * bonus)
    const neck = new Bone('neck', 4 * baseScale, 0, 3 * s * limbThicknessBonus, this.bodyColor);
    chest.addChild(neck);

    // HEAD - tamanho TOTALMENTE FIXO (anatomicamente correto - cabeça não muda com peso)
    // Comprimento E espessura usam baseScale (não mudam!)
    const head = new Bone('head', 2 * baseScale, 0, 12 * baseScale, this.headColor);
    neck.addChild(head);

    // ═══════════════════════════════════════════
    // CLAVÍCULAS (criam distância lateral para os ombros)
    // Length aumenta com shoulderWidthBonus para ombros mais afastados
    // ═══════════════════════════════════════════

    // Clavicle_L: sai do chest para a ESQUERDA
    // Comprimento usa baseScale * widthBonus (ombros ficam mais afastados)
    const clavicle_L = new Bone('clavicle_L', 10 * baseScale * shoulderWidthBonus, Math.PI / 2, 2 * s, this.limbColor);

    // Clavicle_R: sai do chest para a DIREITA
    // Comprimento usa baseScale * widthBonus (ombros ficam mais afastados)
    const clavicle_R = new Bone('clavicle_R', 10 * baseScale * shoulderWidthBonus, -Math.PI / 2, 2 * s, this.limbColor);

    chest.addChild(clavicle_L);
    chest.addChild(clavicle_R);

    // ═══════════════════════════════════════════
    // BRAÇO ESQUERDO (sai da clavícula esquerda)
    // Membros engrossam pouco (limbThicknessBonus)
    // ═══════════════════════════════════════════

    // Shoulder_L: pequeno bone de articulação
    // Comprimento FIXO (baseScale), espessura variável (s * bonus)
    const shoulder_L = new Bone('shoulder_L', 4 * baseScale, Math.PI / 2, 3 * s * limbThicknessBonus, this.limbColor);

    // Arm_L: braço principal, desce para baixo
    // Comprimento FIXO (baseScale), espessura variável (s * bonus)
    const arm_L = new Bone('arm_L', 14 * baseScale, 0, 4 * s * limbThicknessBonus, this.limbColor);

    // Forearm_L: antebraço
    // Comprimento FIXO (baseScale), espessura variável (s * bonus)
    const forearm_L = new Bone('forearm_L', 12 * baseScale, 0, 3.5 * s * limbThicknessBonus, this.limbColor);

    // Hand_L: mão no final - quase não muda (extremityBonus)
    // Comprimento FIXO (baseScale), espessura variável (s * bonus)
    const hand_L = new Bone('hand_L', 3 * baseScale, 0, 4 * s * extremityBonus, this.limbColor);

    clavicle_L.addChild(shoulder_L);
    shoulder_L.addChild(arm_L);
    arm_L.addChild(forearm_L);
    forearm_L.addChild(hand_L);

    // ═══════════════════════════════════════════
    // BRAÇO DIREITO (sai da clavícula direita)
    // Membros engrossam pouco (limbThicknessBonus)
    // ═══════════════════════════════════════════

    // Shoulder_R: pequeno bone de articulação
    // Comprimento FIXO (baseScale), espessura variável (s * bonus)
    const shoulder_R = new Bone('shoulder_R', 4 * baseScale, -Math.PI / 2, 3 * s * limbThicknessBonus, this.limbColor);

    // Arm_R: braço principal, desce para baixo
    // Comprimento FIXO (baseScale), espessura variável (s * bonus)
    const arm_R = new Bone('arm_R', 14 * baseScale, 0, 4 * s * limbThicknessBonus, this.limbColor);

    // Forearm_R: antebraço
    // Comprimento FIXO (baseScale), espessura variável (s * bonus)
    const forearm_R = new Bone('forearm_R', 12 * baseScale, 0, 3.5 * s * limbThicknessBonus, this.limbColor);

    // Hand_R - quase não muda (extremityBonus)
    // Comprimento FIXO (baseScale), espessura variável (s * bonus)
    const hand_R = new Bone('hand_R', 3 * baseScale, 0, 4 * s * extremityBonus, this.limbColor);

    clavicle_R.addChild(shoulder_R);
    shoulder_R.addChild(arm_R);
    arm_R.addChild(forearm_R);
    forearm_R.addChild(hand_R);

    // ═══════════════════════════════════════════
    // PELVIS (criam distância lateral para as pernas)
    // Length aumenta com hipWidthBonus para quadris mais afastados
    // ═══════════════════════════════════════════

    // Pelvis_L: sai do hip para BAIXO-ESQUERDA
    // Comprimento usa baseScale * widthBonus (quadris ficam mais afastados)
    const pelvis_L = new Bone('pelvis_L', 8 * baseScale * hipWidthBonus, Math.PI / 2 + 0.3, 3 * s, this.limbColor);

    // Pelvis_R: sai do hip para BAIXO-DIREITA
    // Comprimento usa baseScale * widthBonus (quadris ficam mais afastados)
    const pelvis_R = new Bone('pelvis_R', 8 * baseScale * hipWidthBonus, Math.PI / 2 - 0.3, 3 * s, this.limbColor);

    hip.addChild(pelvis_L);
    hip.addChild(pelvis_R);

    // ═══════════════════════════════════════════
    // PERNA ESQUERDA (sai da pelvis esquerda)
    // Membros engrossam pouco (limbThicknessBonus)
    // ═══════════════════════════════════════════

    // Thigh_L: aponta para baixo
    // Comprimento FIXO (baseScale), espessura variável (s * bonus)
    const thigh_L = new Bone('thigh_L', 16 * baseScale, -0.3, 5 * s * limbThicknessBonus, this.limbColor);

    // Shin_L: continua para baixo
    // Comprimento FIXO (baseScale), espessura variável (s * bonus)
    const shin_L = new Bone('shin_L', 14 * baseScale, 0, 4.5 * s * limbThicknessBonus, this.limbColor);

    // Foot_L: pé - quase não muda (extremityBonus)
    // Comprimento FIXO (baseScale), espessura variável (s * bonus)
    const foot_L = new Bone('foot_L', 6 * baseScale, -Math.PI / 2, 4 * s * extremityBonus, this.limbColor);

    pelvis_L.addChild(thigh_L);
    thigh_L.addChild(shin_L);
    shin_L.addChild(foot_L);

    // ═══════════════════════════════════════════
    // PERNA DIREITA (sai da pelvis direita)
    // Membros engrossam pouco (limbThicknessBonus)
    // ═══════════════════════════════════════════

    // Thigh_R: aponta para baixo
    // Comprimento FIXO (baseScale), espessura variável (s * bonus)
    const thigh_R = new Bone('thigh_R', 16 * baseScale, 0.3, 5 * s * limbThicknessBonus, this.limbColor);

    // Shin_R: continua para baixo
    // Comprimento FIXO (baseScale), espessura variável (s * bonus)
    const shin_R = new Bone('shin_R', 14 * baseScale, 0, 4.5 * s * limbThicknessBonus, this.limbColor);

    // Foot_R: pé - quase não muda (extremityBonus)
    // Comprimento FIXO (baseScale), espessura variável (s * bonus)
    const foot_R = new Bone('foot_R', 6 * baseScale, Math.PI / 2, 4 * s * extremityBonus, this.limbColor);

    pelvis_R.addChild(thigh_R);
    thigh_R.addChild(shin_R);
    shin_R.addChild(foot_R);

    // Registrar todos os bones
    this.registerBone(hip);
    this.registerBone(spine);
    this.registerBone(chest);
    this.registerBone(neck);
    this.registerBone(head);
    this.registerBone(clavicle_L);
    this.registerBone(clavicle_R);
    this.registerBone(pelvis_L);
    this.registerBone(pelvis_R);
    this.registerBone(shoulder_L);
    this.registerBone(arm_L);
    this.registerBone(forearm_L);
    this.registerBone(hand_L);
    this.registerBone(shoulder_R);
    this.registerBone(arm_R);
    this.registerBone(forearm_R);
    this.registerBone(hand_R);
    this.registerBone(thigh_L);
    this.registerBone(shin_L);
    this.registerBone(foot_L);
    this.registerBone(thigh_R);
    this.registerBone(shin_R);
    this.registerBone(foot_R);

    // ═══════════════════════════════════════════
    // CONSTRAINTS ANATÔMICOS
    // Limita rotação dos joints para evitar poses impossíveis
    // Valores em radianos (PI = 180°)
    // ═══════════════════════════════════════════
    this.applyAnatomicalConstraints();

    return hip;
  }

  /**
   * Aplica constraints anatômicos realistas aos joints
   * Baseado em limites reais do corpo humano
   *
   * OMBRO: Articulação mais flexível (ball-and-socket)
   * - Pode rotacionar em todas direções, mas com limites
   *
   * COTOVELO: Articulação de dobradiça (hinge)
   * - Só dobra em uma direção (flexão)
   * - NÃO pode hiperextender (quebra o braço)
   *
   * QUADRIL: Ball-and-socket mas mais restrito que ombro
   * - Limitado por ligamentos fortes para estabilidade
   *
   * JOELHO: Articulação de dobradiça
   * - NÃO hiperextende (para trás)
   * - Só dobra para frente
   */
  private applyAnatomicalConstraints(): void {
    // Conversão: graus para radianos
    const deg = (d: number) => (d * Math.PI) / 180;

    // ═══════════════════════════════════════════
    // BRAÇOS
    // ═══════════════════════════════════════════

    // Shoulder: muito flexível, mas não pode girar 360° livremente
    // Range: -180° a +180° (praticamente livre, mas com suavização)
    this.bones.get('shoulder_L')?.setConstraints(deg(-150), deg(150));
    this.bones.get('shoulder_R')?.setConstraints(deg(-150), deg(150));

    // Arm (upper arm): pode rotacionar bastante
    this.bones.get('arm_L')?.setConstraints(deg(-120), deg(120));
    this.bones.get('arm_R')?.setConstraints(deg(-120), deg(120));

    // Forearm (cotovelo): SÓ DOBRA PARA DENTRO
    // Extensão: 0° (reto), Flexão: ~150°
    // Não pode ir para trás (hiperextensão)
    this.bones.get('forearm_L')?.setConstraints(deg(0), deg(150));
    this.bones.get('forearm_R')?.setConstraints(deg(-150), deg(0));

    // Hand: pode rotacionar bastante (pulso flexível)
    this.bones.get('hand_L')?.setConstraints(deg(-90), deg(90));
    this.bones.get('hand_R')?.setConstraints(deg(-90), deg(90));

    // ═══════════════════════════════════════════
    // PERNAS
    // ═══════════════════════════════════════════

    // Thigh (quadril): flexível mas menos que ombro
    // Pode levantar a perna para frente (~120°) e pouco para trás (~30°)
    this.bones.get('thigh_L')?.setConstraints(deg(-30), deg(120));
    this.bones.get('thigh_R')?.setConstraints(deg(-120), deg(30));

    // Shin (joelho): SÓ DOBRA PARA TRÁS
    // Extensão: 0° (reto), Flexão: ~150°
    // NÃO pode hiperextender (para frente)
    this.bones.get('shin_L')?.setConstraints(deg(0), deg(150));
    this.bones.get('shin_R')?.setConstraints(deg(-150), deg(0));

    // Foot (tornozelo): range limitado
    // Dorsiflexão: ~20°, Plantarflexão: ~40°
    this.bones.get('foot_L')?.setConstraints(deg(-40), deg(20));
    this.bones.get('foot_R')?.setConstraints(deg(-20), deg(40));
  }

  /**
   * Registra um bone no mapa
   */
  private registerBone(bone: Bone): void {
    this.bones.set(bone.name, bone);
  }

  /**
   * Obtem um bone pelo nome
   */
  getBone(name: string): Bone | undefined {
    return this.bones.get(name);
  }

  /**
   * Obtem um bone (com erro se nao existir)
   */
  bone(name: string): Bone {
    const b = this.bones.get(name);
    if (!b) throw new Error(`Bone '${name}' not found`);
    return b;
  }

  /**
   * Atualiza posicao do esqueleto
   */
  setPosition(x: number, y: number): void {
    this.position.x = x;
    this.position.y = y;
  }

  /**
   * Define direcao (8 direções)
   */
  setFacing(direction: Direction8): void {
    this.facing = direction;
  }

  /**
   * Retorna a direção atual
   */
  getFacing(): Direction8 {
    return this.facing;
  }

  /**
   * Define direção baseado em velocidade
   */
  setFacingFromVelocity(vx: number, vy: number): void {
    if (vx === 0 && vy === 0) return; // Manter direção atual se parado

    // Calcular ângulo e converter para direção
    const angle = Math.atan2(vy, vx);
    const normalized = (angle + Math.PI * 2) % (Math.PI * 2);
    const sector = Math.round(normalized / (Math.PI / 4)) % 8;
    this.facing = sector as Direction8;
  }

  /**
   * Verifica se deve flipar horizontalmente
   */
  shouldFlipX(): boolean {
    return shouldFlipX(this.facing);
  }

  /**
   * Retorna configuração de render para direção atual
   */
  getDirectionConfig() {
    return getDirectionConfig(this.facing);
  }

  /**
   * Retorna posicao atual
   */
  getPosition(): Vector2 {
    return this.position.clone();
  }

  /**
   * Aplica os ângulos específicos da direção atual aos bones
   * Isso faz o personagem parecer diferente em cada direção
   */
  applyDirectionAngles(): void {
    const config = getBoneAnglesForDirection(this.facing);

    // Torso
    const spine = this.bones.get('spine');
    const chest = this.bones.get('chest');
    if (spine) spine.baseAngle = config.spineAngle;
    if (chest) chest.baseAngle = config.chestAngle;

    // Clavículas (criam distância lateral para os ombros)
    const clavicleL = this.bones.get('clavicle_L');
    const clavicleR = this.bones.get('clavicle_R');
    if (clavicleL) clavicleL.baseAngle = config.clavicleL_angle;
    if (clavicleR) clavicleR.baseAngle = config.clavicleR_angle;

    // Braços
    const shoulderL = this.bones.get('shoulder_L');
    const shoulderR = this.bones.get('shoulder_R');
    const armL = this.bones.get('arm_L');
    const armR = this.bones.get('arm_R');
    const forearmL = this.bones.get('forearm_L');
    const forearmR = this.bones.get('forearm_R');

    if (shoulderL) shoulderL.baseAngle = config.shoulderL_angle;
    if (shoulderR) shoulderR.baseAngle = config.shoulderR_angle;
    if (armL) armL.baseAngle = config.armL_angle;
    if (armR) armR.baseAngle = config.armR_angle;
    if (forearmL) forearmL.baseAngle = config.forearmL_angle;
    if (forearmR) forearmR.baseAngle = config.forearmR_angle;

    // Pelvis (criam distância lateral para as pernas)
    const pelvisL = this.bones.get('pelvis_L');
    const pelvisR = this.bones.get('pelvis_R');
    if (pelvisL) pelvisL.baseAngle = config.pelvisL_angle;
    if (pelvisR) pelvisR.baseAngle = config.pelvisR_angle;

    // Pernas
    const thighL = this.bones.get('thigh_L');
    const thighR = this.bones.get('thigh_R');
    const shinL = this.bones.get('shin_L');
    const shinR = this.bones.get('shin_R');
    const footL = this.bones.get('foot_L');
    const footR = this.bones.get('foot_R');

    if (thighL) thighL.baseAngle = config.thighL_angle;
    if (thighR) thighR.baseAngle = config.thighR_angle;
    if (shinL) shinL.baseAngle = config.shinL_angle;
    if (shinR) shinR.baseAngle = config.shinR_angle;
    if (footL) footL.baseAngle = config.footL_angle;
    if (footR) footR.baseAngle = config.footR_angle;
  }

  /**
   * Retorna config de quais bones esconder na direção atual
   */
  getHiddenBones(): { hideArmL: boolean; hideArmR: boolean; hideLegL: boolean; hideLegR: boolean } {
    const config = getBoneAnglesForDirection(this.facing);
    return {
      hideArmL: config.hideArmL,
      hideArmR: config.hideArmR,
      hideLegL: config.hideLegL,
      hideLegR: config.hideLegR,
    };
  }

  /**
   * Atualiza todas as posicoes world space dos bones
   */
  updateWorldTransforms(): void {
    // Aplicar ângulos específicos da direção ANTES de calcular as posições
    this.applyDirectionAngles();

    // O ângulo base é sempre 0 - o flip é tratado no renderer
    this.root.updateWorldPositions(this.position, 0);
  }

  /**
   * Reseta todos os bones para posicao de repouso
   */
  reset(): void {
    for (const bone of this.bones.values()) {
      bone.reset();
    }
  }

  /**
   * Itera sobre todos os bones
   */
  forEachBone(callback: (bone: Bone) => void): void {
    for (const bone of this.bones.values()) {
      callback(bone);
    }
  }

  /**
   * Retorna lista de bones para renderizacao (ordem correta)
   * A ordem depende da direção para depth sorting correto
   */
  getRenderOrder(): Bone[] {
    const config = getDirectionConfig(this.facing);
    const front = config.frontSide;
    const back = front === 'R' ? '_L' : '_R';
    const frontSuffix = `_${front}`;

    // Se mostrando costas, inverter ordem de algumas partes
    if (config.showBack) {
      return [
        // Membros da frente primeiro (ficam atrás)
        this.bone(`pelvis${frontSuffix}`),
        this.bone(`thigh${frontSuffix}`),
        this.bone(`shin${frontSuffix}`),
        this.bone(`foot${frontSuffix}`),
        this.bone(`clavicle${frontSuffix}`),
        this.bone(`shoulder${frontSuffix}`),
        this.bone(`arm${frontSuffix}`),
        this.bone(`forearm${frontSuffix}`),
        this.bone(`hand${frontSuffix}`),
        // Cabeça atrás do corpo quando visto de costas
        this.bone('head'),
        this.bone('neck'),
        // Corpo
        this.bone('chest'),
        this.bone('spine'),
        this.bone('hip'),
        // Membros de trás por último (ficam na frente)
        this.bone(`pelvis${back}`),
        this.bone(`thigh${back}`),
        this.bone(`shin${back}`),
        this.bone(`foot${back}`),
        this.bone(`clavicle${back}`),
        this.bone(`shoulder${back}`),
        this.bone(`arm${back}`),
        this.bone(`forearm${back}`),
        this.bone(`hand${back}`),
      ];
    }

    // Visão frontal ou lateral
    return [
      // Membros traseiros primeiro
      this.bone(`pelvis${back}`),
      this.bone(`thigh${back}`),
      this.bone(`shin${back}`),
      this.bone(`foot${back}`),
      this.bone(`clavicle${back}`),
      this.bone(`shoulder${back}`),
      this.bone(`arm${back}`),
      this.bone(`forearm${back}`),
      this.bone(`hand${back}`),
      // Corpo
      this.bone('hip'),
      this.bone('spine'),
      this.bone('chest'),
      this.bone('neck'),
      this.bone('head'),
      // Membros da frente
      this.bone(`pelvis${frontSuffix}`),
      this.bone(`thigh${frontSuffix}`),
      this.bone(`shin${frontSuffix}`),
      this.bone(`foot${frontSuffix}`),
      this.bone(`clavicle${frontSuffix}`),
      this.bone(`shoulder${frontSuffix}`),
      this.bone(`arm${frontSuffix}`),
      this.bone(`forearm${frontSuffix}`),
      this.bone(`hand${frontSuffix}`),
    ];
  }

  /**
   * Retorna a altura total do esqueleto (para colisao)
   */
  getHeight(): number {
    return 80 * this.scale; // Altura aproximada
  }

  /**
   * Retorna a largura do esqueleto
   */
  getWidth(): number {
    return 50 * this.scale;
  }

  /**
   * Retorna o root bone
   */
  getRoot(): Bone {
    return this.root;
  }
}

/**
 * Tipos de corpo para personagens
 */
export type BodyType = 'standard' | 'heroic' | 'bruiser' | 'slim' | 'fat';

/**
 * Factory para criar esqueletos pre-configurados
 */
export const SkeletonFactory = {
  /**
   * Esqueleto de jogador (padrão)
   */
  createPlayer(): Skeleton {
    return new Skeleton({
      scale: 2.5,
      bodyColor: '#4a90d9',
      limbColor: '#3a7bc4',
    });
  },

  /**
   * Esqueleto de inimigo basico
   */
  createEnemy(): Skeleton {
    return new Skeleton({
      scale: 2.2,
      bodyColor: '#d94a4a',
      limbColor: '#c43a3a',
    });
  },

  /**
   * Esqueleto de inimigo grande
   */
  createBossEnemy(): Skeleton {
    return new Skeleton({
      scale: 3.5,
      bodyColor: '#9b4ad9',
      limbColor: '#8a3ac4',
    });
  },

  // ==========================================
  // BODY TYPES - Diferentes silhuetas
  // ==========================================

  /**
   * Corpo heroico (△) - Ombros largos, cintura fina
   * Bom para: guerreiros, heróis, personagens principais
   */
  createHeroic(color: string = '#4a90d9'): Skeleton {
    return new Skeleton({
      scale: 2.8,
      bodyColor: color,
      limbColor: adjustColor(color, -20),
    });
  },

  /**
   * Corpo musculoso (□) - Quadrado, forte
   * Bom para: brutos, tanques, guardas
   */
  createBruiser(color: string = '#8b4513'): Skeleton {
    return new Skeleton({
      scale: 3.0,
      bodyColor: color,
      limbColor: adjustColor(color, -15),
    });
  },

  /**
   * Corpo esguio (▽) - Fino, ágil
   * Bom para: arqueiros, magos, assassinos
   */
  createSlim(color: string = '#2e8b57'): Skeleton {
    return new Skeleton({
      scale: 2.3,
      bodyColor: color,
      limbColor: adjustColor(color, -10),
    });
  },

  /**
   * Corpo gordo (○) - Redondo, pesado
   * Bom para: mercadores, chefes cômicos, NPCs
   */
  createFat(color: string = '#cd853f'): Skeleton {
    return new Skeleton({
      scale: 2.6,
      bodyColor: color,
      limbColor: adjustColor(color, -15),
    });
  },

  /**
   * Cria skeleton com body type específico
   * @param bodyType Tipo de corpo
   * @param color Cor principal (opcional)
   * @param scale Scale customizado (opcional, usa default do body type se não fornecido)
   */
  createWithBodyType(bodyType: BodyType, color?: string, scale?: number): Skeleton {
    const defaultScales: Record<BodyType, number> = {
      standard: 2.5,
      heroic: 2.8,
      bruiser: 3.0,
      slim: 2.3,
      fat: 2.6,
    };

    const finalScale = scale ?? defaultScales[bodyType];
    const finalColor = color || '#4a90d9';

    return new Skeleton({
      scale: finalScale,
      bodyColor: finalColor,
      limbColor: adjustColor(finalColor, -20),
    });
  },
};

/**
 * Ajusta brilho de uma cor hex
 */
function adjustColor(hex: string, amount: number): string {
  // Remove # se presente
  hex = hex.replace('#', '');

  // Parse RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  // Ajustar
  r = Math.max(0, Math.min(255, r + amount));
  g = Math.max(0, Math.min(255, g + amount));
  b = Math.max(0, Math.min(255, b + amount));

  // Converter de volta
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
