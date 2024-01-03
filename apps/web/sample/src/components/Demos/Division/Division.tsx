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

import scss from "./Division.module.scss"

export const Division: FC = () => {
	useSetTitle(`Division`)

	const resetEquation = runTransaction(resetEquationTX)

	return (
		<main className={scss.class}>
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
