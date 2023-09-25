import { atom, selector, setLogLevel, timeline, transaction } from "atom.io"
import { composeExplorer } from "atom.io/react-explorer"

export const { Explorer, useSetTitle } = composeExplorer({
	key: `🤓`,
})

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
setLogLevel(LOG_LEVELS[1])

export const dividendState = atom<number>({
	key: `dividend`,
	default: 1,
})

export const divisorState = atom<number>({
	key: `divisor`,
	default: 2,
})

export const quotientState = selector<number>({
	key: `quotient`,
	get: ({ get }) => {
		const divisor = get(divisorState)
		const dividend = get(dividendState)
		return dividend / divisor
	},
	set: ({ get, set }, newValue) => {
		const divisor = get(divisorState)
		set(dividendState, newValue * divisor)
	},
})

export const resetEquationTX = transaction<() => void>({
	key: `resetEquation`,
	do: ({ set }) => {
		set(dividendState, 1)
		set(divisorState, 2)
	},
})

export const divisionTimeline = timeline({
	key: `division`,
	atoms: [dividendState, divisorState],
})
