import type { FC } from "react"

import { css } from "@emotion/react"

import { atom, transaction } from "~/packages/atom.io/src"

import { Dividend, dividendState } from "./Dividend"
import { Divisor, divisorState } from "./Divisor"
import { Quotient } from "./Quotient"
import { useStore } from "./services"
import { StressTest } from "./StressTest"

export const resetEquation = transaction({
  key: `resetEquation`,
  do: ({ set }) => {
    set(dividendState, 1)
    set(divisorState, 2)
  },
})

const DEMOS = [`stress_test`, `basic_arithmetic`] as const
type Demo = (typeof DEMOS)[number]

const demoAtom = atom<Demo>({
  key: `demo`,
  default: DEMOS[1],
})

export const App: FC = () => {
  const [demo, setDemo] = useStore(demoAtom)
  return (
    <main
      css={css`
        display: flex;
        flex-flow: column;
      `}
    >
      <select value={demo} onChange={(e) => setDemo(e.target.value as Demo)}>
        {DEMOS.map((demo) => (
          <option key={demo} value={demo}>
            {demo}
          </option>
        ))}
      </select>
      {demo === `basic_arithmetic` && (
        <div>
          <Dividend />
          / <Divisor />
          = <Quotient />
          <div>
            <button onClick={resetEquation}>Reset</button>
          </div>
        </div>
      )}
      {demo === `stress_test` && <StressTest />}
    </main>
  )
}
