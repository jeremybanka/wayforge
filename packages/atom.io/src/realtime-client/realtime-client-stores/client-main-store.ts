import * as AtomIO from "atom.io"
import type { SocketKey, UserKey } from "atom.io/realtime"

export const mySocketKeyAtom: AtomIO.RegularAtomToken<SocketKey | undefined> =
	AtomIO.atom<SocketKey | undefined>({
		key: `mySocketKey`,
		default: undefined,
	})

export const myUserKeyAtom: AtomIO.RegularAtomToken<UserKey | null> =
	AtomIO.atom<UserKey | null>({
		key: `myUserKey`,
		default: null,
		effects: [
			(userKey) => {
				if (typeof window !== `undefined`) {
					void import(`atom.io/web`).then(({ storageSync }) => {
						storageSync(globalThis.localStorage, JSON, `myUserKey`)(userKey)
					})
				}
			},
		],
	})
