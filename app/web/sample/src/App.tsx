import type { FC } from "react"

import { css } from "@emotion/react"

// import { DemoExplorer } from "./components/Demos"
// import { Devtools } from "./services/store"

export const App: FC = () => {
  return (
    <main
      css={css`
        display: flex;
        flex-flow: column;
        justify-content: center;
        h1 {
          text-align: center;
        }
      `}
    >
      <h1>atom.io</h1>
      {/* <DemoExplorer /> */}
      {/* <Devtools /> */}
    </main>
  )
}
