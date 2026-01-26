import { atom, atomFamily, transaction } from "atom.io"

export type PublicUser = {
	id: string
	displayName: string
}

export const publicUserAtoms = atomFamily<PublicUser, string>({
	key: `publicUser`,
	default: (id) => ({ id, displayName: `` }),
})

export const userKeysAtom = atom<string[]>({
	key: `userKeys`,
	default: [],
})

export const addUserTX = transaction<(user: PublicUser) => void>({
	key: `addUser`,
	do: ({ get, set }, user) => {
		set(publicUserAtoms, user.id, user)
		if (!get(userKeysAtom).includes(user.id)) {
			set(userKeysAtom, (current) => [...current, user.id])
		}
	},
})
