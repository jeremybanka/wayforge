import type { Logger } from "atom.io"
import { atom, getState, selector, setState } from "atom.io"
import * as Internal from "atom.io/internal"

import * as Utils from "../../__util__"

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
	vitest.spyOn(Utils, `stdout0`)
})

test.skip(`held selector concept`, () => {
	const myAtom = atom<{ a: number[]; b: number[]; c: number[] }>({
		key: `myAtom`,
		default: {
			a: [],
			b: [],
			c: [],
		},
	})

	const heldValue: { a: number; b: number; c: number } = {
		a: 0,
		b: 0,
		c: 0,
	}
	const mySelector = selector<{
		a: number
		b: number
		c: number
	}>({
		key: `mySelector`,
		get: ({ get }) => {
			const { a, b, c } = get(myAtom)
			heldValue.a = a.reduce((acc, cur) => acc + cur, 0)
			heldValue.b = b.reduce((acc, cur) => acc + cur, 0)
			heldValue.c = c.reduce((acc, cur) => acc + cur, 0)
			return heldValue
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

test(`held selector implementation`, () => {
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
		default: { a: 0, b: 0, c: 0 },
		get: ({ get }, permanent) => {
			const { a, b, c } = get(myAtom)
			permanent.a = a.reduce((acc, cur) => acc + cur, 0)
			permanent.b = b.reduce((acc, cur) => acc + cur, 0)
			permanent.c = c.reduce((acc, cur) => acc + cur, 0)
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
