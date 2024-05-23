import { disposeState } from "atom.io"
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
		const worldMolecule = makeRootMolecule(`world`)

		const bottomMolecules = moleculeFamily({
			key: `bottom`,
			new: (store) =>
				class Bottom extends Molecule<string> {
					public constructor(
						context: Molecule<any>[],
						token: MoleculeToken<string, Bottom, []>,
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
						token: MoleculeToken<string, Top, []>,
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

		const howdyMolecule = makeMolecule(worldMolecule, topMolecules, `howdy`)
		const howdy = useMolecule(howdyMolecule)

		expect(howdy?.below.length).toBe(2)
		expect(howdy?.below[0].below.length).toBe(0)
		expect(howdy?.below[1].below.length).toBe(0)

		const world = useMolecule(worldMolecule)
		expect(world?.below.length).toBe(1)

		disposeState(howdyMolecule)

		expect(useMolecule(howdyMolecule)).toBeUndefined()

		expect(() =>
			makeMolecule({ type: `molecule`, key: `fake` }, topMolecules, `hello`),
		).toThrow()
	})
})
