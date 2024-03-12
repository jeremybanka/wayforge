import * as AtomIO from "atom.io"

import { lazyLocalStorageEffect } from "~/packages/atom.io/__unstable__/web-effects/src/storage"

export const myIdStateInternal = AtomIO.atom<string | undefined>({
	key: `mySocketId__INTERNAL`,
	default: undefined,
})
export const myIdState = AtomIO.selector<string | undefined>({
	key: `mySocketId`,
	get: ({ get }) => get(myIdStateInternal),
})

const usernameEffects =
	typeof window === `undefined` ? [] : [lazyLocalStorageEffect(`myUsername`)]
export const myUsernameState = AtomIO.atom<string | null>({
	key: `myUsername`,
	default: null,
	effects: usernameEffects,
})
