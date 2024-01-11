import { atom } from "atom.io"

export const roomViewState = atom<string | null>({
	key: `roomView`,
	default: null,
})
