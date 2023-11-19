import { atom, deleteAtom, getState } from "atom.io"

describe(`deleteAtom`, () => {
	it(`deletes an atom`, () => {
		const countState = atom({
			key: `count`,
			default: 0,
		})
		expect(countState.key).toEqual(`count`)
		deleteAtom(countState)
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
})
