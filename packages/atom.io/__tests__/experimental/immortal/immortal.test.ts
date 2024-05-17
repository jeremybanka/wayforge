import type { AtomToken, Logger } from "atom.io"
import { atomFamily, getState, setState } from "atom.io"
import { editRelations, findRelations, getJoin, join } from "atom.io/data"
import { findState } from "atom.io/ephemeral"
import { seekState } from "atom.io/immortal"
import * as Internal from "atom.io/internal"

import { Molecule } from "~/packages/atom.io/immortal/src/molecule"

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
		const world = new Molecule(`world`)
		const countStates = atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		const countState = world.bond(countStates)
		expect(getState(countState)).toBe(0)
		setState(countState, 1)
		expect(getState(countState)).toBe(1)
		world.dispose()
		expect(() => getState(countState)).toThrowErrorMatchingInlineSnapshot(
			`[Error: Atom "count("world")" not found in store "IMPLICIT_STORE".]`,
		)
	})
	test(`safe retrieval of state with seekState`, () => {
		const world = new Molecule(`world`)
		const countStates = atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		world.bond(countStates)
		let countState = seekState(countStates, `world`)
		expect(countState).toStrictEqual({
			key: `count("world")`,
			type: `atom`,
			family: {
				key: `count`,
				subKey: `"world"`,
			},
		})
		world.dispose()
		countState = seekState(countStates, `world`)
		expect(countState).toBeUndefined()
	})
	test(`hierarchical ownership of molecules`, () => {
		const world = new Molecule(`world`)
		const expStates = atomFamily<number, string>({
			key: `exp`,
			default: 0,
		})
		const myCharacter = world.spawn(`my-character`)
		const expState = myCharacter.bond(expStates)
		expect(getState(expState)).toBe(0)
		setState(expState, 1)
		expect(getState(expState)).toBe(1)
		world.dispose()
		expect(() => getState(expState)).toThrowErrorMatchingInlineSnapshot(
			`[Error: Atom "exp("my-character")" not found in store "IMPLICIT_STORE".]`,
		)
	})
	test(`transfer of ownership of molecules`, () => {
		const world = new Molecule(`world`)
		const dmgStates = atomFamily<number, string>({
			key: `dmg`,
			default: 0,
		})
		const character0 = world.spawn(`character-0`)
		const character1 = world.spawn(`character-1`)
		const weaponA = character0.spawn(`weapon-a`)
		const dmgState = weaponA.bond(dmgStates)
		character1.claim(weaponA)
		character0.dispose()
		expect(getState(dmgState)).toBe(0)
	})
	test(`won't make a molecule a child of itself`, () => {
		const world = new Molecule(`world`)
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

		const world = new Molecule(`world`)
		const holder = world.spawn(`character-0`)
		const item = world.spawn(`item-0`)
		holder.join(holdersOfItems)
		item.join(holdersOfItems)

		editRelations(holdersOfItems, (relations) => {
			relations.set({ holder: `character-0`, item: `item-0` }, { hi: 1 })
		})

		editRelations(holdersOfItems, (relations) => {
			relations.delete(`item-0`)
		})

		const internalJoin = getJoin(holdersOfItems, world.store)

		expect(internalJoin.molecules.size).toBe(0)
	})
})

describe(`practical example of immortal`, () => {
	test(`RPG`, () => {
		const world = new Molecule(`world`)
		const $$maxHealth = atomFamily<number, string>({
			key: `maxHealth`,
			default: 100,
		})
		const $$health = atomFamily<number, string>({
			key: `health`,
			default: 0,
		})
		const $$armor = atomFamily<number, string>({
			key: `armor`,
			default: 0,
		})
		const holdersOfItems = join({
			key: `holdersOfItems`,
			between: [`holder`, `item`],
			cardinality: `1:n`,
		})
		class Being extends Molecule {
			public $maxHealth: AtomToken<number>
			public $health: AtomToken<number>
			public $armor: AtomToken<number>
			public constructor(public readonly id: string) {
				super(id, [world])
				this.$maxHealth = this.bond($$maxHealth)
				this.$health = this.bond($$health)
				this.$armor = this.bond($$armor)
				this.join(holdersOfItems)
			}
		}
		const me = new Being(`me`)
		const itemsIHold = findRelations(holdersOfItems, `me`).itemKeysOfHolder
	})
})