import type { FC } from "react"

import { quotientState, useIO } from "../../../services/store"

export const Quotient: FC = () => {
  const [quotient, setQuotient] = useIO(quotientState)
  return (
    <div>
      <h1 data-testid="quotient">{quotient}</h1>
      <div>
        <button
          data-testid="quotientButton+"
          onClick={() => setQuotient((q) => q + 1)}
        >
          +
        </button>
        <button
          data-testid="quotientButton-"
          onClick={() => setQuotient((q) => q - 1)}
        >
          -
        </button>
      </div>
    </div>
  )
}
