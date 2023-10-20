import { vitest } from "vitest"

import type { ContentsOf as $, Parcel } from "~/packages/anvl/src/id"
import { Join } from "~/packages/anvl/src/join"

import {
	atom,
	atomFamily,
	getState,
	runTransaction,
	selector,
	selectorFamily,
	setLogLevel,
	setState,
	subscribe,
	subscribeToTransaction,
	transaction,
} from "atom.io"
import * as __INTERNAL__ from "atom.io/internal"
import * as UTIL from "./__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 1
setLogLevel(LOG_LEVELS[CHOOSE])
const logger = __INTERNAL__.IMPLICIT.STORE.config.logger ?? console

beforeEach(() => {
	__INTERNAL__.clearStore()
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(UTIL, `stdout`)
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
			get: (beingKey) => ({ get }) => {
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
		expect(logger.error).not.toHaveBeenCalled()

		try {
			steal(thiefState.key, victimState.key)
		} catch (thrown) {
			expect(thrown).toBeInstanceOf(Error)
			if (thrown instanceof Error) {
				expect(thrown.message).toEqual(`No items to steal!`)
			}
		}
		expect(logger.error).toHaveBeenCalledTimes(1)

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

		subscribeToTransaction(setAllCounts, (data) => {
			UTIL.stdout(`Transaction update:`, data)
			for (const update of data.atomUpdates) {
				UTIL.stdout(`Atom update:`, update)
			}
		})
		subscribe(count1Plus2State, (data) => {
			UTIL.stdout(`Selector update:`, data)
		})

		runTransaction(setAllCounts)(3)

		expect(getState(count1State)).toEqual(3)
		expect(UTIL.stdout).toHaveBeenCalledWith(`Selector update:`, {
			oldValue: 4,
			newValue: 5,
		})
		expect(UTIL.stdout).toHaveBeenCalledWith(`Selector update:`, {
			oldValue: 5,
			newValue: 6,
		})
		expect(UTIL.stdout).toHaveBeenCalledWith(`Transaction update:`, {
			key: `setAllCounts`,
			params: [3],
			output: undefined,
			atomUpdates: [
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
