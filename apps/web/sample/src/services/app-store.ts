import { atom, selector, timeline, transaction } from "atom.io"
import { IMPLICIT } from "atom.io/internal"
import { composeExplorer } from "~/packages/atom.io/__unstable__/react-explorer/src"

export const { Explorer, useSetTitle } = composeExplorer({
	key: `🤓`,
})

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[1]

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
