import type { Loadable } from "atom.io"
import { atom } from "atom.io"
import { persistSync } from "atom.io/web"

import { trpc } from "./trpc-client-service"

export const appVersionQueryAtom = atom<
	Loadable<{ version: string; changelog: string }>
>({
	key: `appVersionQuery`,
	default: trpc.version.query,
})

export const lastKnownVersionAtom = atom<string | null>({
	key: `lastKnownVersion`,
	default: null,
	effects: [persistSync(localStorage, JSON, `lastKnownVersion`)],
})
