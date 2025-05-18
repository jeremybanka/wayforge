import type { Loadable } from "atom.io"
import { atom } from "atom.io"
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
