import type { FC } from "react"

import { css } from "@emotion/react"

import { quotientState, useStore } from "../../../services"

export const Quotient: FC = () => {
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
