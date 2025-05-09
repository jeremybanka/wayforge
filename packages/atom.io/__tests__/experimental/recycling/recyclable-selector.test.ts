import { atom, getState, selector, setState } from "atom.io"

test(`recyclable selector`, () => {
	const myAtom = atom<{ a: number[]; b: number[]; c: number[] }>({
		key: `myAtom`,
		default: {
			a: [],
			b: [],
			c: [],
		},
	})

	const recyclableValue: { a: number; b: number; c: number } = {
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
			recyclableValue.a = a.reduce((acc, cur) => acc + cur, 0)
			recyclableValue.b = b.reduce((acc, cur) => acc + cur, 0)
			recyclableValue.c = c.reduce((acc, cur) => acc + cur, 0)
			return recyclableValue
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
