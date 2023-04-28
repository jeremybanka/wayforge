import type { FC } from "react"
import { Fragment } from "react"

import { css } from "@emotion/react"

import { recordToEntries } from "~/packages/anvl/src/object"
import { atom, runTransaction } from "~/packages/atom.io/src"
import { attachMetaState } from "~/packages/atom.io/src/internal/meta-state"
import { redo, undo } from "~/packages/atom.io/src/timeline"

import { Dividend } from "./Dividend"
import { Divisor } from "./Divisor"
import { DraggableResizableModal } from "./DraggableResizableModal"
import { Quotient } from "./Quotient"
import { divisionTimeline, resetEquation, useStore } from "./services"
import { StateEditor } from "./StateEditor"
import { StressTest } from "./StressTest"

const DEMOS = [`stress_test`, `basic_arithmetic`] as const
type Demo = (typeof DEMOS)[number]

const demoAtom = atom<Demo>({
  key: `demo`,
  default: DEMOS[1],
})

const { atomTokenIndexState } = attachMetaState()

export const App: FC = () => {
  const [demo, setDemo] = useStore(demoAtom)
  const atomTokenIndex = useStore(atomTokenIndexState)
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
      <div
        css={css`
          margin-top: 100px;
        `}
      >
        Atoms
        {Object.entries(atomTokenIndex).map(([key, token]) => (
          <Fragment key={key}>
            {key.startsWith(`👁️‍🗨️_`) ? null : (
              <div
                css={css`
                  border: 1px solid var(--fg-color);
                  padding: 5px;
                  margin: 5px;
                `}
              >
                {key}:
                {`type` in token ? (
                  <StateEditor token={token} />
                ) : (
                  <>
                    {recordToEntries(token.atoms).map(([key, token]) => (
                      <div
                        key={key}
                        css={css`
                          display: flex;
                          flex-flow: row;
                          align-items: center;
                        `}
                      >
                        {key}:<StateEditor token={token} />
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </Fragment>
        ))}
      </div>
      {/* <DraggableResizableModal /> */}
    </main>
  )
}
