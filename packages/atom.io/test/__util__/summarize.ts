import { prettyDOM } from "@testing-library/react"
import * as AtomIO from "atom.io"

import { recordToEntries } from "~/packages/anvl/src/object"

export const summarize = (
	store: AtomIO.Store = AtomIO.__INTERNAL__.IMPLICIT.STORE,
): void => {
	console.log(prettyDOM(document), {
		atoms: [recordToEntries(store.atoms).length],
	})
}
