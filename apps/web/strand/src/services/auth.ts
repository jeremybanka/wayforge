import * as AtomIO from "atom.io"
import { createJsonLocalStorageEffect } from "atom.io/browser"

export const secretState = AtomIO.atom<string>({
	key: `secret`,
	default: ``,
	effects: [createJsonLocalStorageEffect(`secret`)],
})
