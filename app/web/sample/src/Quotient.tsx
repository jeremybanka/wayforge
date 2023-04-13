import type { FC } from "react"

import { css } from "@emotion/react"

import { selector } from "~/packages/atom.io/src"

import { dividendState } from "./Dividend"
import { divisorState } from "./Divisor"
import { useStore } from "./services"

export const quotientState = selector<number>({
  key: `quotient`,
  get: ({ get }) => {
    const divisor = get(divisorState)
    const dividend = get(dividendState)
    return dividend / divisor
  },
  set: ({ get, set }, newValue) => {
    const divisor = get(divisorState)
    set(dividendState, newValue * divisor)
  },
})
export const Quotient: FC = () => {
  // const quotient = useStore(quotientState)
  const [quotient, setQuotient] = useStore(quotientState)
  return (
    <div>
      <h1 data-testid="quotient">Quotient: {quotient}</h1>
      <button
        data-testid="quotientButton+"
        onClick={() => setQuotient((q) => q + 1)}
        css={css`
          font-size: 2rem;
        `}
      >
        +
      </button>
      <button
        data-testid="quotientButton-"
        onClick={() => setQuotient((q) => q - 1)}
        css={css`
          font-size: 2rem;
        `}
      >
        -
      </button>
    </div>
  )
}
