import type { ComponentType } from 'react';
import type { GameDefinition } from 'shared';
import { DobbleGame } from './dobble/DobbleGame';
import { dobbleDefinition } from 'shared/games/dobble/types';

export interface GameRegistryEntry {
  component: ComponentType<{ roomId: string; playerName: string }>;
  definition: GameDefinition;
}

export const gameRegistry: Record<string, GameRegistryEntry> = {
  dobble: { component: DobbleGame, definition: dobbleDefinition },
};

export type GameId = keyof typeof gameRegistry;
