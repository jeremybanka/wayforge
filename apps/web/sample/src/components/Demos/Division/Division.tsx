import type { FC } from "react"

import { css } from "@emotion/react"

import { redo, runTransaction, undo } from "~/packages/atom.io/src"

import { Dividend } from "./Dividend"
import { Divisor } from "./Divisor"
import { Quotient } from "./Quotient"
import {
  divisionTimeline,
  resetEquation,
  useSetTitle,
} from "../../../services/store"

export const Division: FC = () => {
  useSetTitle(`Division`)

  return (
    <main
      css={css`
        display: flex;
        flex-flow: column;
        button {
          background: blue;
          border: none;
        }
        main {
          padding: 5px;
          display: flex;
          flex-flow: row;
          justify-content: center;
          h1 {
            margin: 0;
            font-size: 40px;
          }

          > span,
          > i {
            font-style: normal;
            display: flex;
            flex-flow: column;
            justify-content: center;
            gap: 5px;
            button {
              font-family: icon;
              padding: 2px;
              width: 20px;
              color: var(--bg-color);
            }
          }
          > span {
            width: 200px;
            div > div {
              display: flex;
              justify-content: center;
              gap: 2px;
            }
          }
          > i {
            font-family: icon;
            font-size: 40px;
          }
        }
        /* * > * > * {
          border: 1px solid blue;
        } */
        footer {
          display: flex;
          justify-content: center;
          gap: 2px;
        }
      `}
    >
      <main>
        <span>
          <Dividend />
          <Divisor />
        </span>
        <i>=</i>
        <span>
          <Quotient />
        </span>
      </main>
      <footer>
        <button onClick={runTransaction(resetEquation)}>Reset</button>
        <button onClick={() => undo(divisionTimeline)}>Undo</button>
        <button onClick={() => redo(divisionTimeline)}>Redo</button>
      </footer>
    </main>
  )
}
