import { LitElement, html, unsafeCSS } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import styles from './dobble-game.css?raw';
import animationStyles from 'open-props/animations.shadow.min.css?raw';

const SYMBOLS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
  "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥳",
  "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖",
  "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯",
  "😳", "🥵", "🥶", "😱", "😨", "😰", "😥"
];

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
  currentIndex = 0;

  @property({ reflect: true, type: Boolean, attribute: 'wrong-selection' })
  wrongSelection = false;

  @property({ reflect: true })
  state: 'start' | 'playing' = "playing";

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
      <div class="card-container" @click=${this._cardClicked}>
        ${this.cards.map((card, index) => html`
          <div class="card" data-card=${index} ?data-is-active=${this._isActiveCard(index)} ?data-is-previous=${this._isPreviousCard(index)}>
            ${card.map(symbol => html`<button class="symbol" data-symbol=${symbol}>${symbol}</button>`)}
          </div>
        `)}
      </div>
    `;
  }

  /**
   * ACTIONS
   */
  private _startGameAction(): void {
    this.state = 'playing';
    this.currentIndex = 0;
  }

  private _cardClicked(e: Event): void {
    if (this.wrongSelection) return;

    const target = e.composedPath()[0] as HTMLElement;
    if (!target) return;
    if (!target.classList.contains('symbol')) return;

    const symbol = target.dataset.symbol;
    const matches = [...this.shadowRoot?.querySelectorAll(`[data-is-active] [data-symbol=${symbol}]`) ?? []].length;
    if (matches === 2) {
      this._matchSelected();
    }
    else {
      this.wrongSelection = true;
      target.classList.add('wrong');
    }
  }

  private _matchSelected(): void {
    this.currentIndex = this.currentIndex + 2;
    this.wrongSelection = false;
  }

  /**
   * CONDITIONALS
   */
  _isActiveCard(cardIndex: number): boolean {
    return cardIndex === this.currentIndex || cardIndex === this.currentIndex + 1;
  }

  _isPreviousCard(cardIndex: number): boolean {
    return cardIndex + 1 === this.currentIndex || cardIndex + 2 === this.currentIndex;
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
        this._shuffle(card);
      }
      deck.push(card);
    }

    // Generate remaining cards
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const card = [symbols[1 + i]];
        for (let k = 0; k < n; k++) {
          card.push(symbols[1 + n + k * n + ((i * k + j) % n)]);
          this._shuffle(card);
        }
        deck.push(card);
      }
    }

    this._shuffle(deck);

    this.cards = deck;
  }

  private _shuffle(arry: any[]): void {
    arry.sort(() => Math.random() - 0.5);
  }

  static styles = [
    unsafeCSS(styles),
    unsafeCSS(animationStyles),
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'my-element': MyElement
  }
}
