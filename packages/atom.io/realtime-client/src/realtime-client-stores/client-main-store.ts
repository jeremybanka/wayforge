import * as AtomIO from "atom.io"
import { lazyLocalStorageEffect } from "atom.io/__unstable__/web-effects"

export const myIdState__INTERNAL = AtomIO.atom<string | undefined>({
	key: `mySocketId__INTERNAL`,
	default: undefined,
})
export const myIdState = AtomIO.selector<string | undefined>({
	key: `mySocketId`,
	get: ({ get }) => get(myIdState__INTERNAL),
})
export const myUsernameState = AtomIO.atom<string | null>({
	key: `myUsername`,
	default: null,
	effects: [lazyLocalStorageEffect(`myUsername`)],
})
