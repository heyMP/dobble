import { LitElement, html, unsafeCSS } from 'lit'
import { customElement } from 'lit/decorators.js'
import styles from './dobble-home.css?raw';
import sharedStyles from '../lib/shared-styles.js';

/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement('dobble-home')
export class MyElement extends LitElement {
  render() {
    return html`
      <h1>Welcome</h1>
    `;
  }

  static styles = [
    sharedStyles,
    unsafeCSS(styles),
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'dobble-home': MyElement
  }
}
