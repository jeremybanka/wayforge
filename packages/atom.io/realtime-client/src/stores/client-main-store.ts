import * as AtomIO from "atom.io"

export const myIdState__INTERNAL = AtomIO.atom<string | undefined>({
	key: `myId__INTERNAL`,
	default: undefined,
})
export const myIdState = AtomIO.selector<string | undefined>({
	key: `myId`,
	get: ({ get }) => get(myIdState__INTERNAL),
})
