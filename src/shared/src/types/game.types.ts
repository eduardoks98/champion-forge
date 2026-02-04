import type { BaseGameState, BasePlayer } from '@mysys/game-sdk-shared';

// Estenda os tipos base para seu jogo
export interface CHAMPGameState extends BaseGameState {
  // TODO: Adicionar campos específicos do jogo
}

export interface CHAMPPlayer extends BasePlayer {
  // TODO: Adicionar campos específicos do jogador
}

// Eventos Socket.IO específicos do jogo
export interface CHAMPClientEvents {
  // TODO: Adicionar eventos do cliente
}

export interface CHAMPServerEvents {
  // TODO: Adicionar eventos do servidor
}
