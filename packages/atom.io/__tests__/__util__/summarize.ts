import { prettyDOM } from "@testing-library/react"
import type { Store } from "atom.io/internal"
import { IMPLICIT } from "atom.io/internal"

export const summarize = (store: Store = IMPLICIT.STORE): void => {
	console.log(prettyDOM(document), {
		atoms: [store.atoms.size],
	})
}
