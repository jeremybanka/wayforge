import { atom } from "atom.io"

export const searchQueryAtom = atom<string>({
	key: `searchQuery`,
	default: ``,
	effects: [
		({ onSet }) => {
			onSet(({ newValue }) => {
				console.log(`search query updated:`, newValue)
			})
		},
	],
})
