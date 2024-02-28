import { atom, atomFamily, selector } from "atom.io"

export const gamePlayerIndex = atom<string[]>({
	key: `gamePlayerIndex`,
	default: [],
})

export const playerScoreAtoms = atomFamily<number, string>({
	key: `playerScore`,
	default: 0,
})

export const leadPlayerIndex = atom<number>({
	key: `leadPlayer`,
	default: 0,
})

export const playerOrderState = selector<string[]>({
	key: `playerOrder`,
	get: ({ get }) => {
		const playerOrder = get(gamePlayerIndex)
		const leadPlayer = get(leadPlayerIndex)
		return playerOrder.slice(leadPlayer).concat(playerOrder.slice(0, leadPlayer))
	},
})
