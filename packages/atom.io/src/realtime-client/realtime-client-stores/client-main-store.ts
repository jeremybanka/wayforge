import * as AtomIO from "atom.io"
import type { UserKey } from "atom.io/realtime-server"
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

export const myUserKeyAtom: AtomIO.RegularAtomToken<UserKey | null> =
	AtomIO.atom<UserKey | null>({
		key: `myUserKey`,
		default: null,
		effects: [storageSync(globalThis.localStorage, JSON, `myUserKey`)],
	})
