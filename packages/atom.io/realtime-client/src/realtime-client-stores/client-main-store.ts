import * as AtomIO from "atom.io"
import { persistSync } from "atom.io/web"

export const myIdState__INTERNAL: AtomIO.RegularAtomToken<string | undefined> =
	AtomIO.atom({
		key: `mySocketId__INTERNAL`,
		default: undefined,
	})
export const myIdState: AtomIO.ReadonlySelectorToken<string | undefined> =
	AtomIO.selector({
		key: `mySocketId`,
		get: ({ get }) => get(myIdState__INTERNAL),
	})

export const myUsernameState: AtomIO.RegularAtomToken<string | null> =
	AtomIO.atom({
		key: `myName`,
		default: null,
		effects:
			typeof window === `undefined`
				? []
				: [persistSync(window.localStorage, JSON, `myUsername`)],
	})
