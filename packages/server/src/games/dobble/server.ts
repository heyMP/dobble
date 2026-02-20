import type * as Party from "partykit/server";
import { BaseGameServer } from '../../base-game-server';
import type {
  DobbleGameState,
  DobbleClientEvent,
  DobbleBroadcastEvent,
} from 'shared/games/dobble/types.ts';
import { generateDeck } from './logic';

export default class DobbleServer extends BaseGameServer<
  DobbleGameState,
  DobbleClientEvent,
  DobbleBroadcastEvent
> {
  createInitialState(): DobbleGameState {
    return { cards: generateDeck(), currentIndex: 0 };
  }

  handleGameEvent(event: DobbleClientEvent, sender: Party.Connection): void {
    if (event.type === 'dobble:match') {
      this.updateScore(event.clientId, 1);
      this.gameState.currentIndex += 2;

      this.broadcastToAll({
        type: 'dobble:matched',
        currentIndex: this.gameState.currentIndex,
      });

      const cardsRemaining = this.gameState.cards.length - this.gameState.currentIndex;
      if (cardsRemaining < 2) {
        this.endGame();
      }
    }
  }

  getGameStateForClient(): DobbleBroadcastEvent[] {
    if (!this.gameState) return [];

    return [{
      type: 'dobble:cards',
      cards: this.gameState.cards,
      currentIndex: this.gameState.currentIndex,
    }];
  }
}

DobbleServer satisfies Party.Worker;
