import {
	atom,
	atomFamily,
	disposeState,
	getState,
	selectorFamily,
} from "atom.io"
import { IMPLICIT } from "atom.io/internal"
import { attachIntrospectionStates } from "atom.io/introspection"

test(`attachIntrospectionStates`, () => {
	expect(attachIntrospectionStates(IMPLICIT.STORE)).not.toThrow

	const countAtoms = atomFamily<number, string>({
		key: `count`,
		default: 0,
	})
	const doubleSelectors = selectorFamily<number, string>({
		key: `double`,
		get:
			(key) =>
			({ get }) =>
				get(countAtoms, key) * 2,
	})

	getState(doubleSelectors, `foo`)
	disposeState(doubleSelectors, `foo`)

	const letterAtom = atom<string>({
		key: `letter`,
		default: `A`,
	})
	const letterSelectors = selectorFamily<string, string>({
		key: `letter`,
		get:
			() =>
			({ get }) =>
				get(letterAtom),
	})
	getState(letterSelectors, `foo`)
})
