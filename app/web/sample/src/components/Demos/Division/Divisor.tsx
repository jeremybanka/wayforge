import type { FC } from "react"

import { css } from "@emotion/react"

import { divisorState, useStore } from "../../../services/store"

export const Divisor: FC = () => {
  const [divisor, setDivisor] = useStore(divisorState)
  return (
    <div>
      <h1 data-testid="divisor">{divisor}</h1>
      <div>
        <button
          data-testid="divisorButton+"
          onClick={() => setDivisor((divisor) => divisor + 1)}
        >
          +
        </button>
        <button
          data-testid="divisorButton-"
          onClick={() => setDivisor((divisor) => divisor - 1)}
        >
          -
        </button>
      </div>
    </div>
  )
}
