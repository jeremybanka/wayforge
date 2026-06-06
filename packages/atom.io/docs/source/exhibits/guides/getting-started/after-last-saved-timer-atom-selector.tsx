import { atom, selector } from "atom.io"
import { useO } from "atom.io/react"
import type { JSX } from "react/jsx-runtime"

const LAST_SAVED_AT = Date.now() - 12_000

const lastSavedTimerAtom = atom<number>({
	key: `lastSavedTimer`,
	default: Date.now(),
	effects: [
		({ setSelf }) => {
			const interval = window.setInterval(() => {
				setSelf(Date.now())
			}, 1000)

			return () => {
				window.clearInterval(interval)
			}
		},
	],
})

const lastSavedLabelSelector = selector<string>({
	key: `lastSavedLabel`,
	get: ({ get }) => {
		const now = get(lastSavedTimerAtom)
		const seconds = Math.floor((now - LAST_SAVED_AT) / 1000)
		return seconds <= 0 ? `Saved just now` : `Saved ${seconds}s ago`
	},
})

export function LastSavedIndicator(): JSX.Element {
	const label = useO(lastSavedLabelSelector)

	return <output>{label}</output>
}
