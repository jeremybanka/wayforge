import type { Logger } from "atom.io"
import {
	atom,
	atomFamily,
	disposeState,
	getState,
	resetState,
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
		const abcListsAtom = atom<{ a: number[]; b: number[]; c: number[] }>({
			key: `abcLists`,
			default: {
				a: [],
				b: [],
				c: [],
			},
		})

		const abcLengthsSelector = selector<{
			a: number
			b: number
			c: number
		}>({
			key: `abcLengths`,
			const: { a: 0, b: 0, c: 0 },
			get: ({ get }, self) => {
				const { a, b, c } = get(abcListsAtom)
				self.a = a.reduce((acc, cur) => acc + cur, 0)
				self.b = b.reduce((acc, cur) => acc + cur, 0)
				self.c = c.reduce((acc, cur) => acc + cur, 0)
			},
		})

		const valueInitial = getState(abcLengthsSelector)
		expect(valueInitial).toEqual({
			a: 0,
			b: 0,
			c: 0,
		})

		setState(abcListsAtom, (state) => {
			state.a.push(1, 2)
			state.b.push(2, 2, 2)
			state.c.push(3, 6)
			return state
		})

		const valueAfter = getState(abcLengthsSelector)
		expect(valueAfter).toEqual({
			a: 3,
			b: 6,
			c: 9,
		})
		expect(valueInitial).toBe(valueAfter)
	})

	test(`writable held selector`, () => {
		const abcListsAtom = atom<{ a: number[]; b: number[]; c: number[] }>({
			key: `abcLists`,
			default: {
				a: [],
				b: [],
				c: [],
			},
		})

		const abcLengthsSelector = selector<{
			a: number
			b: number
			c: number
		}>({
			key: `abcLengths`,
			const: { a: 0, b: 0, c: 0 },
			get: ({ get }, self) => {
				const { a, b, c } = get(abcListsAtom)
				self.a = a.reduce((acc, cur) => acc + cur, 0)
				self.b = b.reduce((acc, cur) => acc + cur, 0)
				self.c = c.reduce((acc, cur) => acc + cur, 0)
			},
			set: ({ set }, newValue) => {
				set(abcListsAtom, (state) => {
					state.a = Array.from({ length: newValue.a }).map(() => 1)
					state.b = Array.from({ length: newValue.b }).map(() => 1)
					state.c = Array.from({ length: newValue.c }).map(() => 1)
					return state
				})
			},
		})

		const valueInitial = getState(abcLengthsSelector)
		expect(valueInitial).toEqual({
			a: 0,
			b: 0,
			c: 0,
		})
		setState(abcLengthsSelector, (state) => {
			state.a = 3
			state.b = 6
			state.c = 9
			return state
		})
		const valueAfter = getState(abcLengthsSelector)
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
		const abcListsAtoms = atomFamily<
			{ a: number[]; b: number[]; c: number[] },
			boolean
		>({
			key: `abcLists`,
			default: {
				a: [],
				b: [],
				c: [],
			},
		})

		const abcLengthsSelectors = selectorFamily<
			{
				a: number
				b: number
				c: number
			},
			boolean
		>({
			key: `abcLengths`,
			const: () => ({ a: 0, b: 0, c: 0 }),
			get:
				(key) =>
				({ get }, self) => {
					const { a, b, c } = get(abcListsAtoms, key)
					self.a = a.reduce((acc, cur) => acc + cur, 0)
					self.b = b.reduce((acc, cur) => acc + cur, 0)
					self.c = c.reduce((acc, cur) => acc + cur, 0)
				},
		})

		const valueInitial = getState(abcLengthsSelectors, true)
		expect(valueInitial).toEqual({
			a: 0,
			b: 0,
			c: 0,
		})

		setState(abcListsAtoms, true, (state) => {
			state.a.push(1, 2)
			state.b.push(2, 2, 2)
			state.c.push(3, 6)
			return state
		})

		const valueAfter = getState(abcLengthsSelectors, true)
		expect(valueAfter).toEqual({
			a: 3,
			b: 6,
			c: 9,
		})

		expect(valueInitial).toBe(valueAfter)

		const valueAlt = getState(abcLengthsSelectors, false)

		expect(valueInitial).not.toBe(valueAlt)

		disposeState(abcLengthsSelectors, false)

		const valueRecreated = getState(abcLengthsSelectors, false)
		expect(valueRecreated).not.toBe(valueInitial)
	})

	test(`writable held selector family`, () => {
		const abcListsAtoms = atomFamily<
			{ a: number[]; b: number[]; c: number[] },
			boolean
		>({
			key: `abcLists`,
			default: () => ({
				a: [],
				b: [],
				c: [],
			}),
		})

		const abcLengthsSelectors = selectorFamily<
			{
				a: number
				b: number
				c: number
			},
			boolean
		>({
			key: `abcLengths`,
			const: () => ({ a: 0, b: 0, c: 0 }),
			get:
				(key) =>
				({ get }, self) => {
					self.a = get(abcListsAtoms, key).a.reduce((acc, cur) => acc + cur, 0)
					self.b = get(abcListsAtoms, key).b.reduce((acc, cur) => acc + cur, 0)
					self.c = get(abcListsAtoms, key).c.reduce((acc, cur) => acc + cur, 0)
				},
			set:
				(key) =>
				({ set }, self) => {
					set(abcListsAtoms, key, (state) => {
						state.a = Array.from({ length: self.a }).map(() => 1)
						state.b = Array.from({ length: self.b }).map(() => 1)
						state.c = Array.from({ length: self.c }).map(() => 1)
						return state
					})
				},
		})

		const valueInitial = getState(abcLengthsSelectors, true)
		expect(valueInitial).toEqual({
			a: 0,
			b: 0,
			c: 0,
		})

		setState(abcListsAtoms, true, (state) => {
			state.a.push(1, 2)
			state.b.push(2, 2, 2)
			state.c.push(3, 6)
			return state
		})

		const valueAfter = getState(abcLengthsSelectors, true)
		expect(valueAfter).toEqual({
			a: 3,
			b: 6,
			c: 9,
		})

		expect(valueInitial).toBe(valueAfter)

		const valueAlt = getState(abcLengthsSelectors, false)

		expect(valueInitial).not.toBe(valueAlt)

		disposeState(abcLengthsSelectors, true)

		const valueRecreated = getState(abcLengthsSelectors, true)
		expect(valueRecreated).not.toBe(valueInitial)

		setState(abcListsAtoms, true, (state) => {
			state.a = [11, 230]
			state.b = [306, 32]
			state.c = [330, 6]
			return state
		})
		getState(abcLengthsSelectors, true)
		expect(valueRecreated).toEqual({
			a: 241,
			b: 338,
			c: 336,
		})
		resetState(abcLengthsSelectors, true)
		console.log(getState(abcLengthsSelectors, true))

		expect(valueRecreated).toEqual({
			a: 0,
			b: 0,
			c: 0,
		})
	})
})
