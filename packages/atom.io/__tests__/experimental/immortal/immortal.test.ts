import type { AtomToken, Logger } from "atom.io"
import { atomFamily, getState, setState } from "atom.io"
import { editRelations, findRelations, getJoin, join } from "atom.io/data"
import { findState } from "atom.io/ephemeral"
import { Molecule, seekState } from "atom.io/immortal"
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
		const world = new Molecule(Internal.IMPLICIT.STORE, undefined, `world`)
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
		const world = new Molecule(Internal.IMPLICIT.STORE, undefined, `world`)
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
		const world = new Molecule(Internal.IMPLICIT.STORE, undefined, `world`)
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
		const world = new Molecule(Internal.IMPLICIT.STORE, undefined, `world`)
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
		const world = new Molecule(Internal.IMPLICIT.STORE, undefined, `world`)
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

		const world = new Molecule(Internal.IMPLICIT.STORE, undefined, `world`)
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
		const world = new Molecule(Internal.IMPLICIT.STORE, undefined, `world`)
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
		const $$damage = atomFamily<number, string>({
			key: `damage`,
			default: 0,
		})
		const holdersOfItems = join({
			key: `holdersOfItems`,
			between: [`holder`, `item`],
			cardinality: `1:n`,
		})
		class Being extends Molecule<string> {
			public $maxHealth: AtomToken<number>
			public $health: AtomToken<number>
			public $armor: AtomToken<number>
			public constructor(
				public readonly id: string,
				public readonly baseHealth: number,
				public readonly baseArmor: number,
			) {
				super(world.store, world, id)
				this.$maxHealth = this.bond($$maxHealth)
				this.$health = this.bond($$health)
				this.$armor = this.bond($$armor)
				this.join(holdersOfItems)

				setState(this.$health, this.baseHealth)
				setState(this.$maxHealth, this.baseHealth)
				setState(this.$armor, this.baseArmor)
			}
		}
		class Item extends Molecule<string> {
			public $damage: AtomToken<number>
			public constructor(
				public readonly id: string,
				public readonly baseDamage: number,
			) {
				super(world.store, world, id)
				this.join(holdersOfItems)
				this.$damage = this.bond($$damage)
				setState(this.$damage, this.baseDamage)
			}
		}
		const me = new Being(`me`, 100, 10)
		const itemsIHold = findRelations(holdersOfItems, `me`).itemKeysOfHolder
		expect(getState(itemsIHold)).toEqual([])
		const sword = new Item(`sword`, 10)
		editRelations(holdersOfItems, (relations) => {
			relations.set({ holder: `me`, item: `sword` })
			me.claim(sword)
		})
		expect(getState(itemsIHold)).toEqual([`sword`])
		const holderOfSword = findRelations(holdersOfItems, `sword`).holderKeyOfItem
		expect(getState(holderOfSword)).toEqual(`me`)
		setState(sword.$damage, 5)
		expect(getState(sword.$damage)).toEqual(5)
		expect(getState(me.$health)).toEqual(100)
		me.dispose()
		console.log(
			`MOLECULES--------------------------------------------------------`,
		)
		console.log(Internal.IMPLICIT.STORE.molecules)
		console.log(
			`ATOMS------------------------------------------------------------`,
		)
		console.log(Internal.IMPLICIT.STORE.atoms)
		console.log(
			`VALUE MAP--------------------------------------------------------`,
		)
		console.log(Internal.IMPLICIT.STORE.valueMap)
		console.log(
			`JOIN-------------------------------------------------------------`,
		)
		console.log(getJoin(holdersOfItems, Internal.IMPLICIT.STORE))
	})
})
