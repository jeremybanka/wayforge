import { atom } from "atom.io"

export const sidebarOpenAtom = atom<boolean>({
	key: `sidebarOpen`,
	default: false,
	effects: [
		({ setSelf }) => {
			const stored = localStorage.getItem(`sidebarOpen`)
			if (stored !== null) {
				setSelf(JSON.parse(stored))
			}
		},
	],
})
