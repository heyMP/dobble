import type { GamePhase, Player } from './types.js';

/**
 * Client -> Server events common to all games.
 * Game-specific client events should be defined per-game and unioned
 * with this type: `BaseClientEvent | MyGameClientEvent`.
 */
export type BaseClientEvent =
  | { type: 'player:join'; name: string; clientId: string }
  | { type: 'player:leave'; clientId: string }
  | { type: 'game:start' }
  | { type: 'game:reset' };

/**
 * Server -> Client events common to all games.
 * Game-specific broadcast events should be defined per-game and unioned
 * with this type: `BaseBroadcastEvent | MyGameBroadcastEvent`.
 */
export type BaseBroadcastEvent =
  | { type: 'room:sync'; phase: GamePhase; players: Player[]; scores: Record<string, number> }
  | { type: 'player:joined'; players: Player[] }
  | { type: 'player:left'; players: Player[] }
  | { type: 'scores:updated'; scores: Record<string, number> }
  | { type: 'phase:changed'; phase: GamePhase };
