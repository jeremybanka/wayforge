import type { FC } from "react"

import { css } from "@emotion/react"

import { transaction } from "~/packages/atom.io/src"

import { Dividend, dividendState } from "./Dividend"
import { Divisor, divisorState } from "./Divisor"
import { Quotient } from "./Quotient"

export const resetEquation = transaction({
  key: `resetEquation`,
  do: ({ set }) => {
    set(dividendState, 1)
    set(divisorState, 2)
  },
})

export const App: FC = () => {
  return (
    <main
      css={css`
        display: flex;
        flex-flow: row;
      `}
    >
      <div>
        <Dividend />
        / <Divisor />
        = <Quotient />
        <div>
          <button onClick={resetEquation}>Reset</button>
        </div>
      </div>
    </main>
  )
}
