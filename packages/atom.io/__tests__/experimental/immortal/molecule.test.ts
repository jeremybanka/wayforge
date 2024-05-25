import type { MoleculeTransactors } from "atom.io"
import {
	disposeState,
	makeMolecule,
	makeRootMolecule,
	moleculeFamily,
	useMolecule,
} from "atom.io"
import { IMPLICIT, withdraw } from "atom.io/internal"

describe(`moleculeFamily`, () => {
	test(`molecule hierarchy`, () => {
		const worldMolecule = makeRootMolecule(`world`)

		const bottomMolecules = moleculeFamily({
			key: `bottom`,
			new: class Bottom {},
		})

		const topMolecules = moleculeFamily({
			key: `top`,
			new: class Top {
				public constructor(
					transactors: MoleculeTransactors<string>,
					public key: string,
				) {
					for (const childName of [`one`, `two`]) {
						transactors.spawn(bottomMolecules, `${key}-bottom-${childName}`)
					}
				}
			},
		})

		const howdyMolecule = makeMolecule(worldMolecule, topMolecules, `howdy`)
		const howdy = withdraw(howdyMolecule, IMPLICIT.STORE)
		expect(IMPLICIT.STORE.molecules.size).toBe(4)

		expect(howdy.below.size).toBe(2)
		expect([...howdy.below.values()][0].below.size).toBe(0)
		expect([...howdy.below.values()][1].below.size).toBe(0)

		const world = withdraw(worldMolecule, IMPLICIT.STORE)
		expect(world.below.size).toBe(1)

		console.log(IMPLICIT.STORE.molecules)
		disposeState(howdyMolecule)
		expect(howdy.below.size).toBe(0)
		console.log(IMPLICIT.STORE.molecules)
		expect(IMPLICIT.STORE.molecules.size).toBe(1)

		expect(useMolecule(howdyMolecule)).toBeUndefined()

		expect(() =>
			makeMolecule({ type: `molecule`, key: `fake` }, topMolecules, `hello`),
		).toThrow()
	})
})
