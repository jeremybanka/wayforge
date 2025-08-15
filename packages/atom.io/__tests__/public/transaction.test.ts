import type { Logger, TransactionOutcomeEvent } from "atom.io"
import {
	atom,
	atomFamily,
	findState,
	getState,
	mutableAtom,
	runTransaction,
	selector,
	selectorFamily,
	setState,
	subscribe,
	transaction,
} from "atom.io"
import * as Internal from "atom.io/internal"
import { SetRTX } from "atom.io/transceivers/set-rtx"
import { vitest } from "vitest"

import * as Utils from "../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 2
let logger: Logger

beforeEach(() => {
	Internal.clearStore(Internal.IMPLICIT.STORE)
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = Internal.IMPLICIT.STORE.logger = Utils.createNullLogger()
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(Utils, `stdout0`)
	vitest.spyOn(Utils, `stdout1`)
	vitest.spyOn(Utils, `stdout2`)
})

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
	it(`resets state`, () => {
		const countState = atom<number>({
			key: `count`,
			default: 0,
		})
		const resetTX = transaction({
			key: `increment`,
			do: ({ reset }) => {
				reset(countState)
			},
		})
		expect(getState(countState)).toEqual(0)
		setState(countState, 1)
		expect(getState(countState)).toEqual(1)
		runTransaction(resetTX)()
		expect(getState(countState)).toEqual(0)
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
		expect(
			Internal.seekInStore(Internal.IMPLICIT.STORE, countStates, `my-key`),
		).toBeUndefined()
		expect(
			Internal.seekInStore(Internal.IMPLICIT.STORE, doubleStates, `my-key`),
		).toBeUndefined()
	})
	test(`run transaction throws if the transaction doesn't exist`, () => {
		expect(runTransaction({ key: `nonexistent`, type: `transaction` })).toThrow()
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
			const redacted = {
				...data,
				updates: data.updates.map((update) => {
					if (update.type === `atom_update`) {
						const { timestamp: _, ...redactedAtomUpdateEvent } = update
						return redactedAtomUpdateEvent
					}
					return update
				}),
			}
			Utils.stdout0(`Transaction update:`, redacted)
			for (const update of redacted.updates) {
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
			type: `transaction_outcome`,
			key: `setAllCounts`,
			epoch: Number.NaN,
			params: [3],
			output: undefined,
			updates: [
				{
					type: `atom_update`,
					key: `count1`,
					update: {
						oldValue: 2,
						newValue: 3,
					},
				},
				{
					type: `atom_update`,
					key: `count2`,
					update: {
						oldValue: 2,
						newValue: 3,
					},
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
		const shoppingListState = mutableAtom<SetRTX<string>>({
			key: `shoppingList`,
			class: SetRTX,
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
			update: (update: TransactionOutcomeEvent<any>) => {
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
		expect(
			Internal.seekInStore(Internal.IMPLICIT.STORE, countStates, `my-key`),
		).toBeUndefined()
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
		expect(
			Internal.seekInStore(Internal.IMPLICIT.STORE, countStates, `my-key`),
		).toBeDefined()
	})
})
