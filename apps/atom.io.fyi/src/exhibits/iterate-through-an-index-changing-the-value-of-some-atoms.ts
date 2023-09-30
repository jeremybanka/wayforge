import { atom, atomFamily, selectorFamily, transaction } from "atom.io"

export const nowState = atom({
	key: `now`,
	default: Date.now(),
	effects: [
		({ setSelf }) => {
			const interval = setInterval(() => {
				setSelf(Date.now())
			}, 1000)
			return () => clearInterval(interval)
		},
	],
})

export const timerIndex = atom<string[]>({
	key: `timerIndex`,
	default: [],
})

export const findTimerStartedState = atomFamily<number, string>({
	key: `timerStarted`,
	default: 0,
})
export const findTimerLengthState = atomFamily<number, string>({
	key: `timerLength`,
	default: 60_000,
})
const findTimerRemainingState = selectorFamily<number, string>({
	key: `timerRemaining`,
	get: (id) => ({ get }) => {
		const now = get(nowState)
		const started = get(findTimerStartedState(id))
		const length = get(findTimerLengthState(id))
		return Math.max(0, length - (now - started))
	},
})

export const addOneMinuteToAllRunningTimersTX = transaction({
	key: `addOneMinuteToAllRunningTimers`,
	do: ({ get, set }) => {
		const timerIds = get(timerIndex)
		for (const timerId of timerIds) {
			if (get(findTimerRemainingState(timerId)) > 0) {
				set(findTimerLengthState(timerId), (current) => current + 60_000)
			}
		}
	},
})
