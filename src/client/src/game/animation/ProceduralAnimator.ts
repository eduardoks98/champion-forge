// ==========================================
// PROCEDURAL ANIMATOR
// Animacoes procedurais com FK e IK
// ==========================================

import { Vector2 } from '../utils/Vector2';
import { Bone } from './Bone';
import { Skeleton } from './Skeleton';
import { DEFAULT_ANIMATION } from '../constants/gameDefaults';

/**
 * Estados de animacao
 */
export type AnimationState = 'idle' | 'walk' | 'run' | 'attack' | 'hit' | 'death' | 'tpose';

/**
 * Configuracao de animacao
 */
export interface AnimationConfig {
  /** Velocidade da animacao (multiplicador) */
  speed?: number;

  /** Intensidade do movimento */
  intensity?: number;

  /** Suavizacao (smoothing) */
  smoothing?: number;
}

/**
 * Animador procedural para esqueletos
 *
 * Tecnicas utilizadas:
 * - Forward Kinematics (FK): Rotacoes em cascata do pai para filhos
 * - Inverse Kinematics (IK): Calcular rotacoes para alcancar um ponto (FABRIK)
 * - Smooth Damping: Suavizacao independente de framerate
 */
export class ProceduralAnimator {
  private skeleton: Skeleton;
  private currentState: AnimationState = 'idle';
  private stateTime: number = 0;
  private transitionTime: number = 0;
  private transitionDuration: number = 0.2; // segundos

  // Configuracoes por estado
  private configs: Map<AnimationState, AnimationConfig> = new Map();

  // Tempo acumulado para animacoes
  private time: number = 0;

  constructor(skeleton: Skeleton) {
    this.skeleton = skeleton;

    // Configs padrao
    this.configs.set('idle', { speed: 1, intensity: 1, smoothing: 5 });
    this.configs.set('walk', { speed: 1, intensity: 1, smoothing: 8 });
    this.configs.set('run', { speed: 1.5, intensity: 1.2, smoothing: 10 });
    this.configs.set('attack', { speed: 2, intensity: 1.5, smoothing: 15 });
    this.configs.set('hit', { speed: 1, intensity: 1, smoothing: 12 });
    this.configs.set('death', { speed: 0.5, intensity: 1, smoothing: 3 });
    this.configs.set('tpose', { speed: 0, intensity: 0, smoothing: 0 }); // SEM animação
  }

  /**
   * Atualiza a animacao
   * @param deltaTime Tempo desde ultimo frame (segundos)
   * @param velocity Velocidade atual do personagem (para blending)
   */
  update(deltaTime: number, velocity: Vector2 = new Vector2(0, 0)): void {
    this.time += deltaTime;
    this.stateTime += deltaTime;

    // Transicao entre estados
    if (this.transitionTime < this.transitionDuration) {
      this.transitionTime += deltaTime;
    }

    const defaultConfig = { speed: DEFAULT_ANIMATION.SPEED, intensity: DEFAULT_ANIMATION.INTENSITY, smoothing: DEFAULT_ANIMATION.SMOOTHING };
    const config = this.configs.get(this.currentState) ?? defaultConfig;
    const speed = config.speed ?? DEFAULT_ANIMATION.SPEED;
    const intensity = config.intensity ?? DEFAULT_ANIMATION.INTENSITY;
    const smoothing = config.smoothing ?? DEFAULT_ANIMATION.SMOOTHING;

    // Aplicar animacao baseada no estado
    switch (this.currentState) {
      case 'idle':
        this.applyIdleAnimation(deltaTime, intensity, smoothing);
        break;

      case 'walk':
        this.applyWalkAnimation(deltaTime, speed, intensity, smoothing, velocity);
        break;

      case 'run':
        this.applyRunAnimation(deltaTime, speed, intensity, smoothing, velocity);
        break;

      case 'attack':
        this.applyAttackAnimation(deltaTime, speed, intensity, smoothing);
        break;

      case 'hit':
        this.applyHitAnimation(deltaTime, intensity, smoothing);
        break;

      case 'death':
        this.applyDeathAnimation(deltaTime, smoothing);
        break;

      case 'tpose':
        // T-POSE: Braços abertos para os lados horizontalmente
        this.applyTPoseAnimation();
        break;
    }

    // Atualizar posicoes world space
    this.skeleton.updateWorldTransforms();
  }

  /**
   * Muda o estado de animacao
   */
  setState(state: AnimationState): void {
    if (this.currentState !== state) {
      this.currentState = state;
      this.stateTime = 0;
      this.transitionTime = 0;
    }
  }

  /**
   * Retorna estado atual
   */
  getState(): AnimationState {
    return this.currentState;
  }

  // ==========================================
  // ANIMACOES PROCEDURAIS
  // ==========================================

  /**
   * Animacao de idle - respiracao suave
   */
  private applyIdleAnimation(
    deltaTime: number,
    intensity: number,
    smoothing: number
  ): void {
    const t = this.time;

    // Respiracao - leve expansao do peito
    const breathCycle = Math.sin(t * 2) * 0.03 * intensity;

    // Micro-movimentos naturais
    const microSway = Math.sin(t * 0.7) * 0.02 * intensity;
    const headBob = Math.sin(t * 0.5) * 0.02 * intensity;

    // Aplicar ao torso
    this.skeleton.bone('chest').smoothDampAngle(breathCycle, smoothing, deltaTime);
    this.skeleton.bone('spine').smoothDampAngle(microSway * 0.5, smoothing, deltaTime);

    // Cabeca olha levemente ao redor
    this.skeleton.bone('head').smoothDampAngle(headBob, smoothing, deltaTime);
    this.skeleton.bone('neck').smoothDampAngle(headBob * 0.3, smoothing, deltaTime);

    // Bracos relaxados
    this.skeleton.bone('shoulder_L').smoothDampAngle(0, smoothing, deltaTime);
    this.skeleton.bone('shoulder_R').smoothDampAngle(0, smoothing, deltaTime);
    this.skeleton.bone('arm_L').smoothDampAngle(0.1, smoothing, deltaTime);
    this.skeleton.bone('arm_R').smoothDampAngle(-0.1, smoothing, deltaTime);
    this.skeleton.bone('forearm_L').smoothDampAngle(0.2, smoothing, deltaTime);
    this.skeleton.bone('forearm_R').smoothDampAngle(-0.2, smoothing, deltaTime);

    // Pernas retas
    this.skeleton.bone('thigh_L').smoothDampAngle(0, smoothing, deltaTime);
    this.skeleton.bone('thigh_R').smoothDampAngle(0, smoothing, deltaTime);
    this.skeleton.bone('shin_L').smoothDampAngle(0, smoothing, deltaTime);
    this.skeleton.bone('shin_R').smoothDampAngle(0, smoothing, deltaTime);
  }

  /**
   * Animacao de caminhada
   */
  private applyWalkAnimation(
    deltaTime: number,
    speed: number,
    intensity: number,
    smoothing: number,
    velocity: Vector2
  ): void {
    // Fase baseada no tempo
    const walkSpeed = 4 * speed; // ciclos por segundo
    const phase = (this.stateTime * walkSpeed) % (Math.PI * 2);

    // Amplitude baseada na velocidade
    const velocityMagnitude = velocity.magnitude();
    const amplitudeScale = Math.min(1, velocityMagnitude / 100) * intensity;

    // === PERNAS ===
    // Perna esquerda - movimento principal
    const thighL_angle = Math.sin(phase) * 0.5 * amplitudeScale;
    const shinL_angle = Math.max(0, Math.sin(phase) * 0.6) * amplitudeScale;
    const footL_angle = Math.sin(phase - 0.3) * 0.2 * amplitudeScale;

    // Perna direita - oposta
    const thighR_angle = Math.sin(phase + Math.PI) * 0.5 * amplitudeScale;
    const shinR_angle = Math.max(0, Math.sin(phase + Math.PI) * 0.6) * amplitudeScale;
    const footR_angle = Math.sin(phase + Math.PI - 0.3) * 0.2 * amplitudeScale;

    this.skeleton.bone('thigh_L').smoothDampAngle(thighL_angle, smoothing, deltaTime);
    this.skeleton.bone('shin_L').smoothDampAngle(shinL_angle, smoothing, deltaTime);
    this.skeleton.bone('foot_L').smoothDampAngle(footL_angle, smoothing, deltaTime);

    this.skeleton.bone('thigh_R').smoothDampAngle(thighR_angle, smoothing, deltaTime);
    this.skeleton.bone('shin_R').smoothDampAngle(shinR_angle, smoothing, deltaTime);
    this.skeleton.bone('foot_R').smoothDampAngle(footR_angle, smoothing, deltaTime);

    // === BRACOS === (opostos as pernas)
    const armL_angle = Math.sin(phase + Math.PI) * 0.3 * amplitudeScale;
    const forearmL_angle = Math.sin(phase + Math.PI) * 0.15 * amplitudeScale + 0.2;

    const armR_angle = Math.sin(phase) * 0.3 * amplitudeScale;
    const forearmR_angle = Math.sin(phase) * 0.15 * amplitudeScale - 0.2;

    this.skeleton.bone('arm_L').smoothDampAngle(armL_angle, smoothing, deltaTime);
    this.skeleton.bone('forearm_L').smoothDampAngle(forearmL_angle, smoothing, deltaTime);

    this.skeleton.bone('arm_R').smoothDampAngle(armR_angle, smoothing, deltaTime);
    this.skeleton.bone('forearm_R').smoothDampAngle(forearmR_angle, smoothing, deltaTime);

    // === TORSO === - balanco leve
    const spineRot = Math.sin(phase * 2) * 0.03 * amplitudeScale;
    const chestRot = Math.sin(phase) * 0.02 * amplitudeScale;

    this.skeleton.bone('spine').smoothDampAngle(spineRot, smoothing, deltaTime);
    this.skeleton.bone('chest').smoothDampAngle(chestRot, smoothing, deltaTime);

    // Cabeca estabiliza (olha para frente)
    this.skeleton.bone('head').smoothDampAngle(-chestRot * 0.5, smoothing, deltaTime);
  }

  /**
   * Animacao de corrida (mais intensa que caminhada)
   */
  private applyRunAnimation(
    deltaTime: number,
    speed: number,
    intensity: number,
    smoothing: number,
    velocity: Vector2
  ): void {
    const runSpeed = 6 * speed;
    const phase = (this.stateTime * runSpeed) % (Math.PI * 2);

    const velocityMagnitude = velocity.magnitude();
    const amplitudeScale = Math.min(1.2, velocityMagnitude / 150) * intensity;

    // === PERNAS === - movimento mais amplo
    const thighL_angle = Math.sin(phase) * 0.7 * amplitudeScale;
    const shinL_angle = Math.max(0, Math.sin(phase + 0.3)) * 0.9 * amplitudeScale;
    const footL_angle = Math.sin(phase - 0.2) * 0.3 * amplitudeScale;

    const thighR_angle = Math.sin(phase + Math.PI) * 0.7 * amplitudeScale;
    const shinR_angle = Math.max(0, Math.sin(phase + Math.PI + 0.3)) * 0.9 * amplitudeScale;
    const footR_angle = Math.sin(phase + Math.PI - 0.2) * 0.3 * amplitudeScale;

    this.skeleton.bone('thigh_L').smoothDampAngle(thighL_angle, smoothing, deltaTime);
    this.skeleton.bone('shin_L').smoothDampAngle(shinL_angle, smoothing, deltaTime);
    this.skeleton.bone('foot_L').smoothDampAngle(footL_angle, smoothing, deltaTime);

    this.skeleton.bone('thigh_R').smoothDampAngle(thighR_angle, smoothing, deltaTime);
    this.skeleton.bone('shin_R').smoothDampAngle(shinR_angle, smoothing, deltaTime);
    this.skeleton.bone('foot_R').smoothDampAngle(footR_angle, smoothing, deltaTime);

    // === BRACOS === - mais energia
    const armL_angle = Math.sin(phase + Math.PI) * 0.5 * amplitudeScale;
    const forearmL_angle = Math.sin(phase + Math.PI - 0.5) * 0.4 * amplitudeScale + 0.5;

    const armR_angle = Math.sin(phase) * 0.5 * amplitudeScale;
    const forearmR_angle = Math.sin(phase - 0.5) * 0.4 * amplitudeScale - 0.5;

    this.skeleton.bone('arm_L').smoothDampAngle(armL_angle, smoothing, deltaTime);
    this.skeleton.bone('forearm_L').smoothDampAngle(forearmL_angle, smoothing, deltaTime);

    this.skeleton.bone('arm_R').smoothDampAngle(armR_angle, smoothing, deltaTime);
    this.skeleton.bone('forearm_R').smoothDampAngle(forearmR_angle, smoothing, deltaTime);

    // === TORSO === - inclinacao para frente
    const forwardLean = -0.15 * amplitudeScale;
    const spineRot = Math.sin(phase * 2) * 0.05 * amplitudeScale;

    this.skeleton.bone('spine').smoothDampAngle(forwardLean + spineRot, smoothing, deltaTime);
    this.skeleton.bone('chest').smoothDampAngle(forwardLean * 0.5, smoothing, deltaTime);

    // Cabeca mantem nivel
    this.skeleton.bone('head').smoothDampAngle(-forwardLean, smoothing, deltaTime);
  }

  /**
   * Animacao de ataque (swing de arma)
   */
  private applyAttackAnimation(
    deltaTime: number,
    speed: number,
    intensity: number,
    smoothing: number
  ): void {
    // Progresso do ataque (0 a 1)
    const attackDuration = 0.4 / speed; // segundos
    const progress = Math.min(1, this.stateTime / attackDuration);

    // Curva de easing para o swing (reservado para uso futuro)
    // const swingCurve = this.easeOutBack(progress);

    // Fase do ataque
    // 0-0.3: wind up (preparacao)
    // 0.3-0.7: swing (ataque)
    // 0.7-1: recovery (recuperacao)

    let armAngle: number;
    let forearmAngle: number;
    let torsoTwist: number;

    if (progress < 0.3) {
      // Wind up - puxar braco para tras
      const windUp = progress / 0.3;
      armAngle = -0.8 * windUp * intensity;
      forearmAngle = -1.0 * windUp * intensity;
      torsoTwist = 0.2 * windUp * intensity;
    } else if (progress < 0.7) {
      // Swing - movimento rapido
      const swing = (progress - 0.3) / 0.4;
      const swingEased = this.easeOutQuad(swing);
      armAngle = -0.8 + 2.0 * swingEased * intensity;
      forearmAngle = -1.0 + 1.5 * swingEased * intensity;
      torsoTwist = 0.2 - 0.5 * swingEased * intensity;
    } else {
      // Recovery - voltar ao neutro
      const recovery = (progress - 0.7) / 0.3;
      armAngle = 1.2 * (1 - recovery) * intensity;
      forearmAngle = 0.5 * (1 - recovery) * intensity;
      torsoTwist = -0.3 * (1 - recovery) * intensity;
    }

    // Aplicar ao braco de ataque (direito por padrao)
    this.skeleton.bone('arm_R').smoothDampAngle(armAngle, smoothing * 2, deltaTime);
    this.skeleton.bone('forearm_R').smoothDampAngle(forearmAngle, smoothing * 2, deltaTime);

    // Braco esquerdo acompanha levemente
    this.skeleton.bone('arm_L').smoothDampAngle(-armAngle * 0.3, smoothing, deltaTime);

    // Torso gira com o ataque
    this.skeleton.bone('chest').smoothDampAngle(torsoTwist, smoothing, deltaTime);
    this.skeleton.bone('spine').smoothDampAngle(torsoTwist * 0.5, smoothing, deltaTime);

    // Pernas firmes
    this.skeleton.bone('thigh_L').smoothDampAngle(0.1, smoothing, deltaTime);
    this.skeleton.bone('thigh_R').smoothDampAngle(-0.1, smoothing, deltaTime);

    // Voltar para idle apos completar
    if (progress >= 1) {
      this.setState('idle');
    }
  }

  /**
   * Animacao de levar hit
   */
  private applyHitAnimation(
    deltaTime: number,
    intensity: number,
    smoothing: number
  ): void {
    const hitDuration = 0.3;
    const progress = Math.min(1, this.stateTime / hitDuration);

    // Recuo inicial, depois recupera
    const recoil = Math.sin(progress * Math.PI) * intensity;

    // Torso empurrado para tras
    this.skeleton.bone('spine').smoothDampAngle(0.3 * recoil, smoothing, deltaTime);
    this.skeleton.bone('chest').smoothDampAngle(0.2 * recoil, smoothing, deltaTime);

    // Cabeca joga para tras
    this.skeleton.bone('head').smoothDampAngle(0.4 * recoil, smoothing, deltaTime);

    // Bracos esticam com impacto
    this.skeleton.bone('arm_L').smoothDampAngle(0.3 * recoil, smoothing, deltaTime);
    this.skeleton.bone('arm_R').smoothDampAngle(-0.3 * recoil, smoothing, deltaTime);

    if (progress >= 1) {
      this.setState('idle');
    }
  }

  /**
   * Animacao de morte
   */
  private applyDeathAnimation(deltaTime: number, smoothing: number): void {
    const deathDuration = 1.0;
    const progress = Math.min(1, this.stateTime / deathDuration);

    // Cair gradualmente
    const fallProgress = this.easeInQuad(progress);

    // Torso cai para frente/lado
    this.skeleton.bone('hip').smoothDampAngle(0, smoothing, deltaTime);
    this.skeleton.bone('spine').smoothDampAngle(0.5 * fallProgress, smoothing, deltaTime);
    this.skeleton.bone('chest').smoothDampAngle(0.8 * fallProgress, smoothing, deltaTime);

    // Cabeca pende
    this.skeleton.bone('neck').smoothDampAngle(0.4 * fallProgress, smoothing, deltaTime);
    this.skeleton.bone('head').smoothDampAngle(0.6 * fallProgress, smoothing, deltaTime);

    // Bracos caem
    this.skeleton.bone('arm_L').smoothDampAngle(0.8 * fallProgress, smoothing, deltaTime);
    this.skeleton.bone('arm_R').smoothDampAngle(0.8 * fallProgress, smoothing, deltaTime);
    this.skeleton.bone('forearm_L').smoothDampAngle(0.5 * fallProgress, smoothing, deltaTime);
    this.skeleton.bone('forearm_R').smoothDampAngle(0.5 * fallProgress, smoothing, deltaTime);

    // Pernas dobram
    this.skeleton.bone('thigh_L').smoothDampAngle(0.3 * fallProgress, smoothing, deltaTime);
    this.skeleton.bone('thigh_R').smoothDampAngle(0.4 * fallProgress, smoothing, deltaTime);
    this.skeleton.bone('shin_L').smoothDampAngle(0.6 * fallProgress, smoothing, deltaTime);
    this.skeleton.bone('shin_R').smoothDampAngle(0.5 * fallProgress, smoothing, deltaTime);
  }

  /**
   * T-POSE: Pose estática com braços e pernas abertos
   * Usado para debug e visualização do esqueleto
   */
  private applyTPoseAnimation(): void {
    // Reseta todos os ângulos de offset para 0 (usa só o baseAngle)
    this.skeleton.reset();

    // === BRAÇOS HORIZONTAIS ===
    // Os shoulders devem apontar para os LADOS, não para baixo
    // PI/2 cancela o baseAngle negativo do shoulder_L
    this.skeleton.bone('shoulder_L').angle = Math.PI / 2;
    this.skeleton.bone('shoulder_R').angle = -Math.PI / 2;

    // Braços e antebraços continuam retos
    this.skeleton.bone('arm_L').angle = 0;
    this.skeleton.bone('arm_R').angle = 0;
    this.skeleton.bone('forearm_L').angle = 0;
    this.skeleton.bone('forearm_R').angle = 0;
    this.skeleton.bone('hand_L').angle = 0;
    this.skeleton.bone('hand_R').angle = 0;

    // === PERNAS ABERTAS ===
    // Pelvis apontam para baixo-lado (PI/2 +/- 0.3)
    // Thighs precisam de offset para abrir as pernas
    this.skeleton.bone('thigh_L').angle = -0.5;  // Abre perna esquerda para fora
    this.skeleton.bone('thigh_R').angle = 0.5;   // Abre perna direita para fora
    this.skeleton.bone('shin_L').angle = 0;
    this.skeleton.bone('shin_R').angle = 0;
    this.skeleton.bone('foot_L').angle = 0;
    this.skeleton.bone('foot_R').angle = 0;

    // === TORSO RETO ===
    this.skeleton.bone('spine').angle = 0;
    this.skeleton.bone('chest').angle = 0;
    this.skeleton.bone('neck').angle = 0;
    this.skeleton.bone('head').angle = 0;
  }

  // ==========================================
  // INVERSE KINEMATICS (FABRIK)
  // ==========================================

  /**
   * Resolve IK usando algoritmo FABRIK
   * @param chainNames Nomes dos bones na cadeia (do root ao end effector)
   * @param target Posicao alvo no world space
   * @param iterations Numero de iteracoes (mais = mais preciso)
   */
  solveIK(chainNames: string[], target: Vector2, iterations: number = 10): void {
    if (chainNames.length < 2) return;

    // Obter bones da cadeia
    const bones: Bone[] = chainNames.map(name => this.skeleton.bone(name));

    // Posicoes dos joints (pontos de conexao)
    const positions: Vector2[] = [];

    // Calcular posicoes iniciais
    for (const bone of bones) {
      positions.push(bone.worldStart.clone());
    }
    // Adicionar posicao final do ultimo bone
    positions.push(bones[bones.length - 1].worldEnd.clone());

    // Comprimentos dos segmentos
    const lengths: number[] = bones.map(b => b.length);

    // Comprimento total da cadeia
    const totalLength = lengths.reduce((sum, l) => sum + l, 0);

    // Verificar se target esta alcancavel
    const rootPos = positions[0];
    const distToTarget = rootPos.distanceTo(target);

    if (distToTarget > totalLength) {
      // Target muito longe - esticar na direcao
      const direction = target.clone().subtract(rootPos).normalize();
      for (let i = 1; i < positions.length; i++) {
        positions[i] = positions[i - 1].clone().add(direction.clone().scale(lengths[i - 1]));
      }
    } else {
      // FABRIK iterations
      for (let iter = 0; iter < iterations; iter++) {
        // Forward reaching (do end effector para root)
        positions[positions.length - 1] = target.clone();
        for (let i = positions.length - 2; i >= 0; i--) {
          const direction = positions[i].clone().subtract(positions[i + 1]).normalize();
          positions[i] = positions[i + 1].clone().add(direction.scale(lengths[i]));
        }

        // Backward reaching (do root para end effector)
        positions[0] = rootPos.clone();
        for (let i = 1; i < positions.length; i++) {
          const direction = positions[i].clone().subtract(positions[i - 1]).normalize();
          positions[i] = positions[i - 1].clone().add(direction.scale(lengths[i - 1]));
        }

        // Verificar convergencia
        const endDist = positions[positions.length - 1].distanceTo(target);
        if (endDist < 0.5) break;
      }
    }

    // Converter posicoes de volta para angulos dos bones
    for (let i = 0; i < bones.length; i++) {
      const bone = bones[i];
      const start = positions[i];
      const end = positions[i + 1];

      // Calcular angulo world space
      const worldAngle = Math.atan2(end.y - start.y, end.x - start.x);

      // Converter para angulo local (relativo ao parent)
      let localAngle = worldAngle;
      if (bone.parent) {
        const parentWorldAngle = this.getBoneWorldAngle(bone.parent);
        localAngle = worldAngle - parentWorldAngle;
      }

      // Aplicar constraints se houver
      if (bone.constraints) {
        localAngle = Math.max(bone.constraints.minAngle,
          Math.min(bone.constraints.maxAngle, localAngle));
      }

      bone.angle = localAngle;
    }
  }

  /**
   * Calcula angulo world space de um bone
   */
  private getBoneWorldAngle(bone: Bone): number {
    let angle = bone.angle + bone.baseAngle;
    let parent = bone.parent;
    while (parent) {
      angle += parent.angle + parent.baseAngle;
      parent = parent.parent;
    }
    return angle;
  }

  /**
   * IK para fazer a mao alcançar um ponto (arm chain)
   */
  reachWithHand(side: 'L' | 'R', target: Vector2): void {
    const chain = [`shoulder_${side}`, `arm_${side}`, `forearm_${side}`, `hand_${side}`];
    this.solveIK(chain, target, 5);
  }

  /**
   * IK para posicionar o pé (foot placement)
   */
  placeFootAt(side: 'L' | 'R', target: Vector2): void {
    const chain = [`thigh_${side}`, `shin_${side}`, `foot_${side}`];
    this.solveIK(chain, target, 5);
  }

  // ==========================================
  // EASING FUNCTIONS
  // ==========================================

  private easeInQuad(t: number): number {
    return t * t;
  }

  private easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  // Reservado para uso futuro em animacoes mais complexas
  // private easeOutBack(t: number): number {
  //   const c1 = 1.70158;
  //   const c3 = c1 + 1;
  //   return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  // }

  // private easeInOutQuad(t: number): number {
  //   return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  // }

  // ==========================================
  // UTILIDADES
  // ==========================================

  /**
   * Reseta o animador
   */
  reset(): void {
    this.time = 0;
    this.stateTime = 0;
    this.currentState = 'idle';
    this.skeleton.reset();
  }

  /**
   * Configura um estado
   */
  setConfig(state: AnimationState, config: AnimationConfig): void {
    this.configs.set(state, { ...this.configs.get(state), ...config });
  }

  /**
   * Retorna o skeleton associado
   */
  getSkeleton(): Skeleton {
    return this.skeleton;
  }
}
