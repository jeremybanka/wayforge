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
		const a = atom<number>({
			key: `a`,
			default: 0,
		})
		const s = selector<number>({
			key: `s`,
			get: ({ get }) => get(a) * 10,
		})
		const s0 = selector<number>({
			key: `s0`,
			get: ({ get }) => get(s) * 10,
		})
		subscribe(s, Utils.stdout)
		subscribe(s0, Utils.stdout)
		const myAtom = Internal.withdraw(Internal.IMPLICIT.STORE, a)
		const mySelector = Internal.withdraw(Internal.IMPLICIT.STORE, s)
		const mySelector0 = Internal.withdraw(Internal.IMPLICIT.STORE, s0)
		expect(myAtom.subject.subscribers.size).toBe(2)
		expect(mySelector.subject.subscribers.size).toBe(1)
		expect(mySelector0.subject.subscribers.size).toBe(1)
		setState(a, 1)
		expect(Utils.stdout).not.toHaveBeenCalledWith({ newValue: 1, oldValue: 0 })
		expect(Utils.stdout).toHaveBeenCalledWith({ newValue: 10, oldValue: 0 })
		expect(Utils.stdout).toHaveBeenCalledWith({ newValue: 100, oldValue: 0 })
	})
	test(`subscriptions are cleaned up in a domino effect`, () => {
		const a = atom<number>({
			key: `a`,
			default: 0,
		})
		const s = selector<number>({
			key: `s`,
			get: ({ get }) => get(a) * 10,
		})
		const unsubscribe = subscribe(s, Utils.stdout)
		const myAtom = Internal.withdraw(Internal.IMPLICIT.STORE, a)
		const mySelector = Internal.withdraw(Internal.IMPLICIT.STORE, s)
		expect(myAtom.subject.subscribers.size).toBe(1)
		expect(mySelector.subject.subscribers.size).toBe(1)
		unsubscribe()
		expect(myAtom.subject.subscribers.size).toBe(0)
		expect(mySelector.subject.subscribers.size).toBe(0)
	})
	test(`selectors are not eagerly evaluated, unless they have a subscription`, () => {
		const a = atom<number>({
			key: `a`,
			default: 0,
		})
		const selector0 = selector<number>({
			key: `selector0`,
			get: ({ get }) => {
				Utils.stdout(`selector0 evaluated`)
				return get(a) * 10
			},
		})
		const selector1 = selector<number>({
			key: `selector1`,
			get: ({ get }) => {
				Utils.stdout(`selector1 evaluated`)
				return get(a) - 1
			},
		})

		expect(Utils.stdout).not.toHaveBeenCalledWith(`selector0 evaluated`)
		expect(Utils.stdout).not.toHaveBeenCalledWith(`selector1 evaluated`)

		vitest.spyOn(Utils, `stdout`)

		subscribe(selector0, Utils.stdout)
		expect(Utils.stdout).toHaveBeenCalledWith(`selector0 evaluated`)
		expect(Utils.stdout).not.toHaveBeenCalledWith(`selector1 evaluated`)

		vitest.spyOn(Utils, `stdout`)

		setState(a, 1)
		expect(Utils.stdout).toHaveBeenCalledWith(`selector0 evaluated`)
		expect(Utils.stdout).not.toHaveBeenCalledWith(`selector1 evaluated`)

		vitest.spyOn(Utils, `stdout`)

		getState(selector1)

		expect(Utils.stdout).toHaveBeenCalledWith(`selector1 evaluated`)
	})
})
