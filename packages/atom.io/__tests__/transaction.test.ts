import { vitest } from "vitest"

import type { ContentsOf as $, Parcel } from "~/packages/anvl/src/id"
import { Join } from "~/packages/anvl/src/join"

import type { Logger } from "atom.io"
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
import * as Internal from "atom.io/internal"
import * as Utils from "./__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 3
let logger: Logger

beforeEach(() => {
	Internal.clearStore(Internal.IMPLICIT.STORE)
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = Internal.IMPLICIT.STORE.logger
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(Utils, `stdout`)
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
	it(`creates atom in a transaction`, () => {
		const findPointState = atomFamily<{ x: number; y: number }, number>({
			key: `point`,
			default: { x: 0, y: 0 },
		})
		const addPoint = transaction<
			(key: number, x: number, y: number) => { x: number; y: number }
		>({
			key: `add_point`,
			do: ({ set }, pointKey: number, x: number, y: number) => {
				const point = { x, y }
				set(findPointState(pointKey), point)
				return point
			},
		})
		const point = runTransaction(addPoint)(777, 1, 2)
		expect(point).toEqual({ x: 1, y: 2 })
	})
	test(`run transaction throws if the transaction doesn't exist`, () => {
		expect(runTransaction({ key: `nonexistent`, type: `transaction` })).toThrow()
	})

	it(`gets and sets state`, () => {
		const findBeingState = atomFamily<$<Being>, string>({
			key: `Being`,
			default: {
				name: ``,
				species: ``,
				class: ``,
				...DEFAULT_CORE_STATS,
			},
		})
		const findItemState = atomFamily<$<Item>, string>({
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
		const findBeingInventoryState = selectorFamily<string[], string>({
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
			do: ({ get, set }, thiefKey, victimKey) => {
				const victimInventory = get(findBeingInventoryState(victimKey))
				const itemKey = victimInventory[0]
				if (itemKey === undefined) throw new Error(`No items to steal!`)
				set(globalInventoryState, (current) => {
					const next = current.set({ beingKey: thiefKey, itemKey })
					return next
				})
			},
		})
		const thiefState = findBeingState(`Thief`)
		setState(thiefState, {
			name: `Tarvis Rink`,
			species: `Ave`,
			class: `Egg-Stealer`,
			...DEFAULT_CORE_STATS,
			deft: 2,
		})
		const victimState = findBeingState(`Victim`)
		setState(victimState, {
			name: `Roader`,
			species: `Cat`,
			class: `Brigand`,
			...DEFAULT_CORE_STATS,
			tough: 1,
		})
		const prizeState = findItemState(`Prize`)
		setState(findItemState(`Prize`), {
			name: `Chocolate Coin`,
			desc: `A chocolate coin with a hole in the middle.`,
			value: 1,
			...DEFAULT_CORE_STATS,
			keen: 1,
		})
		setState(globalInventoryState, (current) =>
			current.set({ beingKey: victimState.key, itemKey: prizeState.key }),
		)
		const thiefInvState = findBeingInventoryState(thiefState.key)
		const victimInvState = findBeingInventoryState(victimState.key)
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

		subscribe(setAllCounts, (data) => {
			Utils.stdout(`Transaction update:`, data)
			for (const update of data.updates) {
				Utils.stdout(`Atom update:`, update)
			}
		})
		subscribe(count1Plus2State, (data) => {
			Utils.stdout(`Selector update:`, data)
		})

		runTransaction(setAllCounts)(3)

		expect(getState(count1State)).toEqual(3)
		expect(Utils.stdout).toHaveBeenCalledWith(`Selector update:`, {
			oldValue: 4,
			newValue: 5,
		})
		expect(Utils.stdout).toHaveBeenCalledWith(`Selector update:`, {
			oldValue: 5,
			newValue: 6,
		})
		expect(Utils.stdout).toHaveBeenCalledWith(`Transaction update:`, {
			key: `setAllCounts`,
			params: [3],
			output: undefined,
			updates: [
				{
					key: `count1`,
					oldValue: 2,
					newValue: 3,
				},

				{
					key: `count2`,
					oldValue: 2,
					newValue: 3,
				},
			],
		})
	})

	it(`can create an atom in a transaction`, () => {
		const findPointState = atomFamily<{ x: number; y: number }, number>({
			key: `point`,
			default: { x: 0, y: 0 },
		})

		const addPoint = transaction<
			(key: number, x: number, y: number) => { x: number; y: number }
		>({
			key: `add_point`,
			do: ({ set }, pointKey: number, x: number, y: number) => {
				const point = { x, y }
				set(findPointState(pointKey), point)
				return point
			},
		})

		const point = runTransaction(addPoint)(777, 1, 2)
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
				set(countState, (count) => count + 1)
			},
		})
		runTransaction(incrementTwiceTX)()
		expect(getState(countState)).toEqual(3)
	})
})
