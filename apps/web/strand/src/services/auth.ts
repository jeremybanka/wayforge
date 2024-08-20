import * as AtomIO from "atom.io"
import { persistSync } from "atom.io/web"

export const secretState = AtomIO.atom<string>({
	key: `secret`,
	default: ``,
	effects: [persistSync(window.localStorage)(JSON)(`secret`)],
})
