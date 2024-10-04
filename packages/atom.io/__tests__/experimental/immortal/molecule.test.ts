import type { CtorToolkit, Logger } from "atom.io"
import {
	disposeState,
	getState,
	makeMolecule,
	makeRootMoleculeInStore,
	moleculeFamily,
} from "atom.io"
import { clearStore, IMPLICIT, withdraw } from "atom.io/internal"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 2

let logger: Logger

beforeEach(() => {
	clearStore(IMPLICIT.STORE)
	IMPLICIT.STORE.config.lifespan = `immortal`
	IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = IMPLICIT.STORE.logger
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
})
describe(`moleculeFamily`, () => {
	test(`exclusive molecule hierarchy`, () => {
		const worldMolecule = makeRootMoleculeInStore(`world`)

		const bottomMolecules = moleculeFamily({
			key: `bottom`,
			dependsOn: `any`,
			new: class Bottom {},
		})

		const topMolecules = moleculeFamily({
			key: `top`,
			new: class Top {
				public constructor(
					tools: CtorToolkit<string>,
					public key: string,
					childKeys: string[],
				) {
					for (const childKey of childKeys) {
						const child = tools.seek(bottomMolecules, childKey)
						if (child) {
							tools.claim(child, { exclusive: true })
						} else {
							tools.spawn(bottomMolecules, childKey)
						}
					}
				}
			},
		})

		const aMolecule0 = makeMolecule(worldMolecule, topMolecules, `a0`, [`a`])

		const aMolecule1 = makeMolecule(worldMolecule, topMolecules, `a1`, [`a`])

		expect(IMPLICIT.STORE.molecules.size).toBe(4)
		const a0 = withdraw(aMolecule0, IMPLICIT.STORE)
		const a1 = withdraw(aMolecule1, IMPLICIT.STORE)
		expect(a0?.below.size).toBe(0)
		expect(a1?.below.size).toBe(1)

		disposeState(aMolecule0)
		expect(IMPLICIT.STORE.molecules.size).toBe(3)

		disposeState(aMolecule1)
		expect(IMPLICIT.STORE.molecules.size).toBe(1)
	})
	test(`nonexclusive molecule hierarchy`, () => {
		const worldMolecule = makeRootMoleculeInStore(`world`)

		const bottomMolecules = moleculeFamily({
			key: `bottom`,
			dependsOn: `any`,
			new: class Bottom {},
		})

		const topMolecules = moleculeFamily({
			key: `top`,
			new: class Top {
				public constructor(
					tools: CtorToolkit<string>,
					public key: string,
					childKeys: string[],
				) {
					for (const childKey of childKeys) {
						const child = tools.seek(bottomMolecules, childKey)
						if (child) {
							tools.claim(child, { exclusive: false })
						} else {
							tools.spawn(bottomMolecules, childKey)
						}
					}
				}
			},
		})

		const abMolecule = makeMolecule(worldMolecule, topMolecules, `ab`, [
			`a`,
			`b`,
		])
		const bcMolecule = makeMolecule(worldMolecule, topMolecules, `bc`, [
			`b`,
			`c`,
		])
		const ab = withdraw(abMolecule, IMPLICIT.STORE)
		expect(IMPLICIT.STORE.molecules.size).toBe(6)
		expect(ab.below.size).toBe(2)
		expect([...ab.below.values()][0].below.size).toBe(0)
		expect([...ab.below.values()][1].below.size).toBe(0)

		const world = withdraw(worldMolecule, IMPLICIT.STORE)
		expect(world.below.size).toBe(2)

		disposeState(ab)
		expect(ab.below.size).toBe(0)
		expect(IMPLICIT.STORE.molecules.size).toBe(4)

		expect(() => getState(abMolecule)).toThrowErrorMatchingInlineSnapshot(
			`[Error: Molecule "ab" not found in store "IMPLICIT_STORE".]`,
		)

		disposeState(bcMolecule)

		expect(IMPLICIT.STORE.molecules.size).toBe(1)

		expect(() =>
			makeMolecule({ type: `molecule`, key: `fake` }, topMolecules, `hello`, []),
		).toThrow()
	})
})
