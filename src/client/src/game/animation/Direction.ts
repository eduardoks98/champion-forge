// ==========================================
// DIRECTION - Sistema de 8 direções para isométrico
// ==========================================

/**
 * 8 direções para movimento isométrico
 *
 *         N (6)
 *     NW ↖ │ ↗ NE
 *    (5)   │   (7)
 * W ←──────┼──────→ E
 * (4)      │      (0)
 *     SW ↙ │ ↘ SE
 *    (3)   │   (1)
 *         S (2)
 */
export enum Direction8 {
  E = 0,      // 0°     - Direita
  SE = 1,     // 45°    - Baixo-Direita (diagonal)
  S = 2,      // 90°    - Baixo (frente do personagem)
  SW = 3,     // 135°   - Baixo-Esquerda (diagonal)
  W = 4,      // 180°   - Esquerda
  NW = 5,     // 225°   - Cima-Esquerda (diagonal)
  N = 6,      // 270°   - Cima (costas do personagem)
  NE = 7,     // 315°   - Cima-Direita (diagonal)
}

/**
 * Nomes das direções
 */
export const DIRECTION_NAMES: Record<Direction8, string> = {
  [Direction8.E]: 'E',
  [Direction8.SE]: 'SE',
  [Direction8.S]: 'S',
  [Direction8.SW]: 'SW',
  [Direction8.W]: 'W',
  [Direction8.NW]: 'NW',
  [Direction8.N]: 'N',
  [Direction8.NE]: 'NE',
};

/**
 * Ângulos em radianos para cada direção
 */
export const DIRECTION_ANGLES: Record<Direction8, number> = {
  [Direction8.E]: 0,
  [Direction8.SE]: Math.PI / 4,
  [Direction8.S]: Math.PI / 2,
  [Direction8.SW]: (3 * Math.PI) / 4,
  [Direction8.W]: Math.PI,
  [Direction8.NW]: (5 * Math.PI) / 4,
  [Direction8.N]: (3 * Math.PI) / 2,
  [Direction8.NE]: (7 * Math.PI) / 4,
};

/**
 * Calcula a direção baseado na velocidade (vx, vy)
 * Usa coordenadas de tela onde Y positivo = baixo
 */
export function getDirectionFromVelocity(vx: number, vy: number): Direction8 {
  if (vx === 0 && vy === 0) {
    return Direction8.S; // Default: frente (para baixo)
  }

  // atan2 retorna ângulo em radianos (-PI a PI)
  // Em coordenadas de tela: vy positivo = baixo
  const angle = Math.atan2(vy, vx);

  // Normalizar para 0 a 2PI
  const normalized = (angle + Math.PI * 2) % (Math.PI * 2);

  // Dividir em 8 setores de 45° cada (PI/4)
  // Adicionar metade de um setor para centralizar
  const sector = Math.round(normalized / (Math.PI / 4)) % 8;

  return sector as Direction8;
}

/**
 * Calcula direção baseado em delta de posição (de -> para)
 */
export function getDirectionFromDelta(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): Direction8 {
  return getDirectionFromVelocity(toX - fromX, toY - fromY);
}

/**
 * Retorna o nome da direção
 */
export function getDirectionName(dir: Direction8): string {
  return DIRECTION_NAMES[dir];
}

/**
 * Verifica se a direção deve ser espelhada horizontalmente
 * Direções que apontam para a esquerda (W, NW, SW)
 */
export function shouldFlipX(dir: Direction8): boolean {
  return dir === Direction8.W || dir === Direction8.NW || dir === Direction8.SW;
}

/**
 * Retorna a direção espelhada horizontalmente
 */
export function getMirroredDirection(dir: Direction8): Direction8 {
  const mirrors: Record<Direction8, Direction8> = {
    [Direction8.E]: Direction8.W,
    [Direction8.SE]: Direction8.SW,
    [Direction8.S]: Direction8.S,
    [Direction8.SW]: Direction8.SE,
    [Direction8.W]: Direction8.E,
    [Direction8.NW]: Direction8.NE,
    [Direction8.N]: Direction8.N,
    [Direction8.NE]: Direction8.NW,
  };
  return mirrors[dir];
}

/**
 * Configuração visual para cada direção
 * Controla como o skeleton é renderizado em cada ângulo
 */
export interface DirectionConfig {
  /** Escala do corpo (perspectiva) */
  bodyScaleX: number;
  /** Qual lado dos membros fica na frente (L ou R) */
  frontSide: 'L' | 'R';
  /** Se mostra as costas do personagem */
  showBack: boolean;
  /** Offset X da cabeça (perspectiva) */
  headOffsetX: number;
  /** Offset Y da cabeça (perspectiva) */
  headOffsetY: number;
  /** Rotação extra do torso */
  torsoRotation: number;
}

/**
 * Configurações de renderização para cada direção
 */
export const DIRECTION_CONFIGS: Record<Direction8, DirectionConfig> = {
  // Frente (para baixo) - visão frontal completa
  [Direction8.S]: {
    bodyScaleX: 1,
    frontSide: 'R',
    showBack: false,
    headOffsetX: 0,
    headOffsetY: 0,
    torsoRotation: 0,
  },
  // Diagonal frente-direita
  [Direction8.SE]: {
    bodyScaleX: 0.85,
    frontSide: 'R',
    showBack: false,
    headOffsetX: 3,
    headOffsetY: 0,
    torsoRotation: 0.15,
  },
  // Lateral direita
  [Direction8.E]: {
    bodyScaleX: 0.5,
    frontSide: 'R',
    showBack: false,
    headOffsetX: 5,
    headOffsetY: 0,
    torsoRotation: 0.3,
  },
  // Diagonal costas-direita
  [Direction8.NE]: {
    bodyScaleX: 0.85,
    frontSide: 'L',
    showBack: true,
    headOffsetX: 3,
    headOffsetY: -3,
    torsoRotation: 0.15,
  },
  // Costas (para cima) - visão traseira completa
  [Direction8.N]: {
    bodyScaleX: 1,
    frontSide: 'L',
    showBack: true,
    headOffsetX: 0,
    headOffsetY: -5,
    torsoRotation: 0,
  },
  // Diagonal costas-esquerda (espelhado de NE)
  [Direction8.NW]: {
    bodyScaleX: 0.85,
    frontSide: 'R',
    showBack: true,
    headOffsetX: -3,
    headOffsetY: -3,
    torsoRotation: -0.15,
  },
  // Lateral esquerda (espelhado de E)
  [Direction8.W]: {
    bodyScaleX: 0.5,
    frontSide: 'L',
    showBack: false,
    headOffsetX: -5,
    headOffsetY: 0,
    torsoRotation: -0.3,
  },
  // Diagonal frente-esquerda (espelhado de SE)
  [Direction8.SW]: {
    bodyScaleX: 0.85,
    frontSide: 'L',
    showBack: false,
    headOffsetX: -3,
    headOffsetY: 0,
    torsoRotation: -0.15,
  },
};

/**
 * Obtém a configuração para uma direção
 */
export function getDirectionConfig(dir: Direction8): DirectionConfig {
  return DIRECTION_CONFIGS[dir];
}

/**
 * Configuração dos ângulos dos bones para cada direção
 * Permite desenhar o personagem de forma diferente em cada direção
 */
export interface BoneAnglesConfig {
  // Torso
  spineAngle: number;      // Ângulo da spine (base -PI/2 = para cima)
  chestAngle: number;      // Ângulo relativo do chest

  // Clavículas (criam distância lateral para os ombros)
  clavicleL_angle: number;
  clavicleR_angle: number;

  // Braços (relativos ao parent)
  shoulderL_angle: number;
  shoulderR_angle: number;
  armL_angle: number;
  armR_angle: number;
  forearmL_angle: number;
  forearmR_angle: number;

  // Pelvis (criam distância lateral para as pernas)
  pelvisL_angle: number;
  pelvisR_angle: number;

  // Pernas (relativos ao parent)
  thighL_angle: number;
  thighR_angle: number;
  shinL_angle: number;
  shinR_angle: number;
  footL_angle: number;
  footR_angle: number;

  // Visibilidade/ordem
  hideArmL: boolean;
  hideArmR: boolean;
  hideLegL: boolean;
  hideLegR: boolean;
}

/**
 * Ângulos dos bones para cada direção
 * Isso permite desenhar o personagem corretamente visto de diferentes ângulos
 *
 * SISTEMA DE COORDENADAS:
 * - 0 = direita (→)
 * - PI/2 = baixo (↓)
 * - PI = esquerda (←)
 * - -PI/2 = cima (↑)
 *
 * HIERARQUIA:
 * - spine: sai do hip, ângulo absoluto -PI/2 = para cima
 * - chest: sai do spine, ângulo relativo 0 = mesmo sentido
 * - shoulder: sai do chest, ângulo relativo ao chest
 * - arm: sai do shoulder, ângulo relativo ao shoulder
 * - thigh: sai do hip, ângulo absoluto PI/2 = para baixo
 */
/**
 * BONE_ANGLES_BY_DIRECTION - Configuração de pose para cada direção
 *
 * SISTEMA DE COORDENADAS (Canvas):
 * - 0 rad = DIREITA (→)
 * - PI/2 rad = BAIXO (↓)
 * - PI rad = ESQUERDA (←)
 * - -PI/2 rad = CIMA (↑)
 *
 * HIERARQUIA DE BONES:
 * - hip (root, posição 0,0)
 *   - spine (ângulo -PI/2 = para CIMA)
 *     - chest (relativo ao spine)
 *       - shoulder_L (relativo ao chest)
 *         - arm_L (relativo ao shoulder)
 *       - shoulder_R (relativo ao chest)
 *         - arm_R (relativo ao shoulder)
 *   - thigh_L (ângulo absoluto, parte do hip)
 *   - thigh_R (ângulo absoluto, parte do hip)
 *
 * COMO OS ÂNGULOS FUNCIONAM:
 * - spine: ABSOLUTO, -PI/2 faz ir para CIMA
 * - chest: RELATIVO ao spine, 0 = continua na mesma direção
 * - shoulder: RELATIVO ao chest (que aponta para cima após spine)
 *   - Se chest aponta para CIMA (-PI/2 absoluto):
 *     - shoulder +PI/2 = para ESQUERDA (absoluto 0)... não, espera
 *   - NA VERDADE: shoulder é relativo, então +PI/2 do chest(-PI/2) = 0 = DIREITA
 * - thigh: ABSOLUTO, PI/2 = para BAIXO
 */
/**
 * BONE_ANGLES_BY_DIRECTION
 *
 * Baseado em referência SLYNYRD (slynyrd.com):
 * - Apenas 5 direções únicas são necessárias (S, SE, E, NE, N)
 * - As outras 3 (SW, W, NW) são espelhadas horizontalmente
 * - Braços e pernas descem junto ao corpo na vista frontal
 * - Na vista lateral, membros ficam sobrepostos (um na frente do outro)
 *
 * IMPORTANTE: Os ângulos de shoulder são RELATIVOS ao chest
 * O chest aponta para CIMA (-PI/2 absoluto)
 * Então shoulder +PI = aponta para BAIXO (oposto ao chest)
 */
export const BONE_ANGLES_BY_DIRECTION: Record<Direction8, BoneAnglesConfig> = {
  // ═══════════════════════════════════════════════════════════════
  // S (Sul) - FRENTE do personagem
  // Braços para BAIXO nos lados do corpo
  // ═══════════════════════════════════════════════════════════════
  [Direction8.S]: {
    spineAngle: -Math.PI / 2,     // Torso para CIMA
    chestAngle: 0,                 // Continua para CIMA

    // Clavículas para os LADOS (perpendiculares ao chest que aponta CIMA = -PI/2)
    // Chest aponta -PI/2, então:
    // L: -PI/2 + (-PI/2) = -PI = PI = ESQUERDA
    // R: -PI/2 + PI/2 = 0 = DIREITA
    clavicleL_angle: -Math.PI / 2,  // Clavícula L vai para ESQUERDA
    clavicleR_angle: Math.PI / 2,   // Clavícula R vai para DIREITA

    // Shoulders viram para BAIXO
    // Clavícula L aponta ESQUERDA (PI), shoulder deve ir BAIXO (PI/2): relativo = PI/2 - PI = -PI/2
    // Clavícula R aponta DIREITA (0), shoulder deve ir BAIXO (PI/2): relativo = PI/2 - 0 = PI/2
    shoulderL_angle: -Math.PI / 2,  // Absoluto: PI + (-PI/2) = PI/2 = BAIXO ✓
    shoulderR_angle: Math.PI / 2,   // Absoluto: 0 + PI/2 = PI/2 = BAIXO ✓
    armL_angle: 0,                 // Continua reto
    armR_angle: 0,                 // Continua reto
    forearmL_angle: 0,             // Continua reto
    forearmR_angle: 0,             // Continua reto

    // Pelvis para os lados (criam distância lateral)
    pelvisL_angle: Math.PI / 2 + 0.3,   // Baixo-esquerda
    pelvisR_angle: Math.PI / 2 - 0.3,   // Baixo-direita

    // Pernas descem RETAS (relativo à pelvis)
    thighL_angle: -0.3,                 // Corrige para descer reto
    thighR_angle: 0.3,                  // Corrige para descer reto
    shinL_angle: 0,
    shinR_angle: 0,
    footL_angle: -Math.PI / 2,          // Pé horizontal (para esquerda)
    footR_angle: Math.PI / 2,           // Pé horizontal (para direita)

    hideArmL: false,
    hideArmR: false,
    hideLegL: false,
    hideLegR: false,
  },

  // ═══════════════════════════════════════════════════════════════
  // N (Norte) - COSTAS do personagem
  // ═══════════════════════════════════════════════════════════════
  [Direction8.N]: {
    spineAngle: -Math.PI / 2,
    chestAngle: 0,

    // Clavículas para os LADOS
    clavicleL_angle: Math.PI / 2,
    clavicleR_angle: -Math.PI / 2,

    // Mesma pose que S (braços para baixo)
    shoulderL_angle: -Math.PI / 2,
    shoulderR_angle: Math.PI / 2,
    armL_angle: 0,
    armR_angle: 0,
    forearmL_angle: 0,
    forearmR_angle: 0,

    // Pelvis para os lados
    pelvisL_angle: Math.PI / 2 + 0.3,
    pelvisR_angle: Math.PI / 2 - 0.3,

    thighL_angle: -0.3,
    thighR_angle: 0.3,
    shinL_angle: 0,
    shinR_angle: 0,
    footL_angle: -Math.PI / 2,
    footR_angle: Math.PI / 2,

    hideArmL: false,
    hideArmR: false,
    hideLegL: false,
    hideLegR: false,
  },

  // ═══════════════════════════════════════════════════════════════
  // E (Leste) - Perfil DIREITO
  // ═══════════════════════════════════════════════════════════════
  [Direction8.E]: {
    spineAngle: -Math.PI / 2,
    chestAngle: 0,

    // Clavículas apontam para frente/trás no perfil
    clavicleL_angle: Math.PI,      // Para trás (escondida)
    clavicleR_angle: 0,            // Para frente (visível)

    // Braços para baixo
    shoulderL_angle: Math.PI / 2,
    shoulderR_angle: Math.PI / 2,
    armL_angle: 0,
    armR_angle: 0,
    forearmL_angle: 0,
    forearmR_angle: 0,

    // Pelvis sobrepostas no perfil
    pelvisL_angle: Math.PI / 2,
    pelvisR_angle: Math.PI / 2,

    // Pernas sobrepostas
    thighL_angle: 0,
    thighR_angle: 0,
    shinL_angle: 0,
    shinR_angle: 0,
    footL_angle: 0,
    footR_angle: 0,

    hideArmL: true,
    hideArmR: false,
    hideLegL: true,
    hideLegR: false,
  },

  // ═══════════════════════════════════════════════════════════════
  // W (Oeste) - Perfil ESQUERDO
  // ═══════════════════════════════════════════════════════════════
  [Direction8.W]: {
    spineAngle: -Math.PI / 2,
    chestAngle: 0,

    // Clavículas apontam para frente/trás no perfil
    clavicleL_angle: 0,            // Para frente (visível)
    clavicleR_angle: Math.PI,      // Para trás (escondida)

    // Braços para baixo
    shoulderL_angle: Math.PI / 2,
    shoulderR_angle: Math.PI / 2,
    armL_angle: 0,
    armR_angle: 0,
    forearmL_angle: 0,
    forearmR_angle: 0,

    // Pelvis sobrepostas no perfil
    pelvisL_angle: Math.PI / 2,
    pelvisR_angle: Math.PI / 2,

    // Pernas sobrepostas
    thighL_angle: 0,
    thighR_angle: 0,
    shinL_angle: 0,
    shinR_angle: 0,
    footL_angle: 0,
    footR_angle: 0,

    hideArmL: false,
    hideArmR: true,
    hideLegL: false,
    hideLegR: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // SE (Sudeste) - Diagonal frente-direita
  // ═══════════════════════════════════════════════════════════════
  [Direction8.SE]: {
    spineAngle: -Math.PI / 2,
    chestAngle: 0,

    // Clavículas em ângulo intermediário
    clavicleL_angle: Math.PI * 0.6,   // Mais para trás-esquerda
    clavicleR_angle: -Math.PI * 0.3,  // Mais para frente-direita

    // Braços para baixo
    shoulderL_angle: Math.PI / 2,
    shoulderR_angle: Math.PI / 2,
    armL_angle: 0,
    armR_angle: 0,
    forearmL_angle: 0,
    forearmR_angle: 0,

    // Pelvis em ângulo intermediário
    pelvisL_angle: Math.PI / 2 + 0.4,
    pelvisR_angle: Math.PI / 2 - 0.2,

    thighL_angle: -0.2,
    thighR_angle: 0.1,
    shinL_angle: 0,
    shinR_angle: 0,
    footL_angle: 0,
    footR_angle: 0,

    hideArmL: false,
    hideArmR: false,
    hideLegL: false,
    hideLegR: false,
  },

  // ═══════════════════════════════════════════════════════════════
  // SW (Sudoeste) - Diagonal frente-esquerda
  // ═══════════════════════════════════════════════════════════════
  [Direction8.SW]: {
    spineAngle: -Math.PI / 2,
    chestAngle: 0,

    // Espelhado de SE
    clavicleL_angle: Math.PI * 0.3,   // Mais para frente-esquerda
    clavicleR_angle: -Math.PI * 0.6,  // Mais para trás-direita

    // Braços para baixo
    shoulderL_angle: Math.PI / 2,
    shoulderR_angle: Math.PI / 2,
    armL_angle: 0,
    armR_angle: 0,
    forearmL_angle: 0,
    forearmR_angle: 0,

    // Pelvis em ângulo intermediário (espelhado de SE)
    pelvisL_angle: Math.PI / 2 + 0.2,
    pelvisR_angle: Math.PI / 2 - 0.4,

    thighL_angle: -0.1,
    thighR_angle: 0.2,
    shinL_angle: 0,
    shinR_angle: 0,
    footL_angle: 0,
    footR_angle: 0,

    hideArmL: false,
    hideArmR: false,
    hideLegL: false,
    hideLegR: false,
  },

  // ═══════════════════════════════════════════════════════════════
  // NE (Nordeste) - Diagonal costas-direita
  // ═══════════════════════════════════════════════════════════════
  [Direction8.NE]: {
    spineAngle: -Math.PI / 2,
    chestAngle: 0,

    // Similar a SE mas visto de costas
    clavicleL_angle: Math.PI * 0.6,
    clavicleR_angle: -Math.PI * 0.3,

    shoulderL_angle: Math.PI / 2,
    shoulderR_angle: Math.PI / 2,
    armL_angle: 0,
    armR_angle: 0,
    forearmL_angle: 0,
    forearmR_angle: 0,

    // Pelvis similar a SE
    pelvisL_angle: Math.PI / 2 + 0.4,
    pelvisR_angle: Math.PI / 2 - 0.2,

    thighL_angle: -0.2,
    thighR_angle: 0.1,
    shinL_angle: 0,
    shinR_angle: 0,
    footL_angle: 0,
    footR_angle: 0,

    hideArmL: false,
    hideArmR: false,
    hideLegL: false,
    hideLegR: false,
  },

  // ═══════════════════════════════════════════════════════════════
  // NW (Noroeste) - Diagonal costas-esquerda
  // ═══════════════════════════════════════════════════════════════
  [Direction8.NW]: {
    spineAngle: -Math.PI / 2,
    chestAngle: 0,

    // Similar a SW mas visto de costas
    clavicleL_angle: Math.PI * 0.3,
    clavicleR_angle: -Math.PI * 0.6,

    shoulderL_angle: Math.PI / 2,
    shoulderR_angle: Math.PI / 2,
    armL_angle: 0,
    armR_angle: 0,
    forearmL_angle: 0,
    forearmR_angle: 0,

    // Pelvis similar a SW
    pelvisL_angle: Math.PI / 2 + 0.2,
    pelvisR_angle: Math.PI / 2 - 0.4,

    thighL_angle: -0.1,
    thighR_angle: 0.2,
    shinL_angle: 0,
    shinR_angle: 0,
    footL_angle: 0,
    footR_angle: 0,

    hideArmL: false,
    hideArmR: false,
    hideLegL: false,
    hideLegR: false,
  },
};

/**
 * Obtém os ângulos dos bones para uma direção
 */
export function getBoneAnglesForDirection(dir: Direction8): BoneAnglesConfig {
  return BONE_ANGLES_BY_DIRECTION[dir];
}

/**
 * Interpola suavemente entre duas direções
 * Útil para transições suaves ao mudar de direção
 */
export function lerpDirection(
  current: Direction8,
  target: Direction8,
  t: number
): Direction8 {
  if (current === target || t >= 1) return target;
  if (t <= 0) return current;

  // Calcular a diferença circular (caminho mais curto)
  let diff = target - current;
  if (diff > 4) diff -= 8;
  if (diff < -4) diff += 8;

  // Interpolar
  const newDir = Math.round(current + diff * t);
  return ((newDir % 8) + 8) % 8 as Direction8;
}
