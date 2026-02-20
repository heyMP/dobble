import { SYMBOLS_PER_CARD, SYMBOLS } from 'shared/games/dobble/types.ts';
import type { Card } from 'shared/games/dobble/types.ts';

export function generateDeck(): Card[] {
  if (SYMBOLS_PER_CARD < 2) throw new Error("Each card must have at least 2 symbols");

  const n = SYMBOLS_PER_CARD - 1;
  const deck: Card[] = [];

  const symbols = Array.from({ length: n * n + n + 1 }, (_, i) => SYMBOLS[i]);

  for (let i = 0; i < n; i++) {
    const card = [symbols[0]];
    for (let j = 0; j < n; j++) {
      card.push(symbols[1 + i * n + j]);
      shuffle(card);
    }
    deck.push(card);
  }

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const card = [symbols[1 + i]];
      for (let k = 0; k < n; k++) {
        card.push(symbols[1 + n + k * n + ((i * k + j) % n)]);
        shuffle(card);
      }
      deck.push(card);
    }
  }

  shuffle(deck);

  return deck;
}

function shuffle(arr: unknown[]): void {
  arr.sort(() => Math.random() - 0.5);
}
