import { type Json, stringifyJson } from "atom.io/json"

import type { AtomIOToken } from "./pretty-print"
import { prettyPrintTokenType } from "./pretty-print"
import type { Store } from "./store"

export class NotFoundError extends Error {
	public constructor(token: AtomIOToken, store: Store)
	public constructor(
		familyToken: AtomIOToken,
		key: Json.Serializable,
		store: Store,
	)
	public constructor(
		...params:
			| [token: AtomIOToken, key: Json.Serializable, store: Store]
			| [token: AtomIOToken, store: Store]
	) {
		const token: AtomIOToken = params[0]
		const store: Store = params.length === 2 ? params[1] : params[2]

		if (params.length === 2) {
			super(
				`${prettyPrintTokenType(token)} ${stringifyJson(token.key)} not found in store "${
					store.config.name
				}".`,
			)
		} else {
			const key = params[1]
			super(
				`${prettyPrintTokenType(token)} "${token.key}" member ${stringifyJson(key)} not found in store "${
					store.config.name
				}".`,
			)
		}
	}
}
