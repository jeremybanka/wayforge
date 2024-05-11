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
import { findState } from "atom.io/ephemeral"
import * as Internal from "atom.io/internal"

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
})

describe(`disposeState`, () => {
	it(`does not delete a standalone atom`, () => {
		const countState = atom<number>({
			key: `count`,
			default: 0,
		})
		expect(countState.key).toEqual(`count`)
		disposeState(countState, Internal.IMPLICIT.STORE)
		expect(logger.error).toHaveBeenCalledTimes(1)
		expect(logger.error).toHaveBeenCalledWith(
			`❌`,
			`atom`,
			`count`,
			`Standalone atoms cannot be disposed.`,
		)
	})
	it(`deletes atoms that belong to a family`, () => {
		const findCountState = atomFamily<number, string>({
			key: `findCount`,
			default: 0,
		})
		const countState = findCountState(`count`)
		disposeState(countState, Internal.IMPLICIT.STORE)
		expect(logger.error).toHaveBeenCalledTimes(0)
		expect(Internal.IMPLICIT.STORE.atoms.has(countState.key)).toBe(false)
		expect(Internal.IMPLICIT.STORE.valueMap.has(countState.key)).toBe(false)
	})
	it(`deletes downstream selectors from atom`, () => {
		const countAtoms = atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		const doubleSelectors = selectorFamily<number, string>({
			key: `doubled`,
			get:
				(key) =>
				({ find, get }) =>
					get(find(countAtoms, key)) * 2,
		})
		const countState = findState(countAtoms, `my-key`)
		const doubledState = findState(doubleSelectors, `my-key`)
		setState(countState, 2)
		expect(getState(doubledState)).toBe(4)
		disposeState(countState, Internal.IMPLICIT.STORE)
		expect(logger.error).toHaveBeenCalledTimes(0)
		expect(Internal.IMPLICIT.STORE.atoms.has(countState.key)).toBe(false)
		expect(Internal.IMPLICIT.STORE.valueMap.has(countState.key)).toBe(false)
		expect(Internal.IMPLICIT.STORE.readonlySelectors.has(doubledState.key)).toBe(
			false,
		)
		expect(Internal.IMPLICIT.STORE.valueMap.has(doubledState.key)).toBe(false)
	})
	it(`logs an error if the atom is not in the store`, () => {
		const countAtoms = atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		const countState = findState(countAtoms, `my-key`)
		disposeState(countState, Internal.IMPLICIT.STORE)
		disposeState(countState, Internal.IMPLICIT.STORE)
		expect(logger.error).toHaveBeenCalledTimes(1)
		expect(logger.error).toHaveBeenCalledWith(
			`❌`,
			`atom`,
			`count("my-key")`,
			`Tried to dispose atom, but it does not exist in the store.`,
		)
	})

	it(`does not delete a standalone selector`, () => {
		const countState = atom<number>({
			key: `count`,
			default: 0,
		})
		const doubledState = selector<number>({
			key: `doubled`,
			get: ({ get }) => get(countState),
		})
		disposeState(doubledState, Internal.IMPLICIT.STORE)
		expect(logger.error).toHaveBeenCalledTimes(1)
		expect(logger.error).toHaveBeenCalledWith(
			`❌`,
			`selector`,
			`doubled`,
			`Standalone selectors cannot be disposed.`,
		)
	})

	it(`deletes selectors that belong to a family`, () => {
		const countAtoms = atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		const doubledSelectors = selectorFamily<number, string>({
			key: `doubled`,
			get:
				(id) =>
				({ find, get }) =>
					get(find(countAtoms, id)) * 2,
		})
		const doubledState = findState(doubledSelectors, `my-key`)
		disposeState(doubledState, Internal.IMPLICIT.STORE)
		expect(logger.error).toHaveBeenCalledTimes(0)
		expect(Internal.IMPLICIT.STORE.selectors.has(doubledState.key)).toBe(false)
		expect(Internal.IMPLICIT.STORE.valueMap.has(doubledState.key)).toBe(false)
	})

	it(`deletes downstream, but not upstream, selectors from selector`, () => {
		const countAtoms = atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		const countPlusOneSelectors = selectorFamily<number, string>({
			key: `countPlusOne`,
			get:
				(id) =>
				({ find, get }) =>
					get(find(countAtoms, id)) + 1,
		})
		const countPlusTwoSelectors = selectorFamily<number, string>({
			key: `countPlusTwo`,
			get:
				(id) =>
				({ find, get }) =>
					get(find(countPlusOneSelectors, id)) + 1,
			set:
				(id) =>
				({ find, set }, newValue) => {
					set(find(countAtoms, id), newValue - 2)
				},
		})
		const countPlusThreeSelectors = selectorFamily<number, string>({
			key: `countPlusThree`,
			get:
				(id) =>
				({ find, get }) =>
					get(find(countPlusTwoSelectors, id)) + 1,
		})
		const countPlusOneState = findState(countPlusOneSelectors, `my-key`)
		const countPlusTwoState = findState(countPlusTwoSelectors, `my-key`)
		const countPlusThreeState = findState(countPlusThreeSelectors, `my-key`)
		disposeState(countPlusTwoState, Internal.IMPLICIT.STORE)
		expect(logger.error).toHaveBeenCalledTimes(0)
		expect(
			Internal.IMPLICIT.STORE.readonlySelectors.has(countPlusOneState.key),
		).toBe(true)
		expect(Internal.IMPLICIT.STORE.valueMap.has(countPlusOneState.key)).toBe(
			true,
		)
		expect(Internal.IMPLICIT.STORE.selectors.has(countPlusTwoState.key)).toBe(
			false,
		)
		expect(Internal.IMPLICIT.STORE.valueMap.has(countPlusTwoState.key)).toBe(
			false,
		)
		expect(Internal.IMPLICIT.STORE.selectors.has(countPlusThreeState.key)).toBe(
			false,
		)
		expect(Internal.IMPLICIT.STORE.valueMap.has(countPlusThreeState.key)).toBe(
			false,
		)
	})
})
