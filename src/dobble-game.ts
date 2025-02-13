import { LitElement, PropertyValueMap, css, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import stylesRaw from './dobble-game.css?raw';

const styles = new CSSStyleSheet();
styles.replaceSync(stylesRaw);

const SYMBOLS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
  "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥳",
  "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖",
  "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯",
  "😳", "🥵", "🥶", "😱", "😨", "😰", "😥"
];

console.log(SYMBOLS.length)

type Card = typeof SYMBOLS;

/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement('dobble-game')
export class MyElement extends LitElement {
  /**
   * The number of times the button has been clicked.
   */
  @property({ type: Number })
  symbols = 8;

  @state()
  cards: Card[] = [];

  @state()
  currentIndex?: number;

  @property({ reflect: true })
  state: 'start' | 'playing' = "start";

  constructor() {
    super();
    this._generate();
  }

  render() {
    if (this.state === 'start') {
      return this.renderStart();
    }
    if (this.state === 'playing') {
      return this.renderPlaying()
    }
  }

  renderStart() {
    return html`<button @click=${this._startGameAction}>Start Game</button>`;
  }

  renderPlaying() {
    return html`
      ${this._shuffle(this.cards).map((card, index) => html`
        <div class="card" data-card=${index} ?data-is-active=${this._isActiveCard(index)}>
          ${this._shuffle(card).map(symbol => html`<div class="symbol" data-symbol=${symbol}>${symbol}</div>`)}
        </div>
      `)}
    `
  }

  /**
   * ACTIONS
   */
  private _startGameAction(): void {
    this.state = 'playing';
    this.currentIndex = 0;
  }

  /**
   * CONDITIONALS
   */
  _isActiveCard(cardIndex: number): boolean {
    console.log(cardIndex, this.currentIndex)
    return cardIndex === this.currentIndex;
  }

  private _generate() {
    if (this.symbols < 2) throw new Error("Each card must have at least 2 symbols");

    const n = this.symbols - 1;
    const deck: Card[] = [];

    // Generate symbols (can be emojis, letters, etc.)
    const symbols = Array.from({ length: n * n + n + 1 }, (_, i) => SYMBOLS[i]);

    // Generate n cards each containing the first symbol and a unique set
    for (let i = 0; i < n; i++) {
      const card = [symbols[0]];
      for (let j = 0; j < n; j++) {
        card.push(symbols[1 + i * n + j]);
      }
      deck.push(card);
    }

    // Generate remaining cards
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const card = [symbols[1 + i]];
        for (let k = 0; k < n; k++) {
          card.push(symbols[1 + n + k * n + ((i * k + j) % n)]);
        }
        deck.push(card);
      }
    }

    this.cards = deck;
  }

  private _shuffle(array) {
    const org = [...array];
    org.sort(() => Math.random() - 0.5);
    return org;
  }

  static styles = styles;
}

declare global {
  interface HTMLElementTagNameMap {
    'my-element': MyElement
  }
}
