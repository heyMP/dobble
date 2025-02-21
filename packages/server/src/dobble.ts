export const SYMBOLS_PER_CARD = 8;

export const SYMBOLS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
  "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥳",
  "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖",
  "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯",
  "😳", "🥵", "🥶", "😱", "😨", "😰", "😥"
];

export type Card = typeof SYMBOLS;

export function generate() {
  if (SYMBOLS_PER_CARD < 2) throw new Error("Each card must have at least 2 symbols");

  const n = SYMBOLS_PER_CARD - 1;
  const deck: Card[] = [];

  // Generate symbols (can be emojis, letters, etc.)
  const symbols = Array.from({ length: n * n + n + 1 }, (_, i) => SYMBOLS[i]);

  // Generate n cards each containing the first symbol and a unique set
  for (let i = 0; i < n; i++) {
    const card = [symbols[0]];
    for (let j = 0; j < n; j++) {
      card.push(symbols[1 + i * n + j]);
      shuffle(card);
    }
    deck.push(card);
  }

  // Generate remaining cards
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

  return deck
}

function shuffle(arry: any[]): void {
  arry.sort(() => Math.random() - 0.5);
}
