import { useI, useO } from "atom.io/react"
import type { FC } from "react"

import { dividendState } from "../../../services/app-store"

export const Dividend: FC = () => {
	const setDividend = useI(dividendState)
	const dividend = useO(dividendState)
	return (
		<div>
			<h1 data-testid="dividend">{dividend}</h1>
			<div>
				<button
					type="button"
					data-testid="dividendButton+"
					onClick={() => {
						setDividend((prevDividend) => prevDividend + 1)
					}}
				>
					+
				</button>
				<button
					type="button"
					data-testid="dividendButton-"
					onClick={() => {
						setDividend((prevDividend) => prevDividend - 1)
					}}
				>
					-
				</button>
			</div>
		</div>
	)
}
