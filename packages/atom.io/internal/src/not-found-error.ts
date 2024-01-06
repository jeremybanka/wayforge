import type { ReadableToken } from "atom.io"

import type { Store } from "./store"

const capitalize = (str: string) => str[0].toUpperCase() + str.slice(1)

function prettyPrintTokenType(token: ReadableToken<any>) {
	if (token.type === `readonly_selector`) {
		return `Readonly Selector`
	}
	return capitalize(token.type)
}

export class NotFoundError extends Error {
	public constructor(token: ReadableToken<any>, store: Store) {
		super(
			`${prettyPrintTokenType(token)} "${token.key}" not found in store "${
				store.config.name
			}".`,
		)
	}
}
