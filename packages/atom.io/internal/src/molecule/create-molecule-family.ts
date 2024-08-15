import type {
	MoleculeConstructor,
	MoleculeCreation,
	MoleculeFamily,
	MoleculeFamilyOptions,
	MoleculeFamilyToken,
} from "atom.io"

import type { Store } from "../store"
import { Subject } from "../subject"

export function createMoleculeFamily<M extends MoleculeConstructor>(
	store: Store,
	options: MoleculeFamilyOptions<M>,
): MoleculeFamilyToken<M> {
	const subject = new Subject<MoleculeCreation<M>>()

	const token = {
		type: `molecule_family`,
		key: options.key,
		dependsOn: options.dependsOn ?? `all`,
	} as const satisfies MoleculeFamilyToken<M>
	const family = {
		...token,
		subject,
		new: options.new,
	} satisfies MoleculeFamily<M>
	store.moleculeFamilies.set(options.key, family)
	return token
}
