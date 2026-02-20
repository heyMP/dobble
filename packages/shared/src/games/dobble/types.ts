import type { GameDefinition } from '../../game-definition.js';

export const SYMBOLS_PER_CARD = 8;

export const SYMBOLS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
  "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥳",
  "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖",
  "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯",
  "😳", "🥵", "🥶", "😱", "😨", "😰", "😥"
] as const;

export type Symbol = (typeof SYMBOLS)[number];

export type Card = Symbol[];

export interface DobbleGameState {
  cards: Card[];
  currentIndex: number;
}

/** Client -> Server events specific to Dobble */
export type DobbleClientEvent =
  | { type: 'dobble:match'; clientId: string };

/** Server -> Client events specific to Dobble */
export type DobbleBroadcastEvent =
  | { type: 'dobble:cards'; cards: Card[]; currentIndex: number }
  | { type: 'dobble:matched'; currentIndex: number };

export const dobbleDefinition: GameDefinition = {
  id: 'dobble',
  name: 'Dobble',
  description: 'Find the matching symbol between two cards before your opponents!',
  minPlayers: 2,
  maxPlayers: 8,
};
