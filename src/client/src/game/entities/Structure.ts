import { Entity } from './Entity';

export type StructureType = 'nexus' | 'tower';
export type StructureTeam = 'blue' | 'red';

// Prioridade de alvos para torres (estilo LoL)
// Menor número = maior prioridade
export enum TowerTargetPriority {
  SIEGE_MINION = 1,    // Siege minions têm maior prioridade
  MELEE_MINION = 2,    // Melee minions
  CASTER_MINION = 3,   // Caster minions
  CHAMPION = 4,        // Champions (players) têm menor prioridade
}

export class Structure extends Entity {
  team: StructureTeam;
  structureType: StructureType;

  // Torres podem atacar, Nexus não
  attackRange: number = 0;
  attackDamage: number = 0;
  attackCooldown: number = 0;
  private attackTimer: number = 0;

  // Efeito visual de ataque (laser estilo LoL)
  private currentTarget: Entity | null = null;
  private laserTimer: number = 0;
  private static readonly LASER_DURATION = 200; // ms que o laser fica visível

  // Sistema de aggro (alvo fixo até morrer ou sair do range)
  private aggroTarget: Entity | null = null;
  private aggroSwapTimer: number = 0; // Timer para mudar de alvo após aggro de champion
  private static readonly AGGRO_SWAP_DELAY = 500; // 0.5s delay antes de mudar alvo

  constructor(x: number, y: number, team: StructureTeam, type: StructureType) {
    const size = type === 'nexus' ? 80 : 50;
    const hp = type === 'nexus' ? 5000 : 3000;

    super({
      id: `${type}-${team}`,
      x,
      y,
      width: size,
      height: size,
      hitRadius: size / 2,
      color: team === 'blue' ? '#3498db' : '#e74c3c',
      hp,
      maxHp: hp,
    });

    this.team = team;
    this.structureType = type;

    // Torres têm ataque
    if (type === 'tower') {
      this.attackRange = 300;
      this.attackDamage = 100;
      this.attackCooldown = 1000; // 1 segundo
    }
  }

  update(deltaTime: number): void {
    this.updateAnimationTimers(deltaTime);

    // Torres atacam automaticamente
    if (this.structureType === 'tower' && this.attackTimer > 0) {
      this.attackTimer -= deltaTime;
    }

    // Atualizar timer do laser visual
    if (this.laserTimer > 0) {
      this.laserTimer -= deltaTime;
      if (this.laserTimer <= 0) {
        this.currentTarget = null;
      }
    }
  }

  /**
   * Verifica se a torre pode atacar e retorna true se atacou
   * Usa sistema de prioridade de alvos estilo LoL:
   * 1. Siege minions (se tivermos tipos diferentes)
   * 2. Melee minions
   * 3. Caster minions
   * 4. Champions (players)
   *
   * A torre mantém o alvo até ele morrer ou sair do range.
   * Se um champion ataca um aliado perto da torre, a torre troca para o champion.
   */
  tryAttack(targets: Entity[], championAggroed: boolean = false): Entity | null {
    if (this.structureType !== 'tower') return null;
    if (this.attackTimer > 0) return null;
    if (this.isDead) return null;

    // Atualizar timer de swap de aggro
    if (this.aggroSwapTimer > 0) {
      this.aggroSwapTimer -= 16.67; // Aproximado deltaTime
    }

    // Se champion agrediu aliado, trocar para ele (com delay)
    if (championAggroed && this.aggroSwapTimer <= 0) {
      // Encontrar o champion entre os targets
      for (const target of targets) {
        if (target.id === 'player' && !target.isDead) {
          const dist = this.distanceTo(target);
          if (dist <= this.attackRange) {
            this.aggroTarget = target;
            this.aggroSwapTimer = Structure.AGGRO_SWAP_DELAY;
            break;
          }
        }
      }
    }

    // Verificar se alvo atual ainda é válido
    if (this.aggroTarget) {
      if (this.aggroTarget.isDead || this.distanceTo(this.aggroTarget) > this.attackRange) {
        this.aggroTarget = null;
      }
    }

    // Se não tem alvo, encontrar um novo usando prioridade
    if (!this.aggroTarget) {
      this.aggroTarget = this.findTargetByPriority(targets);
    }

    // Atacar o alvo atual
    if (this.aggroTarget) {
      this.attackTimer = this.attackCooldown;
      // Ativar efeito visual de laser
      this.currentTarget = this.aggroTarget;
      this.laserTimer = Structure.LASER_DURATION;
      return this.aggroTarget;
    }

    return null;
  }

  /**
   * Encontra alvo usando sistema de prioridade
   * Minions > Champions
   */
  private findTargetByPriority(targets: Entity[]): Entity | null {
    // Separar minions e champions
    const minions: Entity[] = [];
    const champions: Entity[] = [];

    for (const target of targets) {
      if (target.isDead) continue;
      const dist = this.distanceTo(target);
      if (dist > this.attackRange) continue;

      // Identificar tipo pelo id
      if (target.id.startsWith('minion-')) {
        minions.push(target);
      } else if (target.id === 'player') {
        champions.push(target);
      } else {
        // Outros (enemies genéricos) tratados como minions
        minions.push(target);
      }
    }

    // Prioridade 1: Minions (o mais próximo)
    if (minions.length > 0) {
      let nearest: Entity | null = null;
      let nearestDist = Infinity;

      for (const minion of minions) {
        const dist = this.distanceTo(minion);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = minion;
        }
      }

      return nearest;
    }

    // Prioridade 2: Champions (o mais próximo)
    if (champions.length > 0) {
      let nearest: Entity | null = null;
      let nearestDist = Infinity;

      for (const champion of champions) {
        const dist = this.distanceTo(champion);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = champion;
        }
      }

      return nearest;
    }

    return null;
  }

  /**
   * Força troca de aggro para um alvo específico (quando champion ataca aliado)
   */
  forceAggroSwap(target: Entity): void {
    if (this.isDead) return;
    const dist = this.distanceTo(target);
    if (dist <= this.attackRange) {
      this.aggroTarget = target;
    }
  }

  /**
   * Retorna o alvo atual para efeito visual
   */
  getCurrentTarget(): Entity | null {
    return this.currentTarget;
  }

  /**
   * Verifica se o laser está ativo
   */
  isLaserActive(): boolean {
    return this.laserTimer > 0 && this.currentTarget !== null;
  }

  getAttackDamage(): number {
    return this.attackDamage;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.isDead && this.deathScale <= 0) return;

    ctx.save();

    // Escala de morte
    if (this.isDead) {
      ctx.translate(this.centerX, this.centerY);
      ctx.scale(this.deathScale, this.deathScale);
      ctx.translate(-this.centerX, -this.centerY);
    }

    // Efeito de hit
    if (this.isHit) {
      ctx.filter = 'brightness(1.5)';
    }

    // Corpo da estrutura (quadrado com cantos arredondados simulados)
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Borda
    ctx.strokeStyle = this.team === 'blue' ? '#2980b9' : '#c0392b';
    ctx.lineWidth = 3;
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    // Símbolo central
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = this.structureType === 'nexus' ? 'bold 24px Arial' : 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (this.structureType === 'nexus') {
      ctx.fillText('N', this.centerX, this.centerY);
    } else {
      ctx.fillText('T', this.centerX, this.centerY);
    }

    ctx.filter = 'none';

    // Renderizar laser de ataque (estilo LoL)
    if (this.isLaserActive() && this.currentTarget) {
      this.renderLaser(ctx);
    }

    // Barra de vida (maior para estruturas)
    if (!this.isDead) {
      this.renderStructureHealthBar(ctx);
    }

    ctx.restore();
  }

  /**
   * Renderiza o laser de ataque da torre (estilo LoL)
   */
  private renderLaser(ctx: CanvasRenderingContext2D): void {
    if (!this.currentTarget) return;

    const targetX = this.currentTarget.centerX;
    const targetY = this.currentTarget.centerY;

    // Calcular intensidade baseado no timer (fade out)
    const intensity = this.laserTimer / Structure.LASER_DURATION;

    // Cor do laser baseada no time
    const laserColor = this.team === 'blue' ? '100, 150, 255' : '255, 100, 150';

    // Glow externo (mais largo, mais transparente)
    ctx.strokeStyle = `rgba(${laserColor}, ${0.3 * intensity})`;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.centerX, this.centerY);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();

    // Laser médio
    ctx.strokeStyle = `rgba(${laserColor}, ${0.6 * intensity})`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(this.centerX, this.centerY);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();

    // Laser central (mais brilhante)
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.9 * intensity})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.centerX, this.centerY);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();

    // Círculo de impacto no alvo
    ctx.fillStyle = `rgba(${laserColor}, ${0.5 * intensity})`;
    ctx.beginPath();
    ctx.arc(targetX, targetY, 15 * intensity, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Renderiza informações de debug (range de ataque)
   */
  renderDebug(ctx: CanvasRenderingContext2D): void {
    if (this.structureType !== 'tower' || this.isDead) return;

    // Círculo de range de ataque (rosa/roxo estilo LoL)
    const rangeColor = this.team === 'blue' ? '100, 100, 255' : '255, 100, 100';

    // Área preenchida semi-transparente
    ctx.fillStyle = `rgba(${rangeColor}, 0.1)`;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.attackRange, 0, Math.PI * 2);
    ctx.fill();

    // Borda do range
    ctx.strokeStyle = `rgba(${rangeColor}, 0.5)`;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.attackRange, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /**
   * Renderiza barra de vida maior para estruturas
   */
  private renderStructureHealthBar(ctx: CanvasRenderingContext2D): void {
    const barWidth = this.width * 1.5;
    const barHeight = 8;
    const barX = this.centerX - barWidth / 2;
    const barY = this.y - 15;

    // Fundo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Vida
    const healthPercent = this.hp / this.maxHp;
    let fillColor: string;

    if (healthPercent > 0.6) {
      fillColor = '#2ecc71'; // Verde
    } else if (healthPercent > 0.3) {
      fillColor = '#f1c40f'; // Amarelo
    } else {
      fillColor = '#e74c3c'; // Vermelho
    }

    ctx.fillStyle = fillColor;
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    // Borda
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Divisões (cada 500 HP)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 1;
    const divisions = Math.floor(this.maxHp / 500);
    for (let i = 1; i < divisions; i++) {
      const divX = barX + (barWidth * i) / divisions;
      ctx.beginPath();
      ctx.moveTo(divX, barY);
      ctx.lineTo(divX, barY + barHeight);
      ctx.stroke();
    }

    // Texto de HP
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(this.hp)}/${this.maxHp}`, this.centerX, barY - 3);
  }

  shouldRemove(): boolean {
    return this.isDead && this.deathScale <= 0;
  }
}
