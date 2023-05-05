import type { FC } from "react"

import { css } from "@emotion/react"

import { DemoExplorer } from "./components/Demos"
import { Devtools } from "./services/store"

export const App: FC = () => {
  return (
    <main
      css={css`
        display: flex;
        flex-flow: column;
      `}
    >
      <DemoExplorer />
      <Devtools />
    </main>
  )
}
