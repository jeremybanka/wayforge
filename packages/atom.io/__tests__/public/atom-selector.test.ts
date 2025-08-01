import type { Logger } from "atom.io"
import {
	atom,
	getState,
	resetState,
	selector,
	setState,
	subscribe,
} from "atom.io"
import * as Internal from "atom.io/internal"
import { vitest } from "vitest"

import * as Utils from "../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 2

let logger: Logger

beforeEach(() => {
	Internal.clearStore(Internal.IMPLICIT.STORE)
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = Internal.IMPLICIT.STORE.logger
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(Utils, `stdout`)
	vitest.spyOn(Utils, `stdout0`)
})

describe(`atom`, () => {
	it(`can be modified and retrieved`, () => {
		const count = atom<number>({
			key: `count`,
			default: 0,
		})
		setState(count, 1)
		expect(getState(count)).toBe(1)
		setState(count, 2)
		expect(getState(count)).toBe(2)
	})
	it(`can be subscribed to`, () => {
		const name = atom<string>({
			key: `name`,
			default: `John`,
		})
		subscribe(name, Utils.stdout)
		setState(name, `Jane`)
		expect(Utils.stdout).toHaveBeenCalledWith({
			newValue: `Jane`,
			oldValue: `John`,
		})
	})
	it(`can use a function as a default value`, () => {
		const count = atom<number>({
			key: `count`,
			default: () => 0,
		})
		expect(getState(count)).toBe(0)
	})
	it(`can be reset to its default value`, () => {
		const stats = atom<Record<number, number>>({
			key: `count`,
			default: () => ({ 0: 0, 1: 0, 2: 0 }),
		})
		expect(getState(stats)).toStrictEqual({ 0: 0, 1: 0, 2: 0 })

		setState(stats, { 0: 1, 1: 0, 2: 0 })
		expect(getState(stats)).toStrictEqual({ 0: 1, 1: 0, 2: 0 })

		resetState(stats)
		expect(getState(stats)).toStrictEqual({ 0: 0, 1: 0, 2: 0 })
	})
})

describe(`selector`, () => {
	it(`can be modified and retrieved`, () => {
		const count = atom<number>({
			key: `count`,
			default: 0,
		})
		const double = selector<number>({
			key: `double`,
			get: ({ get }) => get(count) * 2,
		})
		setState(count, 1)
		expect(getState(double)).toBe(2)
		setState(count, 2)
		expect(getState(double)).toBe(4)
	})
	it(`can be subscribed to`, () => {
		const count = atom<number>({
			key: `count`,
			default: 0,
		})
		const double = selector<number>({
			key: `double`,
			get: ({ get }) => get(count) * 2,
		})
		subscribe(double, Utils.stdout)
		setState(count, 1)
		expect(Utils.stdout).toHaveBeenCalledWith({ newValue: 2, oldValue: 0 })
	})
	it(`can be set, propagating changes to all related atoms`, () => {
		const count = atom<number>({
			key: `count`,
			default: 0,
		})
		const double = selector<number>({
			key: `double`,
			get: ({ get }) => get(count) * 2,
			set: ({ set }, newValue) => {
				set(count, newValue / 2)
			},
		})
		const triple = selector<number>({
			key: `triple`,
			get: ({ get }) => get(count) * 3,
		})
		const doublePlusOne = selector<number>({
			key: `doublePlusOne`,
			get: ({ get }) => get(double) + 1,
			set: ({ set }, newValue) => {
				set(double, newValue - 1)
			},
		})
		setState(double, 20)
		expect(getState(count)).toBe(10)
		expect(getState(double)).toBe(20)
		expect(getState(triple)).toBe(30)
		expect(getState(doublePlusOne)).toBe(21)
		setState(doublePlusOne, 43)
		expect(getState(count)).toBe(21)
	})
	it(`can be reset to its default value`, () => {
		const count = atom<number>({
			key: `count`,
			default: 0,
		})
		const double = selector<number>({
			key: `double`,
			get: ({ get }) => get(count) * 2,
			set: ({ set }, newValue) => {
				set(count, newValue / 2)
			},
		})
		setState(count, 1)
		expect(getState(double)).toBe(2)
		resetState(double)
		expect(getState(double)).toBe(0)
	})
	it(`may depend on more than one atom or selector`, () => {
		const firstNameState = atom<string>({
			key: `firstName`,
			default: `John`,
		})
		const lastNameState = atom<string>({
			key: `lastName`,
			default: `Doe`,
		})
		const fullNameState = selector<string>({
			key: `fullName`,
			get: ({ get }) => `${get(firstNameState)} ${get(lastNameState)}`,
		})
		expect(getState(fullNameState)).toBe(`John Doe`)
		setState(firstNameState, `Jane`)
		expect(getState(fullNameState)).toBe(`Jane Doe`)

		type Gender = `female` | `male` | `other`
		const TITLES: Record<Gender, string> = {
			male: `Mr.`,
			female: `Ms.`,
			other: `Mx.`,
		} as const

		const genderState = atom<Gender>({
			key: `gender`,
			default: `other`,
		})
		const modeOfAddressState = atom<`formal` | `informal`>({
			key: `modeOfAddress`,
			default: `informal`,
		})
		const greetingState = selector<string>({
			key: `greetingState`,
			get: ({ get }) => {
				const modeOfAddress = get(modeOfAddressState)
				if (modeOfAddress === `formal`) {
					return `Dear ${TITLES[get(genderState)]} ${get(lastNameState)},`
				}
				return `Hi ${get(firstNameState)}!`
			},
		})
		expect(getState(greetingState)).toBe(`Hi Jane!`)
		setState(firstNameState, `Janice`)
		expect(getState(greetingState)).toBe(`Hi Janice!`)
		setState(modeOfAddressState, `formal`)
		expect(getState(greetingState)).toBe(`Dear Mx. Doe,`)
		setState(genderState, `female`)
		expect(getState(greetingState)).toBe(`Dear Ms. Doe,`)
	})
	it(`may have conditional dependencies`, () => {
		const countAtom = atom<number>({
			key: `count`,
			default: 0,
		})
		const countIsTrackedAtom = atom<boolean>({
			key: `shouldConsiderCount`,
			default: false,
		})
		const trackedCountSelector = selector<number | null>({
			key: `trackedCount`,
			get: ({ get }) => {
				Utils.stdout0(`📝 trackedCountSelector`)
				const countIsTracked = get(countIsTrackedAtom)
				if (countIsTracked) {
					const count = get(countAtom)
					return count
				}
				return null
			},
		})
		expect(Utils.stdout0).toHaveBeenCalledTimes(0) // selectors do NOT initially evaluate
		const unsubscribe = subscribe(trackedCountSelector, Utils.stdout)
		expect(getState(trackedCountSelector)).toBe(null)
		setState(countIsTrackedAtom, true)
		expect(Utils.stdout0).toHaveBeenCalledTimes(2)
		expect(Utils.stdout).toHaveBeenCalledWith({
			newValue: 0,
			oldValue: null,
		})
		setState(countAtom, 1)
		expect(Utils.stdout0).toHaveBeenCalledTimes(3)
		expect(Utils.stdout).toHaveBeenCalledWith({
			newValue: 1,
			oldValue: 0,
		})
		unsubscribe()
		setState(countAtom, 2)
		expect(Utils.stdout0).toHaveBeenCalledTimes(3)
	})
	it(`(covers "covered" in trace-selector-atoms) won't trace the same node twice`, () => {
		const countSelector = atom<number>({
			key: `count`,
			default: 0,
		})

		const countPlusTenSelector = selector<number>({
			key: `countPlusTen`,
			get: ({ get }) => get(countSelector) + 10,
		})
		const countPlusFiveSelector = selector<number>({
			key: `countPlusFive`,
			get: ({ get }) => get(countSelector) + 5,
		})
		const doubleCountPlusFifteenSelector = selector<number>({
			key: `countPlusFifteen`,
			get: ({ get }) => {
				const plusTen = get(countPlusTenSelector)
				const plusFive = get(countPlusFiveSelector)
				return plusTen + plusFive
			},
		})
		const tripleCountPlusTwentySelector = selector<number>({
			key: `countPlusTwenty`,
			get: ({ get }) => {
				const doublePlusFifteen = get(doubleCountPlusFifteenSelector)
				const plusFive = get(countPlusFiveSelector)
				return doublePlusFifteen + plusFive
			},
		})

		expect(getState(countPlusTenSelector)).toBe(10)
		expect(getState(countPlusFiveSelector)).toBe(5)
		expect(getState(doubleCountPlusFifteenSelector)).toBe(15)
		expect(getState(tripleCountPlusTwentySelector)).toBe(20)
	})
	it(`drops subscriptions to roots that are no longer gotten`, () => {
		const countAtom = atom<number>({
			key: `count`,
			default: 0,
		})
		const fallbackAtom = atom<number>({
			key: `fallback`,
			default: 0,
		})
		const myDivergentSelector = selector<number>({
			key: `myDivergentSelector`,
			get: ({ get }) => {
				Utils.stdout(`evaluated`)
				const fallback = get(fallbackAtom)
				if (fallback >= 10) {
					return fallback
				}
				return get(countAtom)
			},
		})

		getState(myDivergentSelector)

		expect(Utils.stdout).toHaveBeenCalledTimes(1)

		setState(countAtom, 1)
		getState(myDivergentSelector)
		expect(Utils.stdout).toHaveBeenCalledTimes(2)
		setState(fallbackAtom, 10)
		getState(myDivergentSelector)
		expect(Utils.stdout).toHaveBeenCalledTimes(3)
		setState(countAtom, 2)
		getState(myDivergentSelector)
		expect(Utils.stdout).toHaveBeenCalledTimes(3)
	})
})
