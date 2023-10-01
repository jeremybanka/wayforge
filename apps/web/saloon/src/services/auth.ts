import * as AtomIO from "atom.io"
import { lazyLocalStorageEffect } from "~/packages/atom.io/__unstable__/web-effects/src"

export const secretState = AtomIO.atom<string>({
	key: `secret`,
	default: ``,
	effects: [lazyLocalStorageEffect(`secret`)],
})
