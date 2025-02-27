import { Router } from '@lit-labs/router';
import { LitElement, PropertyValues, html, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { type Ref, createRef, ref } from 'lit/directives/ref.js';
import './dobble-playing.js';
import styles from './dobble-play.css?raw';
import sharedStyles from '../lib/shared-styles.js';
import { routes } from '../dobble-game.js';

const UNINITIALIZED = Symbol('uninitialized');

const SUBMIT_MAP = {
  JOIN_GAME: 'join-game',
  PLAY_SOLO: 'play-solo',
  HOST_GAME: 'host-game',
} as const;

type SubmitMapValue = typeof SUBMIT_MAP[keyof typeof SUBMIT_MAP];

/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement('dobble-play')
export class MyElement extends LitElement {
  @state()
  playType: 'solo' | 'host' | 'guest' | typeof UNINITIALIZED = UNINITIALIZED;

  @state()
  state: 'default' | 'name' = 'default';

  private _playTypeFormRef = createRef<HTMLFormElement>();

  private _playNameFormRef = createRef<HTMLFormElement>();

  protected update(changedProperties: PropertyValues): void {
    this._computeState();
    super.update(changedProperties);
  }

  private _computeState() {
    if (this.playType === UNINITIALIZED) {
      this.state = 'default';
      return;
    }
    this.state = 'name';
  }

  override render() {
    return html`
      <form class="u-card" ?hidden=${this.state !== 'default'} @submit=${this._onPlayType} ${ref(this._playTypeFormRef)}>
        <label for="room-id">Room code</label>
        <input id="room-id" name="room-id" type="text" placeholder="Room code" class="grid-col-full">

        <div class="spacer" class="grid-col-full"></div>

        <button id=${SUBMIT_MAP.JOIN_GAME} class="grid-col-full">Join a game</button>
        <button id=${SUBMIT_MAP.PLAY_SOLO}>Play solo</button>
        <button id=${SUBMIT_MAP.HOST_GAME}>Host game</button>
      </form>

      <form class="u-card" ?hidden=${this.state !== 'name'} @submit=${this._onPlay} ${ref(this._playNameFormRef)}>
        <label for="name">Name</label>
        <input id="name" name="name" type="text" placeholder="Name" class="grid-col-full" required>
        <button id="play-game" style="grid-column: 1 / -1">Play</button>
      </form>
    `;
  }

  private _onPlayType(e: SubmitEvent) {
    e.preventDefault();
    const id = e.submitter?.id as SubmitMapValue;

    if (!id) { return; }

    if (id === 'join-game') {
      this.playType = 'guest';
    }
    if (id === 'play-solo') {
      this.playType = 'solo';
    }
    if (id === 'host-game') {
      this.playType = 'host';
    }
  }

  private _onPlay(e: Event) {
    e.preventDefault();
    const playTypeFormData = this._getFormData(this._playTypeFormRef);
    const playNameFormData = this._getFormData(this._playNameFormRef);
    const name = playNameFormData?.get('name')

    if (!playTypeFormData || !playNameFormData) { return };

    if (name) {
      localStorage.setItem('dobble-name', name as string);
    }

    if (playTypeFormData.has('room-id')) {
      routes?.goto(`/play/${playTypeFormData.get('room-id')}}`);
      const link = routes?.link();
      if (!link) { return; }
      history.pushState(null, '', link)
    }
  }

  private _getFormData(ref: Ref<HTMLFormElement>): FormData | undefined {
    if (!ref.value) {
      return;
    }
    return new FormData(ref.value);
  }

  static override styles = [
    sharedStyles,
    unsafeCSS(styles),
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'dobble-play': MyElement
  }
}
