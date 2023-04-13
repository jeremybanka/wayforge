import type { FC } from "react"

import { css } from "@emotion/react"

import { atom } from "~/packages/atom.io/src"

import { useStore } from "./services"

export const dividendState = atom<number>({
  key: `dividend`,
  default: 1,
})

export const Dividend: FC = () => {
  const [dividend, setDividend] = useStore(dividendState)
  return (
    <div>
      <h1 data-testid="dividend">Dividend: {dividend}</h1>
      <button
        data-testid="dividendButton+"
        onClick={() => setDividend((dividend) => dividend + 1)}
        css={css`
          font-size: 2rem;
        `}
      >
        +
      </button>
      <button
        data-testid="dividendButton-"
        onClick={() => setDividend((dividend) => dividend - 1)}
        css={css`
          font-size: 2rem;
        `}
      >
        -
      </button>
    </div>
  )
}
