import { type AtomIOToken, PRETTY_TOKEN_TYPES } from "atom.io"
import { stringifyJson } from "atom.io/json"

import type { Store } from "./store"

export class NotFoundError extends Error {
	public constructor(token: AtomIOToken, store: Store) {
		super(
			`${PRETTY_TOKEN_TYPES[token.type]} ${stringifyJson(token.key)} not found in store "${
				store.config.name
			}".`,
		)
	}
}
