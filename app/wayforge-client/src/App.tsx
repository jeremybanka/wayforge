import type { FC } from "react"

import { css } from "@emotion/react"

import { Spaces } from "./NavigationSpace"

export const Header: FC = () => (
  <i
    css={css`
      font-size: 200px;
    `}
  >
    w
  </i>
)

export const App: FC = () => {
  return (
    <div className="App">
      <Spaces />
    </div>
  )
}
