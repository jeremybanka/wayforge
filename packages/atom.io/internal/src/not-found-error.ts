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
	switch (token.type) {
		case `atom_family`:
			return `Atom Family`
		case `readonly_selector`:
			return `Readonly Selector`
		case `readonly_selector_family`:
			return `Readonly Selector Family`
		case `selector_family`:
			return `Selector Family`
		default:
			return capitalize(token.type)
	}
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
