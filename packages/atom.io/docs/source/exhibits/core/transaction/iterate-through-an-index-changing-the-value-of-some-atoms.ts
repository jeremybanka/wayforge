import { atom, atomFamily, selectorFamily, transaction } from "atom.io"

export const nowAtom = atom<number>({
	key: `now`,
	default: Date.now(),
	effects: [
		({ setSelf }) => {
			const interval = setInterval(() => {
				setSelf(Date.now())
			}, 1000)
			return () => {
				clearInterval(interval)
			}
		},
	],
})

export const timerKeysAtom = atom<string[]>({
	key: `timerKeys`,
	default: [],
})

export const timerStartedAtoms = atomFamily<number, string>({
	key: `timerStarted`,
	default: 0,
})
export const timerLengthAtoms = atomFamily<number, string>({
	key: `timerLength`,
	default: 60_000,
})
const timerRemainingSelectors = selectorFamily<number, string>({
	key: `timerRemaining`,
	get:
		(id) =>
		({ get }) => {
			const now = get(nowAtom)
			const started = get(timerStartedAtoms, id)
			const length = get(timerLengthAtoms, id)
			return Math.max(0, length - (now - started))
		},
})

export const addOneMinuteToAllRunningTimersTX = transaction({
	key: `addOneMinuteToAllRunningTimers`,
	do: ({ get, set }) => {
		const timerIds = get(timerKeysAtom)
		for (const timerId of timerIds) {
			if (get(timerRemainingSelectors, timerId) > 0) {
				set(timerLengthAtoms, timerId, (current) => current + 60_000)
			}
		}
	},
})
