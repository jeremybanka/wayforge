import type { AtomOptions, AtomToken, Logger } from "atom.io"
import { atom, dispose, getState, selector } from "atom.io"
import * as Internal from "atom.io/internal"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 3

let logger: Logger

beforeEach(() => {
	Internal.clearStore(Internal.IMPLICIT.STORE)
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = Internal.IMPLICIT.STORE.logger
})

describe(`dispose`, () => {
	it(`deletes an atom`, () => {
		const countState = atom({
			key: `count`,
			default: 0,
		})
		expect(countState.key).toEqual(`count`)
		dispose(countState, Internal.IMPLICIT.STORE)
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
	it(`deletes downstream selectors from atom`, () => {
		const countState = atom({
			key: `count`,
			default: 0,
		})
		const doubledState = selector({
			key: `doubled`,
			get: ({ get }) => get(countState) * 2,
		})
		dispose(countState, Internal.IMPLICIT.STORE)
		let caught: Error
		try {
			getState(doubledState)
		} catch (thrown) {
			if (thrown instanceof Error) {
				caught = thrown
			}
		}
		// biome-ignore lint/style/noNonNullAssertion: this is a test
		if (!caught!) throw new Error(`Expected an error to be thrown`)
		expect(caught).toBeInstanceOf(Error)
		expect(caught.message).toEqual(
			`Readonly Selector "doubled" not found in store "IMPLICIT_STORE".`,
		)
	})

	it(`deletes a selector`, () => {
		const countState = atom({
			key: `count`,
			default: 0,
		})
		const doubledState = selector({
			key: `doubled`,
			get: ({ get }) => get(countState),
		})
		dispose(doubledState, Internal.IMPLICIT.STORE)
		let caught: Error
		try {
			getState(doubledState)
		} catch (thrown) {
			if (thrown instanceof Error) {
				caught = thrown
			}
		}
		// biome-ignore lint/style/noNonNullAssertion: this is a test
		if (!caught!) throw new Error(`Expected an error to be thrown`)
		expect(caught).toBeInstanceOf(Error)
		expect(caught.message).toEqual(
			`Readonly Selector "doubled" not found in store "IMPLICIT_STORE".`,
		)
	})

	it(`deletes downstream, but not upstream, selectors from selector`, () => {
		const countState = atom({
			key: `count`,
			default: 0,
		})
		const countPlusOneState = selector({
			key: `countPlusOne`,
			get: ({ get }) => get(countState) + 1,
		})
		const countPlusTwoState = selector({
			key: `countPlusTwo`,
			get: ({ get }) => get(countPlusOneState) + 1,
		})
		const countPlusThreeState = selector({
			key: `countPlusThree`,
			get: ({ get }) => get(countPlusTwoState) + 1,
		})
		dispose(countPlusTwoState, Internal.IMPLICIT.STORE)
		expect(getState(countPlusOneState)).toEqual(1)
		let caught: Error
		try {
			getState(countPlusThreeState)
		} catch (thrown) {
			if (thrown instanceof Error) {
				caught = thrown
			}
		}
		// biome-ignore lint/style/noNonNullAssertion: this is a test
		if (!caught!) throw new Error(`Expected an error to be thrown`)
		expect(caught).toBeInstanceOf(Error)
		expect(caught.message).toEqual(
			`Readonly Selector "countPlusThree" not found in store "IMPLICIT_STORE".`,
		)
	})
})

describe(`auto disposability concept`, () => {
	function disposable<T extends object>(
		object: T,
		dispose: () => void,
	): Disposable & T {
		return Object.assign(object, { [Symbol.dispose]: dispose })
	}
	function disposableAtom<T>(
		options: AtomOptions<T>,
	): AtomToken<T> & Disposable {
		const atomToken = atom(options)
		return disposable(atomToken, () => dispose(atomToken))
	}
	it(`automatically disposes of an atom when it is dereferenced`, () => {
		function doSomeWorkWithAtomIO() {
			using countState = disposableAtom({
				key: `count`,
				default: 0,
			})
			console.log(JSON.stringify(countState))
			expect(getState(countState)).toBe(0)
		}
		doSomeWorkWithAtomIO()
		let caught: Error
		try {
			getState({ key: `count`, type: `atom` })
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
