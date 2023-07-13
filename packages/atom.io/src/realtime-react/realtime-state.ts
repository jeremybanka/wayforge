import * as AtomIO from "atom.io"

export const myIdState__INTERNAL = AtomIO.atom<string | null>({
	key: `myId__INTERNAL`,
	default: null,
})
export const myIdState = AtomIO.selector<string | null>({
	key: `myId`,
	get: ({ get }) => get(myIdState__INTERNAL),
})
