import * as AtomIO from "atom.io"
import { persistAtom } from "atom.io/react-devtools"

export const myIdState__INTERNAL = AtomIO.atom<string | undefined>({
	key: `mySocketId__INTERNAL`,
	default: undefined,
})
export const myIdState = AtomIO.selector<string | undefined>({
	key: `mySocketId`,
	get: ({ get }) => get(myIdState__INTERNAL),
})

export const myUsernameState = AtomIO.atom<string | null>({
	key: `myName`,
	default: null,
	effects:
		typeof window === `undefined`
			? []
			: [persistAtom(window.localStorage)(JSON)(`myUsername`)],
})
