import * as AtomIO from "atom.io"

import { lazyLocalStorageEffect } from "~/packages/atom.io/react-devtools/src/lazy-local-storage-effect"

export const myIdState__INTERNAL = AtomIO.atom<string | undefined>({
	key: `mySocketId__INTERNAL`,
	default: undefined,
})
export const myIdState = AtomIO.selector<string | undefined>({
	key: `mySocketId`,
	get: ({ get }) => get(myIdState__INTERNAL),
})

const usernameEffects =
	typeof window === `undefined` ? [] : [lazyLocalStorageEffect(`myUsername`)]
export const myUsernameState = AtomIO.atom<string | null>({
	key: `myUsername`,
	default: null,
	effects: usernameEffects,
})
