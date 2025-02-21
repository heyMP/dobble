import { SignalWatcher } from '@lit-labs/preact-signals';
import { LitElement, PropertyValues, html, unsafeCSS } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import styles from './dobble-playing.css?raw';
import animationStyles from 'open-props/animations.shadow.min.css?raw';
import { PartyKitRoom } from '../PartyKitRoom.ts';

/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement('dobble-playing')
export class MyElement extends SignalWatcher(LitElement) {
  /**
   * The number of times the button has been clicked.
   */
  @state()
  roomId?: string;

  @property({ type: Number })
  symbols = 8;

  @property({ reflect: true, type: Boolean, attribute: 'wrong-selection' })
  wrongSelection = false;

  @property({ reflect: true })
  state: 'start' | 'playing' = "playing";

  private partyKitRoom?: PartyKitRoom;

  constructor() {
    super();
  }

  protected update(changedProperties: PropertyValues): void {
    if (changedProperties.has('roomId')) {
      console.log(this.roomId)
      if (!this.roomId) return;
      this.partyKitRoom = new PartyKitRoom(this.roomId);
      this.partyKitRoom.currentIndex.subscribe(() => {
        this.wrongSelection = false;
      });
    }
    super.update(changedProperties);
  }

  override render() {
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
      ${this.renderScore()}
      ${this.renderCards()}
    `;
  }

  renderScore() {
    return html`
      <div id="score">
        <ul>
          ${this.partyKitRoom?.users.value.map(user => html`
            <li>${user.name}: ${this.partyKitRoom?.score.value[user.clientId] ?? 0}</li>
          `)}
        </ul>
      </div>
    `;
  }

  renderCards() {
    return html`
      <div class="card-container" @click=${this._cardClicked}>
        ${this.partyKitRoom?.cards.value.map((card, index) => html`
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
    if (!this.partyKitRoom) { return; }
    this.partyKitRoom.currentIndex.value = 0;
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
    if (!this.partyKitRoom) { return; }
    this.partyKitRoom.match();
    this.wrongSelection = false;
  }

  /**
   * CONDITIONALS
   */
  _isActiveCard(cardIndex: number): boolean {
    const currentIndex = this.partyKitRoom?.currentIndex.value;
    if (currentIndex === undefined) {
      return false;
    }
    return cardIndex === currentIndex || cardIndex === currentIndex + 1;
  }

  _isPreviousCard(cardIndex: number): boolean {
    const currentIndex = this.partyKitRoom?.currentIndex.value;
    return cardIndex + 1 === currentIndex || cardIndex + 2 === currentIndex;
  }


  static override styles = [
    unsafeCSS(styles),
    unsafeCSS(animationStyles),
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'dobble-playing': MyElement
  }
}
