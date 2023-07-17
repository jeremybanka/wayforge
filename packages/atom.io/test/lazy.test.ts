import { vitest } from "vitest"

import * as UTIL from "./__util__"
import {
	__INTERNAL__,
	atom,
	getState,
	selector,
	setLogLevel,
	setState,
	subscribe,
} from "../src"
import { withdraw } from "../src/internal"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 0
setLogLevel(LOG_LEVELS[CHOOSE])
const logger = __INTERNAL__.IMPLICIT.STORE.config.logger ?? console

beforeEach(() => {
	__INTERNAL__.clearStore()
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(UTIL, `stdout`)
})

describe(`lazy propagation system`, () => {
	test(`on subscribe, selectors in turn subscribe to their root atoms`, () => {
		const a = atom({
			key: `a`,
			default: 0,
		})
		const s = selector({
			key: `s`,
			get: ({ get }) => get(a) * 10,
		})
		const s0 = selector({
			key: `s0`,
			get: ({ get }) => get(s) * 10,
		})
		subscribe(s, UTIL.stdout)
		subscribe(s0, UTIL.stdout)
		const myAtom = withdraw(a, __INTERNAL__.IMPLICIT.STORE)
		const mySelector = withdraw(s, __INTERNAL__.IMPLICIT.STORE)
		const mySelector0 = withdraw(s0, __INTERNAL__.IMPLICIT.STORE)
		expect(myAtom?.subject.subscribers.length).toBe(2)
		expect(mySelector?.subject.subscribers.length).toBe(1)
		expect(mySelector0?.subject.subscribers.length).toBe(1)
		setState(a, 1)
		expect(UTIL.stdout).not.toHaveBeenCalledWith({ newValue: 1, oldValue: 0 })
		expect(UTIL.stdout).toHaveBeenCalledWith({ newValue: 10, oldValue: 0 })
		expect(UTIL.stdout).toHaveBeenCalledWith({ newValue: 100, oldValue: 0 })
	})
	test(`subscriptions are cleaned up in a domino effect`, () => {
		const a = atom({
			key: `a`,
			default: 0,
		})
		const s = selector({
			key: `s`,
			get: ({ get }) => get(a) * 10,
		})
		const unsubscribe = subscribe(s, UTIL.stdout)
		const myAtom = withdraw(a, __INTERNAL__.IMPLICIT.STORE)
		const mySelector = withdraw(s, __INTERNAL__.IMPLICIT.STORE)
		expect(myAtom?.subject.subscribers.length).toBe(1)
		expect(mySelector?.subject.subscribers.length).toBe(1)
		unsubscribe()
		expect(myAtom?.subject.subscribers.length).toBe(0)
		expect(mySelector?.subject.subscribers.length).toBe(0)
	})
	test(`selectors are not eagerly evaluated, unless they have a subscription`, () => {
		const a = atom({
			key: `a`,
			default: 0,
		})
		const selector0 = selector({
			key: `selector0`,
			get: ({ get }) => {
				UTIL.stdout(`selector0 evaluated`)
				return get(a) * 10
			},
		})
		const selector1 = selector({
			key: `selector1`,
			get: ({ get }) => {
				UTIL.stdout(`selector1 evaluated`)
				return get(a) - 1
			},
		})

		expect(UTIL.stdout).toHaveBeenCalledWith(`selector0 evaluated`)
		expect(UTIL.stdout).toHaveBeenCalledWith(`selector1 evaluated`)

		vitest.spyOn(UTIL, `stdout`)

		subscribe(selector0, UTIL.stdout)
		setState(a, 1)
		expect(UTIL.stdout).toHaveBeenCalledWith(`selector0 evaluated`)
		expect(UTIL.stdout).not.toHaveBeenCalledWith(`selector1 evaluated`)

		vitest.spyOn(UTIL, `stdout`)

		getState(selector1)

		expect(UTIL.stdout).toHaveBeenCalledWith(`selector1 evaluated`)
	})
})
