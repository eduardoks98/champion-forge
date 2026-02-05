// ==========================================
// STATS SERVICE
// Sistema de Estatísticas com Progressão (Estilo LoL Eternals)
// ==========================================

import { PrismaClient } from '@prisma/client';
import {
  UserStats,
  StatKey,
  StatProgress,
  UserStatsResponse,
  STAT_DEFINITIONS,
  calculateStatProgress,
  INITIAL_USER_STATS,
} from '@champion-forge/shared';

const prisma = new PrismaClient();

// ==========================================
// STATS SERVICE CLASS
// ==========================================

export class StatsService {
  /**
   * Buscar ou criar stats do usuário
   */
  async getOrCreateUserStats(userId: string): Promise<UserStats> {
    let stats = await prisma.userStats.findUnique({
      where: { userId },
    });

    if (!stats) {
      // Criar stats zeradas para o usuário
      stats = await prisma.userStats.create({
        data: {
          userId,
          ...INITIAL_USER_STATS,
        },
      });
      console.log(`[Stats] Created new stats for user ${userId}`);
    }

    return this.mapPrismaToUserStats(stats);
  }

  /**
   * Buscar stats com progresso calculado
   */
  async getUserStatsWithProgress(userId: string): Promise<UserStatsResponse> {
    const stats = await this.getOrCreateUserStats(userId);
    const progress = this.calculateAllProgress(stats);
    const totalXpEarned = this.calculateTotalXpEarned(progress);

    return {
      userId,
      stats,
      progress,
      totalXpEarned,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Incrementar uma estatística
   */
  async incrementStat(
    userId: string,
    stat: StatKey,
    amount: number = 1
  ): Promise<UserStats> {
    // Garantir que stats existem
    await this.getOrCreateUserStats(userId);

    // Incrementar a stat específica
    const updateData: Record<string, { increment: number }> = {
      [stat]: { increment: amount },
    };

    // Lógica especial para winStreak
    if (stat === 'wins') {
      // Também incrementar winStreak
      updateData['winStreak'] = { increment: 1 };
    }

    const updated = await prisma.userStats.update({
      where: { userId },
      data: updateData,
    });

    // Atualizar maxWinStreak se necessário
    if (stat === 'wins' && updated.winStreak > updated.maxWinStreak) {
      await prisma.userStats.update({
        where: { userId },
        data: { maxWinStreak: updated.winStreak },
      });
    }

    // Resetar winStreak em caso de derrota
    if (stat === 'losses') {
      await prisma.userStats.update({
        where: { userId },
        data: { winStreak: 0 },
      });
    }

    console.log(`[Stats] Incremented ${stat} by ${amount} for user ${userId}`);
    return this.mapPrismaToUserStats(updated);
  }

  /**
   * Incrementar múltiplas estatísticas de uma vez
   */
  async incrementMultipleStats(
    userId: string,
    stats: Partial<Record<StatKey, number>>
  ): Promise<UserStats> {
    // Garantir que stats existem
    await this.getOrCreateUserStats(userId);

    // Criar objeto de update
    const updateData: Record<string, { increment: number }> = {};
    for (const [key, amount] of Object.entries(stats)) {
      if (amount && amount > 0) {
        updateData[key] = { increment: amount };
      }
    }

    // Lógica especial para wins/losses
    if (stats.wins && stats.wins > 0) {
      updateData['winStreak'] = { increment: 1 };
    }

    const updated = await prisma.userStats.update({
      where: { userId },
      data: updateData,
    });

    // Atualizar maxWinStreak se necessário
    if (stats.wins && updated.winStreak > updated.maxWinStreak) {
      await prisma.userStats.update({
        where: { userId },
        data: { maxWinStreak: updated.winStreak },
      });
    }

    // Resetar winStreak em caso de derrota
    if (stats.losses && stats.losses > 0) {
      await prisma.userStats.update({
        where: { userId },
        data: { winStreak: 0 },
      });
    }

    console.log(`[Stats] Incremented multiple stats for user ${userId}:`, stats);
    return this.mapPrismaToUserStats(updated);
  }

  /**
   * Calcular progresso de todas as estatísticas
   */
  private calculateAllProgress(stats: UserStats): StatProgress[] {
    return STAT_DEFINITIONS.map((definition) => {
      const value = stats[definition.key] ?? 0;
      return calculateStatProgress(definition, value);
    });
  }

  /**
   * Calcular XP total ganho com milestones
   */
  private calculateTotalXpEarned(progress: StatProgress[]): number {
    let totalXp = 0;

    for (const stat of progress) {
      const definition = STAT_DEFINITIONS.find((d) => d.key === stat.key);
      if (!definition) continue;

      // Somar XP de cada milestone completado
      for (let i = 0; i < stat.completedMilestones.length; i++) {
        totalXp += definition.xpPerMilestone[i] ?? 0;
      }
    }

    return totalXp;
  }

  /**
   * Mapear dados do Prisma para UserStats
   */
  private mapPrismaToUserStats(prismaStats: {
    kills: number;
    deaths: number;
    assists: number;
    damageDealt: number;
    damageTaken: number;
    gamesPlayed: number;
    wins: number;
    losses: number;
    winStreak: number;
    maxWinStreak: number;
    timePlayed: number;
    abilitiesUsed: number;
    skillshotsHit: number;
    dashesUsed: number;
    criticalHits: number;
  }): UserStats {
    return {
      kills: prismaStats.kills,
      deaths: prismaStats.deaths,
      assists: prismaStats.assists,
      damageDealt: prismaStats.damageDealt,
      damageTaken: prismaStats.damageTaken,
      gamesPlayed: prismaStats.gamesPlayed,
      wins: prismaStats.wins,
      losses: prismaStats.losses,
      winStreak: prismaStats.winStreak,
      maxWinStreak: prismaStats.maxWinStreak,
      timePlayed: prismaStats.timePlayed,
      abilitiesUsed: prismaStats.abilitiesUsed,
      skillshotsHit: prismaStats.skillshotsHit,
      dashesUsed: prismaStats.dashesUsed,
      criticalHits: prismaStats.criticalHits,
    };
  }

  /**
   * Registrar fim de partida e atualizar todas as stats relevantes
   */
  async recordGameEnd(
    userId: string,
    gameData: {
      won: boolean;
      kills: number;
      deaths: number;
      assists: number;
      damageDealt: number;
      damageTaken: number;
      abilitiesUsed: number;
      skillshotsHit: number;
      dashesUsed: number;
      criticalHits: number;
      gameTimeMinutes: number;
    }
  ): Promise<UserStats> {
    const stats: Partial<Record<StatKey, number>> = {
      gamesPlayed: 1,
      wins: gameData.won ? 1 : 0,
      losses: gameData.won ? 0 : 1,
      kills: gameData.kills,
      deaths: gameData.deaths,
      assists: gameData.assists,
      damageDealt: gameData.damageDealt,
      damageTaken: gameData.damageTaken,
      abilitiesUsed: gameData.abilitiesUsed,
      skillshotsHit: gameData.skillshotsHit,
      dashesUsed: gameData.dashesUsed,
      criticalHits: gameData.criticalHits,
      timePlayed: gameData.gameTimeMinutes,
    };

    return this.incrementMultipleStats(userId, stats);
  }
}

export const statsService = new StatsService();
