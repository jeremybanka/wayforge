import { css } from "@emotion/react"
import type { FC } from "react"

import { redo, runTransaction, undo } from "~/packages/atom.io/src"

import {
	divisionTimeline,
	resetEquationTX,
	useSetTitle,
} from "../../../services/app-store"
import { Dividend } from "./Dividend"
import { Divisor } from "./Divisor"
import { Quotient } from "./Quotient"

export const Division: FC = () => {
	useSetTitle(`Division`)

	const resetEquation = runTransaction(resetEquationTX)

	return (
		<main
			css={css`
        display: flex;
        flex-flow: column;
        button {
          background: blue;
          border: none;
          color: white;
          font-family: theia;
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
				<button type="button" onClick={() => resetEquation()}>
					Reset
				</button>
				<button type="button" onClick={() => undo(divisionTimeline)}>
					Undo
				</button>
				<button type="button" onClick={() => redo(divisionTimeline)}>
					Redo
				</button>
			</footer>
		</main>
	)
}
