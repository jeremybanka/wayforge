import type { AtomIOToken } from "atom.io"
import { stringifyJson } from "atom.io/json"

import { prettyPrintTokenType } from "./pretty-print"
import type { Store } from "./store"

export class NotFoundError extends Error {
	public constructor(token: AtomIOToken, store: Store) {
		super(
			`${prettyPrintTokenType(token)} ${stringifyJson(token.key)} not found in store "${
				store.config.name
			}".`,
		)
	}
}
