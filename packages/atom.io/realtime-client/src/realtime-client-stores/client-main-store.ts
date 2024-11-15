import * as AtomIO from "atom.io"
import type { Actual } from "atom.io/realtime"
import type { UserKey } from "atom.io/realtime-server"
import { persistSync } from "atom.io/web"

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
	effects:
		typeof window === `undefined`
			? []
			: [persistSync(window.localStorage, JSON, `myUsername`)],
})

export const myUserKeyActualState = AtomIO.selector<UserKey<Actual> | null>({
	key: `myUserKeyActual`,
	get: ({ get }) => {
		const myUsername = get(myUsernameState)
		if (myUsername === undefined) return null
		return `user::__${myUsername}__` satisfies UserKey<Actual>
	},
})
