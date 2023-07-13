import type { FC } from "react"

import { divisorState, useIO } from "../../../services/store"

export const Divisor: FC = () => {
	const [divisor, setDivisor] = useIO(divisorState)
	return (
		<div>
			<h1 data-testid="divisor">{divisor}</h1>
			<div>
				<button
					type="button"
					data-testid="divisorButton+"
					onClick={() => setDivisor((divisor) => divisor + 1)}
				>
					+
				</button>
				<button
					type="button"
					data-testid="divisorButton-"
					onClick={() => setDivisor((divisor) => divisor - 1)}
				>
					-
				</button>
			</div>
		</div>
	)
}
