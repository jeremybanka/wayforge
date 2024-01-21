import type {
	ReadableFamilyToken,
	ReadableToken,
	TimelineToken,
	TransactionToken,
} from "atom.io"

import type { Store } from "./store"

const capitalize = (str: string) => str[0].toUpperCase() + str.slice(1)

type AtomIOToken =
	| ReadableFamilyToken<any, any>
	| ReadableToken<any>
	| TimelineToken<any>
	| TransactionToken<any>

function prettyPrintTokenType(token: AtomIOToken) {
	if (token.type === `readonly_selector`) {
		return `Readonly Selector`
	}
	return capitalize(token.type)
}

export class NotFoundError extends Error {
	public constructor(token: AtomIOToken, store: Store) {
		super(
			`${prettyPrintTokenType(token)} "${token.key}" not found in store "${
				store.config.name
			}".`,
		)
	}
}
