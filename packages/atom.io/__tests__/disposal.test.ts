import { atom, dispose, getState, selector } from "atom.io"
import { IMPLICIT } from "atom.io/internal"

describe(`dispose`, () => {
	it(`deletes an atom`, () => {
		const countState = atom({
			key: `count`,
			default: 0,
		})
		expect(countState.key).toEqual(`count`)
		dispose(countState, IMPLICIT.STORE)
		expect(countState.key).toEqual(`count`)
		let caught: Error
		try {
			getState(countState)
		} catch (thrown) {
			if (thrown instanceof Error) {
				caught = thrown
			}
		}
		// biome-ignore lint/style/noNonNullAssertion: this is a test
		if (!caught!) throw new Error(`Expected an error to be thrown`)
		expect(caught).toBeInstanceOf(Error)
		expect(caught.message).toEqual(
			`Atom "count" not found in store "IMPLICIT_STORE".`,
		)
	})

	it(`deletes a selector`, () => {
		const countState = atom({
			key: `count`,
			default: 0,
		})
		const countSelector = selector({
			key: `countSelector`,
			get: ({ get }) => get(countState),
		})
		expect(countSelector.key).toEqual(`countSelector`)
		dispose(countSelector, IMPLICIT.STORE)
		expect(countSelector.key).toEqual(`countSelector`)
		let caught: Error
		try {
			getState(countSelector)
		} catch (thrown) {
			if (thrown instanceof Error) {
				caught = thrown
			}
		}
		// biome-ignore lint/style/noNonNullAssertion: this is a test
		if (!caught!) throw new Error(`Expected an error to be thrown`)
		expect(caught).toBeInstanceOf(Error)
		expect(caught.message).toEqual(
			`Readonly Selector "countSelector" not found in store "IMPLICIT_STORE".`,
		)
	})
})
