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
	vitest.spyOn(logger, `error`).mockReset()
	vitest.spyOn(logger, `warn`).mockReset()
	vitest.spyOn(logger, `info`).mockReset()
	vitest.spyOn(Utils, `stdout`).mockReset()
	vitest.spyOn(Utils, `stdout0`).mockReset()
})

describe(`atom`, () => {
	it(`can be modified and retrieved`, () => {
		const countAtom = atom<number>({
			key: `count`,
			default: 0,
		})
		setState(countAtom, 1)
		expect(getState(countAtom)).toBe(1)
		setState(countAtom, 2)
		expect(getState(countAtom)).toBe(2)
	})
	it(`can be subscribed to`, () => {
		const nameAtom = atom<string>({
			key: `name`,
			default: `John`,
		})
		subscribe(nameAtom, Utils.stdout)
		setState(nameAtom, `Jane`)
		expect(Utils.stdout).toHaveBeenCalledWith({
			newValue: `Jane`,
			oldValue: `John`,
		})
	})
	it(`can use a function as a default value`, () => {
		const countAtom = atom<number>({
			key: `count`,
			default: () => 0,
		})
		expect(getState(countAtom)).toBe(0)
	})
	it(`can be reset to its default value`, () => {
		const statsAtom = atom<Record<number, number>>({
			key: `stats`,
			default: () => ({ 0: 0, 1: 0, 2: 0 }),
		})
		expect(getState(statsAtom)).toStrictEqual({ 0: 0, 1: 0, 2: 0 })

		setState(statsAtom, { 0: 1, 1: 0, 2: 0 })
		expect(getState(statsAtom)).toStrictEqual({ 0: 1, 1: 0, 2: 0 })

		resetState(statsAtom)
		expect(getState(statsAtom)).toStrictEqual({ 0: 0, 1: 0, 2: 0 })
	})
})

describe(`selector`, () => {
	it(`can be modified and retrieved`, () => {
		const countAtom = atom<number>({
			key: `count`,
			default: 0,
		})
		const doubleSelector = selector<number>({
			key: `double`,
			get: ({ get }) => get(countAtom) * 2,
		})
		setState(countAtom, 1)
		expect(getState(doubleSelector)).toBe(2)
		setState(countAtom, 2)
		expect(getState(doubleSelector)).toBe(4)
	})
	it(`can be subscribed to`, () => {
		const countAtom = atom<number>({
			key: `count`,
			default: 0,
		})
		const doubleSelector = selector<number>({
			key: `double`,
			get: ({ get }) => get(countAtom) * 2,
		})
		subscribe(doubleSelector, Utils.stdout)
		setState(countAtom, 1)
		expect(Utils.stdout).toHaveBeenCalledWith({ newValue: 2, oldValue: 0 })
	})
	it(`can be set, propagating changes to all related atoms`, () => {
		const countAtom = atom<number>({
			key: `count`,
			default: 0,
		})
		const doubleSelector = selector<number>({
			key: `double`,
			get: ({ get }) => get(countAtom) * 2,
			set: ({ set }, newValue) => {
				set(countAtom, newValue / 2)
			},
		})
		const tripleSelector = selector<number>({
			key: `triple`,
			get: ({ get }) => get(countAtom) * 3,
		})
		const doublePlusOneSelector = selector<number>({
			key: `doublePlusOne`,
			get: ({ get }) => get(doubleSelector) + 1,
			set: ({ set }, newValue) => {
				set(doubleSelector, newValue - 1)
			},
		})
		setState(doubleSelector, 20)
		expect(getState(countAtom)).toBe(10)
		expect(getState(doubleSelector)).toBe(20)
		expect(getState(tripleSelector)).toBe(30)
		expect(getState(doublePlusOneSelector)).toBe(21)
		setState(doublePlusOneSelector, 43)
		expect(getState(countAtom)).toBe(21)
	})
	it(`can be reset to its default value`, () => {
		const countAtom = atom<number>({
			key: `count`,
			default: 0,
		})
		const doubleSelector = selector<number>({
			key: `double`,
			get: ({ get }) => get(countAtom) * 2,
			set: ({ set }, newValue) => {
				set(countAtom, newValue / 2)
			},
		})
		setState(countAtom, 1)
		expect(getState(doubleSelector)).toBe(2)
		resetState(doubleSelector)
		expect(getState(doubleSelector)).toBe(0)
	})
	it(`may depend on more than one atom or selector`, () => {
		const firstNameAtom = atom<string>({
			key: `firstName`,
			default: `John`,
		})
		const lastNameAtom = atom<string>({
			key: `lastName`,
			default: `Doe`,
		})
		const fullNameSelector = selector<string>({
			key: `fullName`,
			get: ({ get }) => `${get(firstNameAtom)} ${get(lastNameAtom)}`,
		})
		expect(getState(fullNameSelector)).toBe(`John Doe`)
		setState(firstNameAtom, `Jane`)
		expect(getState(fullNameSelector)).toBe(`Jane Doe`)

		type Gender = `female` | `male` | `other`
		const TITLES: Record<Gender, string> = {
			male: `Mr.`,
			female: `Ms.`,
			other: `Mx.`,
		} as const

		const genderAtom = atom<Gender>({
			key: `gender`,
			default: `other`,
		})
		const modeOfAddressAtom = atom<`formal` | `informal`>({
			key: `modeOfAddress`,
			default: `informal`,
		})
		const greetingSelector = selector<string>({
			key: `greeting`,
			get: ({ get }) => {
				const modeOfAddress = get(modeOfAddressAtom)
				if (modeOfAddress === `formal`) {
					return `Dear ${TITLES[get(genderAtom)]} ${get(lastNameAtom)},`
				}
				return `Hi ${get(firstNameAtom)}!`
			},
		})
		expect(getState(greetingSelector)).toBe(`Hi Jane!`)
		setState(firstNameAtom, `Janice`)
		expect(getState(greetingSelector)).toBe(`Hi Janice!`)
		setState(modeOfAddressAtom, `formal`)
		expect(getState(greetingSelector)).toBe(`Dear Mx. Doe,`)
		setState(genderAtom, `female`)
		expect(getState(greetingSelector)).toBe(`Dear Ms. Doe,`)
	})
	it(`may have conditional dependencies`, () => {
		const countAtom = atom<number>({
			key: `count`,
			default: 0,
		})
		const countIsTrackedAtom = atom<boolean>({
			key: `countIsTracked`,
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
		const countAtom = atom<number>({
			key: `count`,
			default: 0,
		})

		const countPlusTenSelector = selector<number>({
			key: `countPlusTen`,
			get: ({ get }) => get(countAtom) + 10,
		})
		const countPlusFiveSelector = selector<number>({
			key: `countPlusFive`,
			get: ({ get }) => get(countAtom) + 5,
		})
		const doubleCountPlusFifteenSelector = selector<number>({
			key: `doubleCountPlusFifteen`,
			get: ({ get }) => {
				const plusTen = get(countPlusTenSelector)
				const plusFive = get(countPlusFiveSelector)
				return plusTen + plusFive
			},
		})
		const tripleCountPlusTwentySelector = selector<number>({
			key: `tripleCountPlusTwenty`,
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
			key: `myDivergent`,
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
