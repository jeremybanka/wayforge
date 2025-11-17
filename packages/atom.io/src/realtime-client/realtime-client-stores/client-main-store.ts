import * as AtomIO from "atom.io"
import type { SocketKey, UserKey } from "atom.io/realtime"
import { storageSync } from "atom.io/web"

export const mySocketKeyAtom: AtomIO.RegularAtomToken<SocketKey | undefined> =
	AtomIO.atom<SocketKey | undefined>({
		key: `mySocketKey`,
		default: undefined,
	})

export const myUserKeyAtom: AtomIO.RegularAtomToken<UserKey | null> =
	AtomIO.atom<UserKey | null>({
		key: `myUserKey`,
		default: null,
		effects: [storageSync(globalThis.localStorage, JSON, `myUserKey`)],
	})
