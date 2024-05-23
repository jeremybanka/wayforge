import type { MoleculeToken } from "atom.io/immortal"
import {
	makeMolecule,
	makeMoleculeInStore,
	makeRootMolecule,
	Molecule,
	moleculeFamily,
	useMolecule,
} from "atom.io/immortal"

describe(`moleculeFamily`, () => {
	test(`molecule hierarchy`, () => {
		const world = makeRootMolecule(`world`)

		const bottomMolecules = moleculeFamily({
			key: `bottom`,
			new: (store) =>
				class Bottom extends Molecule<string> {
					public constructor(
						context: Molecule<any>[],
						token: MoleculeToken<string, any, any>,
					) {
						super(store, context, token)
					}
				},
		})

		const topMolecules = moleculeFamily({
			key: `top`,
			new: (store) =>
				class Top extends Molecule<string> {
					public constructor(
						context: Molecule<any>[],
						token: MoleculeToken<string, any, any>,
					) {
						super(store, context, token)
						for (const childName of [`one`, `two`]) {
							makeMoleculeInStore(
								store,
								this,
								bottomMolecules,
								`${token.key}-bottom-${childName}`,
							)
						}
					}
				},
		})

		const howdy = makeMolecule(world, topMolecules, `howdy`)
		console.log(useMolecule(howdy))
	})
})
