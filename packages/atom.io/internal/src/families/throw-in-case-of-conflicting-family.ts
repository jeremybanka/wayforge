import type { AtomFamilyToken, SelectorFamilyToken } from "atom.io"

import { prettyPrintTokenType } from "../pretty-print"
import type { Store } from "../store"

export function throwInCaseOfConflictingFamily(
	family: AtomFamilyToken<any, any> | SelectorFamilyToken<any, any>,
	store: Store,
): void {
	const existingFamily = store.families.get(family.key)
	if (existingFamily) {
		throw new Error(
			`${prettyPrintTokenType(family)} "${family.key}" already exists in store "${store.config.name} as ${existingFamily.type === `atom_family` ? `an` : ``} ${prettyPrintTokenType(
				existingFamily,
			)}`,
		)
	}
}
