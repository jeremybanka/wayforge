import { atom } from "atom.io"
import * as Internal from "atom.io/internal"
import * as AS from "atom.io/solid"
import { createRoot } from "solid-js"

describe(`single atom (solid, no JSX, real provider)`, () => {
	beforeEach(() => {
		Internal.clearStore(Internal.IMPLICIT.STORE)
	})

	it(`accepts writes and propagates updates`, () => {
		const letterState = atom<string>({
			key: `letter`,
			default: `A`,
		})

		createRoot((dispose) => {
			AS.StoreProvider({
				children: () => {
					const setLetter = AS.useI(letterState)
					const letter = AS.useO(letterState)

					expect(letter()).toBe(`A`)

					setLetter(`B`)
					expect(letter()).toBe(`B`)
				},
			})

			dispose()
		})
	})
})
