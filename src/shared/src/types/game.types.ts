// Base types for Champion Forge

export interface BaseGameState {
  roomCode: string;
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  players: BasePlayer[];
}

export interface BasePlayer {
  id: string;
  name: string;
  isReady: boolean;
}

// Champion Forge specific types
export interface CHAMPGameState extends BaseGameState {
  // TODO: Adicionar campos especificos do jogo
  arenaId?: string;
  round?: number;
}

export interface CHAMPPlayer extends BasePlayer {
  // TODO: Adicionar campos especificos do jogador
  characterId?: string;
  team?: 'blue' | 'red';
}

// Socket.IO events
export interface CHAMPClientEvents {
  createRoom: (data: { mode: string }) => void;
  joinRoom: (data: { roomCode: string }) => void;
  gameAction: (data: { action: string; payload: unknown }) => void;
}

export interface CHAMPServerEvents {
  roomCreated: (data: { roomCode: string }) => void;
  roomJoined: (data: { roomCode: string; players: CHAMPPlayer[] }) => void;
  gameStateUpdate: (state: CHAMPGameState) => void;
  error: (data: { code: string; message: string }) => void;
}
