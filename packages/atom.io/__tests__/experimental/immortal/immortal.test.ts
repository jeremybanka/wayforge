import type { AtomToken, Logger, MoleculeTransactors } from "atom.io"
import {
	atomFamily,
	disposeState,
	getState,
	makeMolecule,
	makeRootMolecule,
	moleculeFamily,
	setState,
	useMolecule,
} from "atom.io"
import { editRelations, getJoin, join } from "atom.io/data"
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
				public constructor(public transactors: MoleculeTransactors<string>) {
					this.$count = this.transactors.bond(countStates)
				}
			},
		})
		const myCounterMolecule = makeMolecule(world, counters, `my-counter`)
		const myCounter = useMolecule(myCounterMolecule)
		if (!myCounter) {
			throw new Error(`myCounter is undefined`)
		}
		setState(myCounter.$count, 1)
		expect(getState(myCounter.$count)).toBe(1)
		disposeState(myCounterMolecule)
		expect(() => getState(myCounter.$count)).toThrowErrorMatchingInlineSnapshot(
			`[Error: Atom "count("my-counter")" not found in store "IMPLICIT_STORE".]`,
		)
		expect(useMolecule(myCounterMolecule)).toBeUndefined()
	})
	test(`safe retrieval of state with seekState`, () => {
		const countStates = atomFamily<number, string>({
			key: `count`,
			default: 0,
		})

		const countState = seekState(countStates, `world`)
		expect(countState).toBeUndefined()
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
			{ hi: 0 } satisfies { hi: number },
		)

		const itemMolecules = moleculeFamily({
			key: `item`,
			new: class Item {
				public constructor(transactors: MoleculeTransactors<string>) {
					transactors.join(holdersOfItems)
				}
			},
		})

		const characterMolecules = moleculeFamily({
			key: `character`,
			new: class Character {
				public constructor(transactors: MoleculeTransactors<string>) {
					transactors.join(holdersOfItems)
				}
			},
		})

		const world = makeRootMolecule(`world`)

		const holderMolecule = makeMolecule(world, characterMolecules, `holder-0`)
		const itemMolecule = makeMolecule(world, itemMolecules, `item-0`)

		editRelations(holdersOfItems, (relations) => {
			relations.set({ holder: `holder-0`, item: `item-0` }, { hi: 1 })
		})
		const internalJoin = getJoin(holdersOfItems, Internal.IMPLICIT.STORE)
		expect(internalJoin.molecules.size).toBe(3)
		expect(Internal.IMPLICIT.STORE.molecules.size).toBe(4)

		editRelations(holdersOfItems, (relations) => {
			relations.delete(`item-0`)
		})

		expect(internalJoin.molecules.size).toBe(0)
		expect(Internal.IMPLICIT.STORE.molecules.size).toBe(1)
	})
})
