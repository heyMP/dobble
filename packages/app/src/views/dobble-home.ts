import { LitElement, html, unsafeCSS } from 'lit'
import { customElement } from 'lit/decorators.js'
import styles from './dobble-home.css?raw';
import animationStyles from 'open-props/animations.shadow.min.css?raw';

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
    unsafeCSS(styles),
    unsafeCSS(animationStyles),
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'dobble-home': MyElement
  }
}
