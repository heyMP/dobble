import { Router } from '@lit-labs/router';
import { LitElement, PropertyValues, html, unsafeCSS } from 'lit'
import { customElement } from 'lit/decorators.js'
import "urlpattern-polyfill";
import styles from './dobble-game.css?raw';
// @ts-ignore
import "open-props/open-props.min.css?css";
import './views/dobble-home.ts';
import './views/dobble-play.ts';
import './views/dobble-playing.ts';

export let routes: DobbleGame['routes'] | undefined = undefined;

/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement('dobble-game')
export class DobbleGame extends LitElement {
  routes = new Router(this, [
    { path: '/', render: () => html`<dobble-home></dobble-home>`},
    { path: '/play', render: () => html`<dobble-play></dobble-play>`},
    { path: '/play/:roomId', render: ({roomId}) => html`<dobble-playing .roomId=${roomId}></dobble-playing>`}
  ]);

  constructor() {
    super();
    routes = this.routes;
  }

  override render() {
    return html`
      <div id="wrapper">
        ${this.routes.outlet()}
      </div>
    `;
  }

  static override styles = unsafeCSS(styles);
}


declare global {
  interface HTMLElementTagNameMap {
    'dobble-game': DobbleGame
  }
}
