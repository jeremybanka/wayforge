import type { FC } from "react"

import { css } from "@emotion/react"

import { atom, runTransaction, transaction } from "~/packages/atom.io/src"
import { redo, undo } from "~/packages/atom.io/src/timeline"

import { Dividend } from "./Dividend"
import { Divisor } from "./Divisor"
import { Quotient } from "./Quotient"
import {
  dividendState,
  divisionTimeline,
  divisorState,
  resetEquation,
  useStore,
} from "./services"
import { StressTest } from "./StressTest"

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
            <button onClick={runTransaction(resetEquation)}>Reset</button>
            <button onClick={() => undo(divisionTimeline)}>Undo</button>
            <button onClick={() => redo(divisionTimeline)}>Redo</button>
          </div>
        </div>
      )}
      {demo === `stress_test` && <StressTest />}
    </main>
  )
}
