import { atom, atomFamily, transaction } from "atom.io"

export type PublicUser = {
	id: string
	displayName: string
}

export const findPublicUserState = atomFamily<PublicUser, string>({
	key: `publicUser`,
	default: (id) => ({ id, displayName: `` }),
})

export const userIndex = atom<string[]>({
	key: `userIndex`,
	default: [],
})

export const addUserTX = transaction<(user: PublicUser) => void>({
	key: `addUser`,
	do: ({ get, set }, user) => {
		const userState = findPublicUserState(user.id)
		set(userState, user)
		if (!get(userIndex).includes(user.id)) {
			set(userIndex, (current) => [...current, user.id])
		}
	},
})
