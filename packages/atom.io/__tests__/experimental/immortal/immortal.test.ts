import type { AtomToken, CtorToolkit, Logger } from "atom.io"
import {
	atomFamily,
	disposeState,
	getState,
	makeMolecule,
	makeRootMolecule,
	moleculeFamily,
	setState,
} from "atom.io"
import { editRelations, findRelations, getJoin, join } from "atom.io/data"
import { findState } from "atom.io/ephemeral"
import { seekState } from "atom.io/immortal"
import * as Internal from "atom.io/internal"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 2

let logger: Logger

beforeEach(() => {
	Internal.clearStore(Internal.IMPLICIT.STORE)
	Internal.IMPLICIT.STORE.config.lifespan = `immortal`
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = Internal.IMPLICIT.STORE.logger
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
})

describe(`immortal mode`, () => {
	test(`implicit initialization with findState is illegal in immortal mode`, () => {
		const countStates = atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		expect(() =>
			findState(countStates, `count`),
		).toThrowErrorMatchingInlineSnapshot(
			// eslint-disable-next-line quotes
			"[Error: Do not use `find` or `findState` in an immortal store. Prefer `seek` or `seekState`.]",
		)
	})
	test(`safe initialization of state with Molecule`, () => {
		const world = makeRootMolecule(`world`)
		const countStates = atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		const counters = moleculeFamily({
			key: `counters`,
			new: class Counter {
				public $count: AtomToken<number>
				public constructor(public tools: CtorToolkit<string>) {
					this.$count = this.tools.bond(countStates)
				}
			},
		})
		const myCounterMolecule = makeMolecule(world, counters, `my-counter`)
		const myCounter = getState(myCounterMolecule)
		if (!myCounter) {
			throw new Error(`myCounter is undefined`)
		}
		setState(myCounter.$count, 1)
		expect(getState(myCounter.$count)).toBe(1)
		disposeState(myCounterMolecule)
		expect(() => getState(myCounter.$count)).toThrowErrorMatchingInlineSnapshot(
			`[Error: Atom "count(\\"my-counter\\")" not found in store "IMPLICIT_STORE".]`,
		)
		expect(() => getState(myCounterMolecule)).toThrowErrorMatchingInlineSnapshot(
			`[Error: Molecule "my-counter" not found in store "IMPLICIT_STORE".]`,
		)
	})
	test(`safe retrieval of state with seekState`, () => {
		const countStates = atomFamily<number, string>({
			key: `count`,
			default: 0,
		})

		const countState = seekState(countStates, `world`)
		expect(countState).toBeUndefined()
	})
	test(`unsafe retrieval of state without seekState`, () => {
		const countStates = atomFamily<number, string>({
			key: `count`,
			default: 0,
		})

		expect(getState(countStates, `nonexistent`)).toBe(0)
		expect(logger.error).toHaveBeenLastCalledWith(
			`❗`,
			`atom_family`,
			`count`,
			`tried to get member`,
			`"nonexistent"`,
			`but it was not found in store`,
			`IMPLICIT_STORE`,
		)
		setState(countStates, `nonexistent`, 1)
		expect(logger.error).toHaveBeenLastCalledWith(
			`❗`,
			`atom_family`,
			`count`,
			`tried to set member`,
			`"nonexistent"`,
			`to`,
			1,
			`but it was not found in store`,
			`IMPLICIT_STORE`,
		)
		expect(getState(countStates, `nonexistent`)).toBe(0)
		expect(logger.error).toHaveBeenLastCalledWith(
			`❗`,
			`atom_family`,
			`count`,
			`tried to get member`,
			`"nonexistent"`,
			`but it was not found in store`,
			`IMPLICIT_STORE`,
		)
		disposeState(countStates, `nonexistent`)
		expect(logger.error).toHaveBeenLastCalledWith(
			`❗`,
			`atom_family`,
			`count`,
			`tried to dispose of member`,
			`"nonexistent"`,
			`but it was not found in store`,
			`IMPLICIT_STORE`,
		)

		const counterMolecules = moleculeFamily({
			key: `counter`,
			new: class Counter {
				public $count: AtomToken<number>
				public constructor(
					tools: CtorToolkit<string>,
					public key: string,
				) {
					this.$count = tools.bond(countStates)
				}
			},
		})

		expect(() => getState(counterMolecules, `nonexistent`)).toThrowError(
			`Molecule Family "counter" member "nonexistent" not found in store "IMPLICIT_STORE".`,
		)
		disposeState(counterMolecules, `nonexistent`)
		expect(logger.error).toHaveBeenLastCalledWith(
			`❗`,
			`molecule_family`,
			`counter`,
			`tried to dispose of member`,
			`"nonexistent"`,
			`but it was not found in store`,
			`IMPLICIT_STORE`,
		)

		const root = makeRootMolecule(`root`)
		makeMolecule(root, counterMolecules, `does exist`)
		expect(() => getState(counterMolecules, `does exist`)).not.toThrowError()
	})
})

describe(`immortal integrations`, () => {
	test(`join`, () => {
		const holdersOfItems = join(
			{
				key: `holdersOfItems`,
				between: [`holder`, `item`],
				cardinality: `1:n`,
			},
			{ affinity: 0 } satisfies { affinity: number },
		)

		const itemMolecules = moleculeFamily({
			key: `item`,
			new: class Item {
				public constructor(tools: CtorToolkit<string>) {
					tools.bond(holdersOfItems, { as: `item` })
				}
			},
		})

		const characterMolecules = moleculeFamily({
			key: `character`,
			new: class Character {
				public constructor(tools: CtorToolkit<string>) {
					tools.bond(holdersOfItems, { as: `holder` })
				}
			},
		})

		const world = makeRootMolecule(`world`)

		const holderMolecule = makeMolecule(world, characterMolecules, `holder-0`)
		const itemMolecule = makeMolecule(world, itemMolecules, `item-0`)

		editRelations(holdersOfItems, (relations) => {
			relations.set({ holder: `holder-0`, item: `item-0` }, { affinity: 1 })
		})
		const internalJoin = getJoin(holdersOfItems, Internal.IMPLICIT.STORE)
		expect(internalJoin.molecules.size).toBe(3)
		expect(Internal.IMPLICIT.STORE.molecules.size).toBe(4)

		editRelations(holdersOfItems, (relations) => {
			relations.delete(`item-0`)
		})
		expect(() => findRelations(holdersOfItems, `item-1`)).toThrowError(
			`Readonly Selector Family "holdersOfItems/singleRelatedEntry" member "item-1" not found in store "IMPLICIT_STORE".`,
		)

		expect(internalJoin.molecules.size).toBe(2)
		expect(Internal.IMPLICIT.STORE.molecules.size).toBe(3)

		editRelations(holdersOfItems, (relations) => {
			relations.replaceRelations(`item-0`, { "holder-0": { affinity: 1 } })
		})

		expect(internalJoin.molecules.size).toBe(3)
		expect(Internal.IMPLICIT.STORE.molecules.size).toBe(4)

		disposeState(itemMolecule)

		expect(internalJoin.molecules.size).toBe(1)
		expect(Internal.IMPLICIT.STORE.molecules.size).toBe(2)

		disposeState(holderMolecule)

		expect(internalJoin.molecules.size).toBe(0)
		expect(Internal.IMPLICIT.STORE.molecules.size).toBe(1)
	})
})
