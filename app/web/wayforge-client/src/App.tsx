import type { FC } from "react"

import { css } from "@emotion/react"

import { Explorer } from "./Explorer"
import { Spaces } from "./NavigationSpace"

export const App: FC = () => {
  return (
    <main
      css={css`
        display: flex;
        flex-flow: row;
      `}
    >
      <Explorer />
      <Spaces />
    </main>
  )
}
