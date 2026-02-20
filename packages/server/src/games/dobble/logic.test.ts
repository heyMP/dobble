import { describe, it, expect } from 'vitest';
import { generateDeck } from './logic';
import { SYMBOLS_PER_CARD } from 'shared/games/dobble/types.ts';

const n = SYMBOLS_PER_CARD - 1; // projective plane order
const expectedCardCount = n * n + n; // 56 (full plane is n²+n+1 but the implementation omits one card)

describe('generateDeck', () => {
  const deck = generateDeck();

  it(`generates ${expectedCardCount} cards`, () => {
    expect(deck).toHaveLength(expectedCardCount);
  });

  it(`each card has exactly ${SYMBOLS_PER_CARD} symbols`, () => {
    for (const card of deck) {
      expect(card).toHaveLength(SYMBOLS_PER_CARD);
    }
  });

  it('no card contains duplicate symbols', () => {
    for (const card of deck) {
      const unique = new Set(card);
      expect(unique.size).toBe(card.length);
    }
  });

  it('every pair of cards shares exactly 1 symbol', () => {
    for (let i = 0; i < deck.length; i++) {
      for (let j = i + 1; j < deck.length; j++) {
        const shared = deck[i].filter(s => deck[j].includes(s));
        expect(
          shared.length,
          `cards ${i} and ${j} share ${shared.length} symbols instead of 1`,
        ).toBe(1);
      }
    }
  });
});
