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
import { UList } from "atom.io/transceivers/u-list"
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
		const countAtom = atom<number>({
			key: `count`,
			default: 0,
		})
		const incrementTX = transaction({
			key: `increment`,
			do: ({ get, set }) => {
				const count = get(countAtom)
				set(countAtom, count + 1)
			},
		})
		expect(getState(countAtom)).toEqual(0)
		runTransaction(incrementTX)()
		expect(getState(countAtom)).toEqual(1)
	})
	it(`resets state`, () => {
		const countAtom = atom<number>({
			key: `count`,
			default: 0,
		})
		const resetTX = transaction({
			key: `reset`,
			do: ({ reset }) => {
				reset(countAtom)
			},
		})
		expect(getState(countAtom)).toEqual(0)
		setState(countAtom, 1)
		expect(getState(countAtom)).toEqual(1)
		runTransaction(resetTX)()
		expect(getState(countAtom)).toEqual(0)
	})
	it(`creates an atom in a transaction`, () => {
		const pointAtoms = atomFamily<{ x: number; y: number }, number>({
			key: `point`,
			default: { x: 0, y: 0 },
		})
		const addPoint = transaction<
			(key: number, x: number, y: number) => { x: number; y: number }
		>({
			key: `add_point`,
			do: ({ find, set }, pointKey: number, x: number, y: number) => {
				const point = { x, y }
				set(find(pointAtoms, pointKey), point)
				return point
			},
		})
		const point = runTransaction(addPoint)(777, 1, 2)
		expect(point).toEqual({ x: 1, y: 2 })
	})
	it(`creates a selector in a transaction`, () => {
		const countAtom = atom<number>({
			key: `count`,
			default: 0,
		})
		const countPlusSomeValueSelectors = selectorFamily<number, number>({
			key: `countPlusSomeValue`,
			get:
				(someValue) =>
				({ get }) =>
					get(countAtom) + someValue,
			set:
				(someValue) =>
				({ set }, newCount) => {
					set(countAtom, newCount - someValue)
				},
		})
		const addCountPlusSomeValue = transaction<(someValue: number) => void>({
			key: `add_count_plus_some_value`,
			do: ({ find, get, set }, someValue: number) => {
				const countPlusSomeValue = get(
					find(countPlusSomeValueSelectors, someValue),
				)
				set(find(countPlusSomeValueSelectors, someValue), countPlusSomeValue + 1)
			},
		})
		runTransaction(addCountPlusSomeValue)(777)
		expect(getState(findState(countPlusSomeValueSelectors, 777))).toEqual(778)
	})
	it(`disposes of states in a transaction`, () => {
		const countAtoms = atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		const doubleSelectors = selectorFamily<number, string>({
			key: `double`,
			get:
				(id) =>
				({ find, get }) =>
					get(find(countAtoms, id)) * 2,
		})
		const incrementTX = transaction({
			key: `increment`,
			do: ({ find, get, set, dispose }) => {
				const countState = find(countAtoms, `my-key`)
				const doubleState = find(doubleSelectors, `my-key`)
				const double = get(doubleState)
				set(countState, double)
				dispose(doubleState)
				dispose(countState)
			},
		})
		findState(countAtoms, `my-key`)
		findState(doubleSelectors, `my-key`)
		runTransaction(incrementTX)()
		expect(
			Internal.seekInStore(Internal.IMPLICIT.STORE, countAtoms, `my-key`),
		).toBeUndefined()
		expect(
			Internal.seekInStore(Internal.IMPLICIT.STORE, doubleSelectors, `my-key`),
		).toBeUndefined()
	})
	test(`run transaction throws if the transaction doesn't exist`, () => {
		expect(runTransaction({ key: `nonexistent`, type: `transaction` })).toThrow()
	})

	it(`can be subscribed to`, () => {
		const count1Atom = atom<number>({
			key: `count1`,
			default: 2,
		})
		const count2Atom = atom<number>({
			key: `count2`,
			default: 2,
		})
		const count1Plus2Selector = selector<number>({
			key: `count1Plus2`,
			get: ({ get }) => get(count1Atom) + get(count2Atom),
			set: ({ set }, value) => {
				set(count1Atom, 1)
				set(count2Atom, value - 1)
			},
		})
		const setAllCounts = transaction({
			key: `setAllCounts`,
			do: ({ set }, value: number) => {
				set(count1Atom, value)
				set(count2Atom, value)
			},
		})

		subscribe(setAllCounts, ({ id, timestamp, ...data }) => {
			const redacted = {
				...data,
				subEvents: data.subEvents.map((update) => {
					if (update.type === `atom_update`) {
						const { timestamp: _, ...redactedAtomUpdateEvent } = update
						return redactedAtomUpdateEvent
					}
					return update
				}),
			}
			Utils.stdout0(`Transaction update:`, redacted)
			for (const update of redacted.subEvents) {
				Utils.stdout1(`Atom update:`, update)
			}
		})
		subscribe(count1Plus2Selector, (data) => {
			Utils.stdout2(`Selector update:`, data)
		})

		runTransaction(setAllCounts)(3)

		expect(getState(count1Atom)).toEqual(3)
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
			token: {
				key: `setAllCounts`,
				type: `transaction`,
			},
			epoch: Number.NaN,
			params: [3],
			output: undefined,
			subEvents: [
				{
					type: `atom_update`,
					token: {
						type: `atom`,
						key: `count1`,
					},
					update: {
						oldValue: 2,
						newValue: 3,
					},
				},
				{
					type: `atom_update`,
					token: {
						type: `atom`,
						key: `count2`,
					},
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
		const countAtom = atom<number>({
			key: `count`,
			default: 0,
		})
		const incrementTX = transaction({
			key: `increment`,
			do: ({ get, set }) => {
				const count = get(countAtom)
				set(countAtom, count + 1)
			},
		})
		const incrementTwiceTX = transaction({
			key: `incrementTwice`,
			do: ({ get, set }) => {
				const count = get(countAtom)
				set(countAtom, count + 1)
				runTransaction(incrementTX)()
				set(countAtom, (prev) => prev + 1)
			},
		})
		runTransaction(incrementTwiceTX)()
		expect(getState(countAtom)).toEqual(3)
	})
	test(`mutable atoms can be modified in a lower transaction`, () => {
		const coffeeQuantityAtom = atom<number>({
			key: `coffeeQuantity`,
			default: 0,
		})
		const shoppingListAtom = mutableAtom<UList<string>>({
			key: `shoppingList`,
			class: UList,
		})
		const addItemToShoppingListTX = transaction<(item: string) => void>({
			key: `addItemToShoppingList`,
			do: ({ set }, item) => {
				set(shoppingListAtom, (current) => current.add(item))
			},
		})
		const addCoffeeCreamerIfNeededTX = transaction<() => void>({
			key: `addCoffeeCreamerIfNeeded`,
			do: ({ get, set }) => {
				const shoppingList = get(shoppingListAtom)
				if (shoppingList.has(`coffee`)) {
					set(shoppingListAtom, (current) => current.add(`coffee creamer`))
				}
			},
		})
		const refreshShoppingListTX = transaction<() => void>({
			key: `refreshShoppingList`,
			do: ({ get, set }) => {
				const coffeeQuantity = get(coffeeQuantityAtom)
				if (coffeeQuantity < 1) {
					set(coffeeQuantityAtom, 1)
					runTransaction(addItemToShoppingListTX)(`coffee`)
				}
				runTransaction(addCoffeeCreamerIfNeededTX)()
			},
		})
		expect(getState(shoppingListAtom)).toEqual(new UList<string>())
		runTransaction(refreshShoppingListTX)()
		expect(getState(shoppingListAtom)).toEqual(
			new UList<string>([`coffee`, `coffee creamer`]),
		)
	})
})

describe(`precise scope of transactions`, () => {
	test(`using setState during a transaction does not add to the transaction's updates`, () => {
		const countAtom = atom<number>({
			key: `count`,
			default: 0,
		})
		const favoriteWordAtom = atom<string>({
			key: `favoriteWord`,
			default: ``,
		})
		const incrementTX = transaction({
			key: `increment`,
			do: ({ get, set }) => {
				const count = get(countAtom)
				set(countAtom, count + 1)
				setState(favoriteWordAtom, `cheese`)
			},
		})
		const validate = {
			update: (update: TransactionOutcomeEvent<any>) => {
				expect(update.subEvents).toHaveLength(1)
				expect(`token` in update.subEvents[0]).toBe(true)
				if (`token` in update.subEvents[0]) {
					expect(update.subEvents[0].token.key).toEqual(`count`)
				}
			},
		}
		vitest.spyOn(validate, `update`)
		subscribe(incrementTX, validate.update)
		runTransaction(incrementTX)()
		expect(validate.update).toHaveBeenCalledTimes(1)
		expect(getState(countAtom)).toEqual(1)
		expect(getState(favoriteWordAtom)).toEqual(`cheese`)
	})
})

describe(`reversibility of transactions`, () => {
	test(`a transaction that fails does does not create a state`, () => {
		const countAtoms = atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		const incrementTX = transaction({
			key: `increment`,
			do: ({ find, get, set }) => {
				const countState = find(countAtoms, `my-key`)
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
			Internal.seekInStore(Internal.IMPLICIT.STORE, countAtoms, `my-key`),
		).toBeUndefined()
	})
	test(`a transaction that fails does does not dispose of a state`, () => {
		const countAtoms = atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		getState(countAtoms, `my-key`)
		const incrementTX = transaction({
			key: `increment`,
			do: ({ find, dispose }) => {
				const countState = find(countAtoms, `my-key`)
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
			Internal.seekInStore(Internal.IMPLICIT.STORE, countAtoms, `my-key`),
		).toBeDefined()
	})
})
