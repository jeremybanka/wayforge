import { atom, selector } from "atom.io"

export const dividendAtom = atom<number>({
	key: `dividend`,
	default: 0,
})

export const divisorAtom = atom<number>({
	key: `divisor`,
	default: 2,
})

export const quotientSelector = selector<number>({
	key: `quotient`,
	get: ({ get }) => {
		const dividend = get(dividendAtom)
		const divisor = get(divisorAtom)
		return dividend / divisor
	},
})
