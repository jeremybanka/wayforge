import type { AtomToken, Logger, TransactionUpdate } from "atom.io"
import {
	atom,
	atomFamily,
	getState,
	runTransaction,
	selector,
	selectorFamily,
	setState,
	subscribe,
	transaction,
} from "atom.io"
import { findState } from "atom.io/ephemeral"
import type { MoleculeToken, MoleculeType } from "atom.io/immortal"
import {
	makeRootMolecule,
	Molecule,
	moleculeFamily,
	seekState,
} from "atom.io/immortal"
import * as Internal from "atom.io/internal"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"
import { vitest } from "vitest"

import type { ContentsOf as $, Parcel } from "~/packages/anvl/src/id"
import { Join } from "~/packages/anvl/src/join"

import * as Utils from "../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 0
let logger: Logger

beforeEach(() => {
	Internal.clearStore(Internal.IMPLICIT.STORE)
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = Internal.IMPLICIT.STORE.logger
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(Utils, `stdout0`)
	vitest.spyOn(Utils, `stdout1`)
	vitest.spyOn(Utils, `stdout2`)
})

type CoreStats = {
	fierce: number
	tough: number
	keen: number
	mystic: number
	deft: number
}
const DEFAULT_CORE_STATS: CoreStats = {
	fierce: 0,
	tough: 0,
	keen: 0,
	mystic: 0,
	deft: 0,
}

type Being = Parcel<
	`Being`,
	CoreStats & {
		name: string
		species: string
		class: string
	}
>

type Item = Parcel<
	`Item`,
	CoreStats & {
		name: string
		desc: string
		value: number
	}
>

describe(`transaction`, () => {
	it(`sets state`, () => {
		const countState = atom<number>({
			key: `count`,
			default: 0,
		})
		const incrementTX = transaction({
			key: `increment`,
			do: ({ get, set }) => {
				const count = get(countState)
				set(countState, count + 1)
			},
		})
		expect(getState(countState)).toEqual(0)
		runTransaction(incrementTX)()
		expect(getState(countState)).toEqual(1)
	})
	it(`creates an atom in a transaction`, () => {
		const pointStates = atomFamily<{ x: number; y: number }, number>({
			key: `point`,
			default: { x: 0, y: 0 },
		})
		const addPoint = transaction<
			(key: number, x: number, y: number) => { x: number; y: number }
		>({
			key: `add_point`,
			do: ({ find, set }, pointKey: number, x: number, y: number) => {
				const point = { x, y }
				set(find(pointStates, pointKey), point)
				return point
			},
		})
		const point = runTransaction(addPoint)(777, 1, 2)
		expect(point).toEqual({ x: 1, y: 2 })
	})
	it(`creates a selector in a transaction`, () => {
		const countState = atom<number>({
			key: `count`,
			default: 0,
		})
		const countPlusSomeValueStates = selectorFamily<number, number>({
			key: `countPlusSomeValue`,
			get:
				(someValue) =>
				({ get }) =>
					get(countState) + someValue,
			set:
				(someValue) =>
				({ set }, newCount) => {
					set(countState, newCount - someValue)
				},
		})
		const addCountPlusSomeValue = transaction<(someValue: number) => void>({
			key: `add_count_plus_some_value`,
			do: ({ find, get, set }, someValue: number) => {
				const countPlusSomeValue = get(find(countPlusSomeValueStates, someValue))
				set(find(countPlusSomeValueStates, someValue), countPlusSomeValue + 1)
			},
		})
		runTransaction(addCountPlusSomeValue)(777)
		expect(getState(findState(countPlusSomeValueStates, 777))).toEqual(778)
	})
	it(`disposes of states in a transaction`, () => {
		const countStates = atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		const doubleStates = selectorFamily<number, string>({
			key: `double`,
			get:
				(id) =>
				({ find, get }) =>
					get(find(countStates, id)) * 2,
		})
		const incrementTX = transaction({
			key: `increment`,
			do: ({ find, get, set, dispose }) => {
				const countState = find(countStates, `my-key`)
				const doubleState = find(doubleStates, `my-key`)
				const double = get(doubleState)
				set(countState, double)
				dispose(doubleState)
				dispose(countState)
			},
		})
		findState(countStates, `my-key`)
		findState(doubleStates, `my-key`)
		runTransaction(incrementTX)()
		expect(seekState(countStates, `my-key`)).toBeUndefined()
		expect(seekState(doubleStates, `my-key`)).toBeUndefined()
	})
	test(`run transaction throws if the transaction doesn't exist`, () => {
		expect(runTransaction({ key: `nonexistent`, type: `transaction` })).toThrow()
	})

	it(`gets and sets state`, () => {
		const beingStates = atomFamily<$<Being>, string>({
			key: `Being`,
			default: {
				name: ``,
				species: ``,
				class: ``,
				...DEFAULT_CORE_STATS,
			},
		})
		const itemStates = atomFamily<$<Item>, string>({
			key: `Item`,
			default: {
				name: ``,
				desc: ``,
				value: 0,
				...DEFAULT_CORE_STATS,
			},
		})
		const globalInventoryState = atom<Join<null, `beingKey`, `itemKey`>>({
			key: `GlobalInventory`,
			default: new Join({ relationType: `1:n` }).from(`beingKey`).to(`itemKey`),
		})
		const beingInventoryStates = selectorFamily<string[], string>({
			key: `BeingInventory`,
			get:
				(beingKey) =>
				({ get }) => {
					const globalInventory = get(globalInventoryState)
					const itemKeys = globalInventory.getRelatedIds(beingKey)
					return itemKeys
				},
		})
		const stealTX = transaction<(thiefKey: string, victimKey: string) => void>({
			key: `steal`,
			do: ({ find, get, set }, thiefKey, victimKey) => {
				const victimInventory = get(find(beingInventoryStates, victimKey))
				const itemKey = victimInventory[0]
				if (itemKey === undefined) throw new Error(`No items to steal!`)
				set(globalInventoryState, (current) => {
					const next = current.set({ beingKey: thiefKey, itemKey })
					return next
				})
			},
		})
		const thiefState = findState(beingStates, `Thief`)
		setState(thiefState, {
			name: `Tarvis Rink`,
			species: `Ave`,
			class: `Egg-Stealer`,
			...DEFAULT_CORE_STATS,
			deft: 2,
		})
		const victimState = findState(beingStates, `Victim`)
		setState(victimState, {
			name: `Roader`,
			species: `Cat`,
			class: `Brigand`,
			...DEFAULT_CORE_STATS,
			tough: 1,
		})
		const prizeState = findState(itemStates, `Prize`)
		setState(findState(itemStates, `Prize`), {
			name: `Chocolate Coin`,
			desc: `A chocolate coin with a hole in the middle.`,
			value: 1,
			...DEFAULT_CORE_STATS,
			keen: 1,
		})
		setState(globalInventoryState, (current) =>
			current.set({ beingKey: victimState.key, itemKey: prizeState.key }),
		)
		const thiefInvState = findState(beingInventoryStates, thiefState.key)
		const victimInvState = findState(beingInventoryStates, victimState.key)
		expect(getState(thiefInvState)).toEqual([])
		expect(getState(victimInvState)).toEqual([prizeState.key])
		const steal = runTransaction(stealTX)
		steal(thiefState.key, victimState.key)
		expect(getState(thiefInvState)).toEqual([prizeState.key])
		expect(getState(victimInvState)).toEqual([])
		expect(logger.warn).not.toHaveBeenCalled()

		try {
			steal(thiefState.key, victimState.key)
		} catch (thrown) {
			expect(thrown).toBeInstanceOf(Error)
			if (thrown instanceof Error) {
				expect(thrown.message).toEqual(`No items to steal!`)
			}
		}
		expect(logger.warn).toHaveBeenCalledTimes(1)

		setState(globalInventoryState, (current) =>
			current.remove({ beingKey: thiefState.key }),
		)
	})
	it(`can be subscribed to`, () => {
		const count1State = atom<number>({
			key: `count1`,
			default: 2,
		})
		const count2State = atom<number>({
			key: `count2`,
			default: 2,
		})
		const count1Plus2State = selector<number>({
			key: `count1Plus2`,
			get: ({ get }) => get(count1State) + get(count2State),
			set: ({ set }, value) => {
				set(count1State, 1)
				set(count2State, value - 1)
			},
		})
		const setAllCounts = transaction({
			key: `setAllCounts`,
			do: ({ set }, value: number) => {
				set(count1State, value)
				set(count2State, value)
			},
		})

		subscribe(setAllCounts, ({ id, ...data }) => {
			Utils.stdout0(`Transaction update:`, data)
			for (const update of data.updates) {
				Utils.stdout1(`Atom update:`, update)
			}
		})
		subscribe(count1Plus2State, (data) => {
			Utils.stdout2(`Selector update:`, data)
		})

		runTransaction(setAllCounts)(3)

		expect(getState(count1State)).toEqual(3)
		expect(Utils.stdout2).toHaveBeenCalledWith(`Selector update:`, {
			oldValue: 4,
			newValue: 5,
		})
		expect(Utils.stdout2).toHaveBeenCalledWith(`Selector update:`, {
			oldValue: 5,
			newValue: 6,
		})
		expect(Utils.stdout0).toHaveBeenCalledWith(`Transaction update:`, {
			type: `transaction_update`,
			key: `setAllCounts`,
			epoch: Number.NaN,
			params: [3],
			output: undefined,
			updates: [
				{
					type: `atom_update`,
					key: `count1`,
					oldValue: 2,
					newValue: 3,
				},
				{
					type: `atom_update`,
					key: `count2`,
					oldValue: 2,
					newValue: 3,
				},
			],
		})
	})
})

describe(`nesting transactions`, () => {
	test(`a transaction can be called from within a transaction`, () => {
		const countState = atom<number>({
			key: `count`,
			default: 0,
		})
		const incrementTX = transaction({
			key: `increment`,
			do: ({ get, set }) => {
				const count = get(countState)
				set(countState, count + 1)
			},
		})
		const incrementTwiceTX = transaction({
			key: `incrementTwice`,
			do: ({ get, set }) => {
				const count = get(countState)
				set(countState, count + 1)
				runTransaction(incrementTX)()
				set(countState, (prev) => prev + 1)
			},
		})
		runTransaction(incrementTwiceTX)()
		expect(getState(countState)).toEqual(3)
	})
	test(`mutable atoms can be modified in a lower transaction`, () => {
		const coffeeQuantityState = atom<number>({
			key: `coffeeQuantity`,
			default: 0,
		})
		const shoppingListState = atom<SetRTX<string>, SetRTXJson<string>>({
			key: `shoppingList`,
			default: () => new SetRTX<string>(),
			toJson: (set) => set.toJSON(),
			fromJson: (json) => SetRTX.fromJSON(json),
			mutable: true,
		})
		const addItemToShoppingListTX = transaction<(item: string) => void>({
			key: `addItemToShoppingList`,
			do: ({ set }, item) => {
				set(shoppingListState, (current) => current.add(item))
			},
		})
		const addCoffeeCreamerIfNeededTX = transaction<() => void>({
			key: `addCoffeeCreamerIfNeeded`,
			do: ({ get, set }) => {
				const shoppingList = get(shoppingListState)
				if (shoppingList.has(`coffee`)) {
					set(shoppingListState, (current) => current.add(`coffee creamer`))
				}
			},
		})
		const refreshShoppingListTX = transaction<() => void>({
			key: `refreshShoppingList`,
			do: ({ get, set }) => {
				const coffeeQuantity = get(coffeeQuantityState)
				if (coffeeQuantity < 1) {
					set(coffeeQuantityState, 1)
					runTransaction(addItemToShoppingListTX)(`coffee`)
				}
				runTransaction(addCoffeeCreamerIfNeededTX)()
			},
		})
		expect(getState(shoppingListState)).toEqual(new SetRTX<string>())
		runTransaction(refreshShoppingListTX)()
		expect(getState(shoppingListState)).toEqual(
			new SetRTX<string>([`coffee`, `coffee creamer`]),
		)
	})
})

describe(`precise scope of transactions`, () => {
	test(`using setState during a transaction does not add to the transaction's updates`, () => {
		const countState = atom<number>({
			key: `count`,
			default: 0,
		})
		const favoriteWordState = atom<string>({
			key: `favoriteWord`,
			default: ``,
		})
		const incrementTX = transaction({
			key: `increment`,
			do: ({ get, set }) => {
				const count = get(countState)
				set(countState, count + 1)
				setState(favoriteWordState, `cheese`)
			},
		})
		const validate = {
			update: (update: TransactionUpdate<any>) => {
				expect(update.updates).toHaveLength(1)
				expect(`key` in update.updates[0]).toBe(true)
				if (`key` in update.updates[0]) {
					expect(update.updates[0].key).toEqual(`count`)
				}
			},
		}
		vitest.spyOn(validate, `update`)
		subscribe(incrementTX, validate.update)
		runTransaction(incrementTX)()
		expect(validate.update).toHaveBeenCalledTimes(1)
		expect(getState(countState)).toEqual(1)
		expect(getState(favoriteWordState)).toEqual(`cheese`)
	})
})

describe(`reversibility of transactions`, () => {
	test(`a transaction that fails does does not create a state`, () => {
		const countStates = atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		const incrementTX = transaction({
			key: `increment`,
			do: ({ find, get, set }) => {
				const countState = find(countStates, `my-key`)
				const count = get(countState)
				set(countState, count + 1)
				throw new Error(`fail`)
			},
		})
		let caught: unknown
		try {
			runTransaction(incrementTX)()
		} catch (thrown) {
			caught = thrown
		}
		expect(caught).toBeInstanceOf(Error)
		expect(Internal.IMPLICIT.STORE.valueMap.get(`count("my-key")`)).toBe(
			undefined,
		)
	})
	test(`a transaction that fails does does not dispose of a state`, () => {
		const countStates = atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		findState(countStates, `my-key`)
		const incrementTX = transaction({
			key: `increment`,
			do: ({ find, dispose }) => {
				const countState = find(countStates, `my-key`)
				dispose(countState)
				throw new Error(`fail`)
			},
		})
		let caught: unknown
		try {
			runTransaction(incrementTX)()
		} catch (thrown) {
			caught = thrown
		}
		expect(caught).toBeInstanceOf(Error)
		expect(seekState(countStates, `my-key`)).toBeDefined()
	})
	test(`a transaction that fails does does not create a molecule`, () => {
		const hpAtoms = atomFamily<number, string>({
			key: `hp`,
			default: 0,
		})
		const unitMolecules = moleculeFamily({
			key: `unit`,
			new: (store) =>
				class Unit extends Molecule<string> {
					public hpState: AtomToken<number>
					public constructor(
						context: Molecule<any>[],
						public readonly id: string,
						public readonly hp: number,
					) {
						super(store, context, id)
						this.hpState = this.bond(hpAtoms)
						setState(this.hpState, this.hp)
					}
				},
		})
		type Unit = MoleculeType<typeof unitMolecules>
		const world = makeRootMolecule(`world`)
		const spawnUnitsTX = transaction<
			(...args: number[]) => MoleculeToken<string, Unit, [hp: number]>[]
		>({
			key: `spawnUnits`,
			do: ({ make }, ...args: number[]) => {
				const units = args.map((hp) =>
					make(world, unitMolecules, Internal.arbitrary(), hp),
				)
				throw new Error(`fail`)
				// return units
			},
		})
		let caught: unknown
		try {
			runTransaction(spawnUnitsTX)(1, 2, 3)
		} catch (thrown) {
			caught = thrown
		}
		expect(caught).toBeInstanceOf(Error)
		expect(Internal.IMPLICIT.STORE.molecules.size).toBe(1)
	})
})
