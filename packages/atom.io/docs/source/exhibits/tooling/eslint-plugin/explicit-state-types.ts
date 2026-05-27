import { atom, atomFamily } from "atom.io"

type User = {
	id: string
	name: string
}

export const countAtom = atom<number>({
	key: `count`,
	default: 0,
})

export const userAtoms = atomFamily<User, string>({
	key: `user`,
	default: (id) => ({ id, name: `` }),
})
