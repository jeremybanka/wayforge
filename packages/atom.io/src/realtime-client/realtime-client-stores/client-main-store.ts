import * as AtomIO from "atom.io"
import { storageSync } from "atom.io/web"

export const myIdState__INTERNAL: AtomIO.RegularAtomToken<string | undefined> =
	AtomIO.atom<string | undefined>({
		key: `mySocketId__INTERNAL`,
		default: undefined,
	})
export const myIdState: AtomIO.ReadonlyPureSelectorToken<string | undefined> =
	AtomIO.selector<string | undefined>({
		key: `mySocketId`,
		get: ({ get }) => get(myIdState__INTERNAL),
	})

export const myUsernameState: AtomIO.RegularAtomToken<string | null> =
	AtomIO.atom<string | null>({
		key: `myName`,
		default: null,
		effects: [storageSync(globalThis.localStorage, JSON, `myUsername`)],
	})
