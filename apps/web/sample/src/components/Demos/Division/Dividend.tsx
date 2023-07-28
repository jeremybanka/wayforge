import { useIO } from "atom.io/react"
import type { FC } from "react"

import { dividendState } from "../../../services/store"

export const Dividend: FC = () => {
	const [dividend, setDividend] = useIO(dividendState)
	return (
		<div>
			<h1 data-testid="dividend">{dividend}</h1>
			<div>
				<button
					type="button"
					data-testid="dividendButton+"
					onClick={() => setDividend((dividend) => dividend + 1)}
				>
					+
				</button>
				<button
					type="button"
					data-testid="dividendButton-"
					onClick={() => setDividend((dividend) => dividend - 1)}
				>
					-
				</button>
			</div>
		</div>
	)
}
