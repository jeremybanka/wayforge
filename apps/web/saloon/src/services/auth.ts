import * as AtomIO from "atom.io"

import { lazyLocalStorageEffect } from "~/packages/atom.io/src/web-effects"

export const secretState = AtomIO.atom<string>({
	key: `secret`,
	default: ``,
	effects: [lazyLocalStorageEffect(`secret`)],
})
