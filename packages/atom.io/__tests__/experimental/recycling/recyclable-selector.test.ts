import type { Logger } from "atom.io"
import {
	atom,
	atomFamily,
	disposeState,
	getState,
	selector,
	selectorFamily,
	setState,
} from "atom.io"
import * as Internal from "atom.io/internal"

import * as Utils from "../../__util__"

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

describe(`standalone selectors held`, () => {
	test(`readonly held selector`, () => {
		const myAtom = atom<{ a: number[]; b: number[]; c: number[] }>({
			key: `myAtom`,
			default: {
				a: [],
				b: [],
				c: [],
			},
		})

		const mySelector = selector<{
			a: number
			b: number
			c: number
		}>({
			key: `mySelector`,
			const: { a: 0, b: 0, c: 0 },
			get: ({ get }, self) => {
				const { a, b, c } = get(myAtom)
				self.a = a.reduce((acc, cur) => acc + cur, 0)
				self.b = b.reduce((acc, cur) => acc + cur, 0)
				self.c = c.reduce((acc, cur) => acc + cur, 0)
			},
		})

		const valueInitial = getState(mySelector)
		expect(valueInitial).toEqual({
			a: 0,
			b: 0,
			c: 0,
		})

		setState(myAtom, (state) => {
			state.a.push(1, 2)
			state.b.push(2, 2, 2)
			state.c.push(3, 6)
			return state
		})

		const valueAfter = getState(mySelector)
		expect(valueAfter).toEqual({
			a: 3,
			b: 6,
			c: 9,
		})
		expect(valueInitial).toBe(valueAfter)
	})

	test(`writable held selector`, () => {
		const myAtom = atom<{ a: number[]; b: number[]; c: number[] }>({
			key: `myAtom`,
			default: {
				a: [],
				b: [],
				c: [],
			},
		})

		const mySelector = selector<{
			a: number
			b: number
			c: number
		}>({
			key: `mySelector`,
			const: { a: 0, b: 0, c: 0 },
			get: ({ get }, self) => {
				const { a, b, c } = get(myAtom)
				self.a = a.reduce((acc, cur) => acc + cur, 0)
				self.b = b.reduce((acc, cur) => acc + cur, 0)
				self.c = c.reduce((acc, cur) => acc + cur, 0)
			},
			set: ({ set }, newValue) => {
				set(myAtom, (state) => {
					state.a = Array.from({ length: newValue.a }).map(() => 1)
					state.b = Array.from({ length: newValue.b }).map(() => 1)
					state.c = Array.from({ length: newValue.c }).map(() => 1)
					return state
				})
			},
		})

		const valueInitial = getState(mySelector)
		expect(valueInitial).toEqual({
			a: 0,
			b: 0,
			c: 0,
		})
		setState(mySelector, (state) => {
			state.a = 3
			state.b = 6
			state.c = 9
			return state
		})
		const valueAfter = getState(mySelector)
		expect(valueAfter).toEqual({
			a: 3,
			b: 6,
			c: 9,
		})
		expect(valueInitial).toBe(valueAfter)
	})
})

describe(`family selectors held`, () => {
	test(`readonly held selector family`, () => {
		const myAtomFamily = atomFamily<
			{ a: number[]; b: number[]; c: number[] },
			boolean
		>({
			key: `myAtom`,
			default: {
				a: [],
				b: [],
				c: [],
			},
		})

		const mySelectorFamily = selectorFamily<
			{
				a: number
				b: number
				c: number
			},
			boolean
		>({
			key: `mySelector`,
			const: () => ({ a: 0, b: 0, c: 0 }),
			get:
				(key) =>
				({ get }, self) => {
					const { a, b, c } = get(myAtomFamily, key)
					self.a = a.reduce((acc, cur) => acc + cur, 0)
					self.b = b.reduce((acc, cur) => acc + cur, 0)
					self.c = c.reduce((acc, cur) => acc + cur, 0)
				},
		})

		const valueInitial = getState(mySelectorFamily, true)
		expect(valueInitial).toEqual({
			a: 0,
			b: 0,
			c: 0,
		})

		setState(myAtomFamily, true, (state) => {
			state.a.push(1, 2)
			state.b.push(2, 2, 2)
			state.c.push(3, 6)
			return state
		})

		const valueAfter = getState(mySelectorFamily, true)
		expect(valueAfter).toEqual({
			a: 3,
			b: 6,
			c: 9,
		})

		expect(valueInitial).toBe(valueAfter)

		const valueAlt = getState(mySelectorFamily, false)

		expect(valueInitial).not.toBe(valueAlt)

		disposeState(mySelectorFamily, false)

		const valueRecreated = getState(mySelectorFamily, false)
		expect(valueRecreated).not.toBe(valueInitial)
	})

	test(`writable held selector family`, () => {
		const myAtomFamily = atomFamily<
			{ a: number[]; b: number[]; c: number[] },
			boolean
		>({
			key: `myAtom`,
			default: {
				a: [],
				b: [],
				c: [],
			},
		})

		const mySelectorFamily = selectorFamily<
			{
				a: number
				b: number
				c: number
			},
			boolean
		>({
			key: `mySelector`,
			const: () => ({ a: 0, b: 0, c: 0 }),
			get:
				(key) =>
				({ get }, self) => {
					self.a = get(myAtomFamily, key).a.reduce((acc, cur) => acc + cur, 0)
					self.b = get(myAtomFamily, key).b.reduce((acc, cur) => acc + cur, 0)
					self.c = get(myAtomFamily, key).c.reduce((acc, cur) => acc + cur, 0)
				},
			set:
				(key) =>
				({ set }, self) => {
					set(myAtomFamily, key, (state) => {
						state.a = Array.from({ length: self.a }).map(() => 1)
						state.b = Array.from({ length: self.b }).map(() => 1)
						state.c = Array.from({ length: self.c }).map(() => 1)
						return state
					})
				},
		})

		const valueInitial = getState(mySelectorFamily, true)
		expect(valueInitial).toEqual({
			a: 0,
			b: 0,
			c: 0,
		})

		setState(myAtomFamily, true, (state) => {
			state.a.push(1, 2)
			state.b.push(2, 2, 2)
			state.c.push(3, 6)
			return state
		})

		const valueAfter = getState(mySelectorFamily, true)
		expect(valueAfter).toEqual({
			a: 3,
			b: 6,
			c: 9,
		})

		expect(valueInitial).toBe(valueAfter)

		const valueAlt = getState(mySelectorFamily, false)

		expect(valueInitial).not.toBe(valueAlt)

		disposeState(mySelectorFamily, true)

		const valueRecreated = getState(mySelectorFamily, true)
		expect(valueRecreated).not.toBe(valueInitial)
	})
})
