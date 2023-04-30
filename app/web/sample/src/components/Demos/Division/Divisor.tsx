import type { FC } from "react"

import { css } from "@emotion/react"

import { divisorState, useStore } from "../../../services"

export const Divisor: FC = () => {
  const [divisor, setDivisor] = useStore(divisorState)
  return (
    <div>
      <h1 data-testid="divisor">Divisor: {divisor}</h1>
      <button
        data-testid="divisorButton+"
        onClick={() => setDivisor((divisor) => divisor + 1)}
        css={css`
          font-size: 2rem;
        `}
      >
        +
      </button>
      <button
        data-testid="divisorButton-"
        onClick={() => setDivisor((divisor) => divisor - 1)}
        css={css`
          font-size: 2rem;
        `}
      >
        -
      </button>
    </div>
  )
}
