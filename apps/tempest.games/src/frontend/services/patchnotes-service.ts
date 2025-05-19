import type { Loadable } from "atom.io"
import { atom, selector } from "atom.io"
import { persistSync } from "atom.io/web"

import { trpcClient } from "./trpc-client-service"

export const appVersionQueryAtom = atom<
	Loadable<{ version: string; changelog: string }>
>({
	key: `appVersionQuery`,
	default: trpcClient.version.query,
})

export const lastKnownVersionAtom = atom<string | null>({
	key: `lastKnownVersion`,
	default: null,
	effects: [persistSync(localStorage, JSON, `lastKnownVersion`)],
})

export const appVersionSelector = selector<Loadable<string>>({
	key: `appVersion`,
	get: async ({ get }) => {
		const appVersionQuery = get(appVersionQueryAtom)
		if (appVersionQuery instanceof Promise) {
			return appVersionQuery.then((res) => res.version)
		}
		return appVersionQuery.version
	},
})
