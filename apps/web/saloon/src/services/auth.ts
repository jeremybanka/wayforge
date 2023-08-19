import * as AtomIO from "atom.io"
import { lazyLocalStorageEffect } from "atom.io/web-effects"

export const secretState = AtomIO.atom<string>({
	key: `secret`,
	default: ``,
	effects: [lazyLocalStorageEffect(`secret`)],
})
