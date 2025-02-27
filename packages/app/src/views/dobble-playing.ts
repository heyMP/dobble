import { SignalWatcher } from '@lit-labs/preact-signals';
import { LitElement, PropertyValues, html, unsafeCSS } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import styles from './dobble-playing.css?raw';
import sharedStyles from '../lib/shared-styles.js';
import { PartyKitRoom } from '../PartyKitRoom.ts';

/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement('dobble-playing')
export class MyElement extends SignalWatcher(LitElement) {
  @state()
  roomId?: string;

  @state()
  name: string | null = window.localStorage.getItem('dobble-name');

  @property({ type: Number })
  symbols = 8;

  @property({ reflect: true, type: Boolean, attribute: 'wrong-selection' })
  wrongSelection = false;

  @property({ reflect: true })
  state: 'loading' | 'start' | 'playing' = "loading";

  private partyKitRoom?: PartyKitRoom;

  constructor() {
    super();
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    const name = new URLSearchParams(window.location.href).get('name');
    if (name) {
      this.name = name;
    }
  }

  protected update(changedProperties: PropertyValues): void {
    if (changedProperties.has('roomId')) {
      if (!this.roomId || !this.name) return;
      this.partyKitRoom = new PartyKitRoom(this.roomId, this.name);
      this.partyKitRoom.currentIndex.subscribe(() => {
        this.wrongSelection = false;
      });
      this.partyKitRoom.state.subscribe((state) => {
        this.state = state;
      });
    }
    super.update(changedProperties);
  }

  override render() {
    if (this.state === 'playing') {
      return this.renderPlaying()
    }
    return this.renderStart();
  }

  renderStart() {
    const disabled = this.state === 'loading';
    return html`
      <button id="start-game-cta" @click=${this._startGameAction} ?disabled=${disabled}>Start Game</button>
    `;
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
            ${card.map(symbol => html`<button class="u-clean symbol" data-symbol=${symbol}>${symbol}</button>`)}
          </div>
        `)}
      </div>
    `;
  }

  /**
   * ACTIONS
   */
  private _startGameAction(): void {
    if (!this.partyKitRoom) { return; }
    this.partyKitRoom.startGame();
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
    sharedStyles,
    unsafeCSS(styles),
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'dobble-playing': MyElement
  }
}
