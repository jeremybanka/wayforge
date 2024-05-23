import type { AtomToken, Logger } from "atom.io"
import { atomFamily, disposeState, getState, setState } from "atom.io"
import { editRelations, getJoin, join } from "atom.io/data"
import { findState } from "atom.io/ephemeral"
import type { MoleculeToken } from "atom.io/immortal"
import {
	makeMolecule,
	makeRootMolecule,
	Molecule,
	moleculeFamily,
	seekState,
	useMolecule,
} from "atom.io/immortal"
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
			new: (store) =>
				class Counter extends Molecule<string> {
					public $count: AtomToken<number>
					public constructor(
						context: Molecule<any>[],
						token: MoleculeToken<string, any, any>,
					) {
						super(store, context, token)
						this.$count = this.bond(countStates)
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
		const world = makeRootMolecule(`world`)
		const countStates = atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		useMolecule(world)?.bond(countStates)
		let countState = seekState(countStates, `world`)
		expect(countState).toStrictEqual({
			key: `count("world")`,
			type: `atom`,
			family: {
				key: `count`,
				subKey: `"world"`,
			},
		})
		disposeState(world)
		countState = seekState(countStates, `world`)
		expect(countState).toBeUndefined()
	})
	test(`hierarchical ownership of molecules`, () => {
		const world = new Molecule(Internal.IMPLICIT.STORE, undefined, {
			key: `world`,
			type: `molecule`,
		})
		const expStates = atomFamily<number, string>({
			key: `exp`,
			default: 0,
		})
		const characterMolecules = moleculeFamily({
			key: `character`,
			new: (store) =>
				class Character extends Molecule<string> {
					public expState: AtomToken<number>
					public constructor(
						context: Molecule<any>[],
						token: MoleculeToken<string, Character, []>,
					) {
						super(store, context, token)
						this.expState = this.bond(expStates)
					}
				},
		})
		const myCharacterMolecule = makeMolecule(
			world,
			characterMolecules,
			`my-character`,
		)
		const myCharacter = useMolecule(myCharacterMolecule)
		if (!myCharacter) {
			throw new Error(`myCharacter is undefined`)
		}
		expect(getState(myCharacter.expState)).toBe(0)
		setState(myCharacter.expState, 1)
		expect(getState(myCharacter.expState)).toBe(1)
		disposeState(myCharacter.token)
		expect(() =>
			getState(myCharacter.expState),
		).toThrowErrorMatchingInlineSnapshot(
			`[Error: Atom "exp("my-character")" not found in store "IMPLICIT_STORE".]`,
		)
	})
	test(`transfer of ownership of molecules`, () => {
		const world = new Molecule(Internal.IMPLICIT.STORE, undefined, {
			key: `world`,
			type: `molecule`,
		})
		const dmgStates = atomFamily<number, string>({
			key: `dmg`,
			default: 0,
		})
		const character0 = world.spawn(`character-0`)
		const character1 = world.spawn(`character-1`)
		const weaponA = character0.spawn(`weapon-a`)
		const dmgState = weaponA.bond(dmgStates)
		character1.claim(weaponA)
		disposeState(character0.token)
		expect(getState(dmgState)).toBe(0)
	})
	test(`won't make a molecule a child of itself`, () => {
		const world = new Molecule(Internal.IMPLICIT.STORE, undefined, {
			key: `world`,
			type: `molecule`,
		})
		world.claim(world)
		expect(world.below.length).toBe(0)
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
			new: (store) =>
				class Item extends Molecule<string> {
					public constructor(
						context: Molecule<any>[],
						token: MoleculeToken<string, Item, []>,
					) {
						super(store, context, token)
						this.join(holdersOfItems)
					}
				},
		})

		const characterMolecules = moleculeFamily({
			key: `character`,
			new: (store) =>
				class Character extends Molecule<string> {
					public constructor(
						context: Molecule<any>[],
						token: MoleculeToken<string, Character, []>,
					) {
						super(store, context, token)
						this.join(holdersOfItems)
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
		console.log(Internal.IMPLICIT.STORE.molecules.keys())
		expect(Internal.IMPLICIT.STORE.molecules.size).toBe(1)
	})
})
