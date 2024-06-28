import type {
	MoleculeFamilyToken,
	MoleculeToken,
	ReadableFamilyToken,
	ReadableToken,
	TimelineToken,
	TransactionToken,
} from "atom.io"
import { type Json, stringifyJson } from "atom.io/json"

import type { Store } from "./store"

const capitalize = (str: string) => str[0].toUpperCase() + str.slice(1)

type AtomIOToken =
	| MoleculeFamilyToken<any>
	| MoleculeToken<any>
	| ReadableFamilyToken<any, any>
	| ReadableToken<any>
	| TimelineToken<any>
	| TransactionToken<any>

function prettyPrintTokenType(token: AtomIOToken) {
	switch (token.type) {
		case `atom_family`:
			return `Atom Family`
		case `molecule_family`:
			return `Molecule Family`
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
