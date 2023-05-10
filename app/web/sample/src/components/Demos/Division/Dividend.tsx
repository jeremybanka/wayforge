import type { FC } from "react"

import { css } from "@emotion/react"

import { dividendState, useStore } from "../../../services/store"

export const Dividend: FC = () => {
  const [dividend, setDividend] = useStore(dividendState)
  return (
    <div>
      <h1 data-testid="dividend">{dividend}</h1>
      <div>
        <button
          data-testid="dividendButton+"
          onClick={() => setDividend((dividend) => dividend + 1)}
        >
          +
        </button>
        <button
          data-testid="dividendButton-"
          onClick={() => setDividend((dividend) => dividend - 1)}
        >
          -
        </button>
      </div>
    </div>
  )
}
