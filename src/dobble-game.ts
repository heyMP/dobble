import { Router } from '@lit-labs/router';
import { LitElement, html, unsafeCSS } from 'lit'
import { customElement } from 'lit/decorators.js'
import styles from './dobble-game.css?raw';
import './views/dobble-home.js';
import './views/dobble-playing.js';

/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement('dobble-game')
export class MyElement extends LitElement {
  private _routes = new Router(this, [
    { path: '/', render: () => html`<dobble-home></dobble-home>`},
    { path: '/play', render: () => html`<dobble-playing></dobble-playing>`}
  ])

  render() {
    return html`${this._routes.outlet()}`;
  }

  static styles = unsafeCSS(styles);
}

declare global {
  interface HTMLElementTagNameMap {
    'dobble-game': MyElement
  }
}
