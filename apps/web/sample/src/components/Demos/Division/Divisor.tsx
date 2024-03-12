import { useI, useO } from "atom.io/react"
import type { FC } from "react"

import { divisorState } from "../../../services/app-store"

export const Divisor: FC = () => {
	const setDivisor = useI(divisorState)
	const divisor = useO(divisorState)
	return (
		<div>
			<h1 data-testid="divisor">{divisor}</h1>
			<div>
				<button
					type="button"
					data-testid="divisorButton+"
					onClick={() => {
						setDivisor((prevDivisor) => prevDivisor + 1)
					}}
				>
					+
				</button>
				<button
					type="button"
					data-testid="divisorButton-"
					onClick={() => {
						setDivisor((prevDivisor) => prevDivisor - 1)
					}}
				>
					-
				</button>
			</div>
		</div>
	)
}
