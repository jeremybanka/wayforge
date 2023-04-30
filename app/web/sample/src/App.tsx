import type { FC } from "react"

import { css } from "@emotion/react"

import { defaultStyles } from "./components/atom.io-devtools/default-styles"
import { DevTools } from "./components/atom.io-devtools/DevTools"
import { Demos } from "./components/Demos"

export const App: FC = () => {
  return (
    <main
      css={css`
        display: flex;
        flex-flow: column;
      `}
    >
      <Demos />
      <DevTools customCss={defaultStyles} />
    </main>
  )
}
