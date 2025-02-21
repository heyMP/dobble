import { Router } from '@lit-labs/router';
import { LitElement, html, unsafeCSS } from 'lit'
import { customElement } from 'lit/decorators.js'
import styles from './dobble-game.css?raw';
// @ts-ignore
import "open-props/open-props.min.css?css";
import './views/dobble-home.ts';
import './views/dobble-playing.ts';

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
    { path: '/play/:roomId', render: ({roomId}) => html`<dobble-playing .roomId=${roomId}></dobble-playing>`}
  ])

  override render() {
    return html`
      ${this._routes.outlet()}
    `;
  }

  static override styles = unsafeCSS(styles);
}

declare global {
  interface HTMLElementTagNameMap {
    'dobble-game': MyElement
  }
}
