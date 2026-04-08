import { atom, timeline, transaction } from "atom.io"

const statusAtom = atom<string>({
	key: `status`,
	default: `idle`,
})

const savedAtAtom = atom<number | null>({
	key: `savedAt`,
	default: null,
})

const saveDraftTX = transaction<() => void>({
	key: `saveDraft`,
	do: ({ set }) => {
		set(statusAtom, `saving`)
		set(savedAtAtom, Date.now())
	},
})

const editsTL = timeline({
	key: `edits`,
	scope: [statusAtom, savedAtAtom],
})
