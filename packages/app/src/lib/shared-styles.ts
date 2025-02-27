import { css, unsafeCSS } from 'lit';
import openpropsShadow from "open-props/open-props.shadow.min.css?raw";
import buttonStyles from "open-props/buttons.light.min.css?raw";
import grayhsl from "open-props/gray-hsl.shadow.min.css?raw";

export default css`
  ${unsafeCSS(openpropsShadow)}
  ${unsafeCSS(buttonStyles)}
  ${unsafeCSS(grayhsl)}

  button {
    cursor: pointer;
  }

  button:where(.u-clean) {
    border: none;
    box-shadow: none;
  }

  .u-card {
    padding: 3rem;
    background: white;
    box-shadow: var(--shadow-3);
    border-radius: var(--radius-conditional-3);
  }
`;
