import type { FC } from "react"

import { css } from "@emotion/react"

import { selector, transaction } from "~/packages/atom.io/src"

import { Dividend, dividendState } from "./Dividend"
import { Divisor, divisorState } from "./Divisor"
import { Quotient } from "./Quotient"
import { useStore } from "./services"

export const resetEquation = transaction({
  key: `resetEquation`,
  do: ({ set }) => {
    set(divisorState, 0)
    set(dividendState, 0)
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
        <Dividend /> /
        <Divisor />
        = <Quotient />
        {/* <button
          onClick={() => setCount((count) => count + 1)}
          css={css`
            font-size: 2rem;
          `}
        >
          +
        </button>
        <button
          onClick={() => setCount((count) => count - 1)}
          css={css`
            font-size: 2rem;
          `}
        >
          -
        </button> */}
      </div>
    </main>
  )
}
