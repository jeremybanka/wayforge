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
			`Tried to create ${family.type === `atom_family` ? `an` : `a`} ${prettyPrintTokenType(family)} with key "${family.key}", but "${family.key}" already exists in store "${store.config.name}" as ${existingFamily.type === `atom_family` ? `an` : `a`} ${prettyPrintTokenType(
				existingFamily,
			)}`,
		)
	}
}
