import { css } from "@emotion/react"

export const defaultStyles = css`
  --fg-color: #eee;
  --bg-color: #111;
  @media (prefers-color-scheme: light) {
    --fg-color: #444;
    --bg-color: #ddd;
  }
  box-sizing: border-box;
  color: var(--fg-color);
  background-color: var(--bg-color);
  border: 2px solid var(--fg-color);
  position: absolute;
  right: 0;
  bottom: 0;
  height: 100%;
  max-height: 800px;
  width: 100%;
  max-width: 460px;
  overflow-y: scroll;
  padding: 5px;
  section {
    margin-top: 30px;
    h1 {
      font-size: inherit;
      margin: 0;
    }
    .node {
      border: 1px solid var(--fg-color);
      padding: 5px;
      margin: 5px;
      overflow-x: scroll;
    }
  }
`
