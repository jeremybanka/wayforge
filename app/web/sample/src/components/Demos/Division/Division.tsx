import type { FC } from "react"

import { redo, runTransaction, undo } from "~/packages/atom.io/src"

import { Dividend } from "./Dividend"
import { Divisor } from "./Divisor"
import { Quotient } from "./Quotient"
import { divisionTimeline, resetEquation } from "../../../services"

export const Division: FC = () => (
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
)
