import type { Logger } from "atom.io"
import { atom, getState, selector, setState, subscribe } from "atom.io"
import * as Internal from "atom.io/internal"
import { vitest } from "vitest"

import * as Utils from "../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 3

let logger: Logger

beforeEach(() => {
	Internal.clearStore(Internal.IMPLICIT.STORE)
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = Internal.IMPLICIT.STORE.logger = Utils.createNullLogger()
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(Utils, `stdout`)
})

afterEach(() => {
	expect(logger.warn).not.toHaveBeenCalled()
	expect(logger.error).not.toHaveBeenCalled()
})

describe(`lazy propagation system`, () => {
	test(`on subscribe, selectors in turn subscribe to their root atoms`, () => {
		const countAtom = atom<number>({
			key: `count`,
			default: 0,
		})
		const timesTenSelector = selector<number>({
			key: `timesTen`,
			get: ({ get }) => get(countAtom) * 10,
		})
		const timesOneHundredSelector = selector<number>({
			key: `timesOneHundred`,
			get: ({ get }) => get(timesTenSelector) * 10,
		})
		subscribe(timesTenSelector, Utils.stdout)
		subscribe(timesOneHundredSelector, Utils.stdout)
		const myCountAtomInternal = Internal.withdraw(
			Internal.IMPLICIT.STORE,
			countAtom,
		)
		const myTimesTenSelectorInternal = Internal.withdraw(
			Internal.IMPLICIT.STORE,
			timesTenSelector,
		)
		const myTimesOneHundredSelectorInternal = Internal.withdraw(
			Internal.IMPLICIT.STORE,
			timesOneHundredSelector,
		)
		expect(myCountAtomInternal.subject.subscribers.size).toBe(2)
		expect(myTimesTenSelectorInternal.subject.subscribers.size).toBe(1)
		expect(myTimesOneHundredSelectorInternal.subject.subscribers.size).toBe(1)
		setState(countAtom, 1)
		expect(Utils.stdout).not.toHaveBeenCalledWith({ newValue: 1, oldValue: 0 })
		expect(Utils.stdout).toHaveBeenCalledWith({ newValue: 10, oldValue: 0 })
		expect(Utils.stdout).toHaveBeenCalledWith({ newValue: 100, oldValue: 0 })
	})
	test(`subscriptions are cleaned up in a domino effect`, () => {
		const countAtom = atom<number>({
			key: `count`,
			default: 0,
		})
		const timesTenSelector = selector<number>({
			key: `timesTen`,
			get: ({ get }) => get(countAtom) * 10,
		})
		const unsubscribe = subscribe(timesTenSelector, Utils.stdout)
		const myAtom = Internal.withdraw(Internal.IMPLICIT.STORE, countAtom)
		const mySelector = Internal.withdraw(
			Internal.IMPLICIT.STORE,
			timesTenSelector,
		)
		expect(myAtom.subject.subscribers.size).toBe(1)
		expect(mySelector.subject.subscribers.size).toBe(1)
		unsubscribe()
		expect(myAtom.subject.subscribers.size).toBe(0)
		expect(mySelector.subject.subscribers.size).toBe(0)
	})
	test(`selectors are not eagerly evaluated, unless they have a subscription`, () => {
		const countAtom = atom<number>({
			key: `count`,
			default: 0,
		})
		const timesTenSelector = selector<number>({
			key: `timesTen`,
			get: ({ get }) => {
				Utils.stdout(`selector0 evaluated`)
				return get(countAtom) * 10
			},
		})
		const minusOneSelector = selector<number>({
			key: `minusOne`,
			get: ({ get }) => {
				Utils.stdout(`selector1 evaluated`)
				return get(countAtom) - 1
			},
		})

		expect(Utils.stdout).not.toHaveBeenCalledWith(`selector0 evaluated`)
		expect(Utils.stdout).not.toHaveBeenCalledWith(`selector1 evaluated`)

		vitest.spyOn(Utils, `stdout`)

		subscribe(timesTenSelector, Utils.stdout)
		expect(Utils.stdout).toHaveBeenCalledWith(`selector0 evaluated`)
		expect(Utils.stdout).not.toHaveBeenCalledWith(`selector1 evaluated`)

		vitest.spyOn(Utils, `stdout`)

		setState(countAtom, 1)
		expect(Utils.stdout).toHaveBeenCalledWith(`selector0 evaluated`)
		expect(Utils.stdout).not.toHaveBeenCalledWith(`selector1 evaluated`)

		vitest.spyOn(Utils, `stdout`)

		getState(minusOneSelector)

		expect(Utils.stdout).toHaveBeenCalledWith(`selector1 evaluated`)
	})
})
