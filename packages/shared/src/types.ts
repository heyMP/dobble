export type GamePhase = 'lobby' | 'playing' | 'finished';

export interface Player {
  /** PartyKit connection ID (changes on reconnect) */
  id: string;
  /** Persistent client ID stored in sessionStorage (stable across reconnects) */
  clientId: string;
  name: string;
}

export interface BaseRoomState {
  phase: GamePhase;
  players: Player[];
  scores: Record<string, number>;
}
