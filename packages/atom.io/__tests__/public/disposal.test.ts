import type { Logger } from "atom.io"
import {
	Anarchy,
	atom,
	atomFamily,
	disposeState,
	findState,
	getState,
	selector,
	selectorFamily,
	setState,
} from "atom.io"
import * as Internal from "atom.io/internal"

import * as Utils from "../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 2

let logger: Logger

beforeEach(() => {
	Internal.clearStore(Internal.IMPLICIT.STORE)
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = Internal.IMPLICIT.STORE.logger = Utils.createNullLogger()
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
})

describe(`disposeState`, () => {
	it(`does not delete a standalone atom`, () => {
		const countAtom = atom<number>({
			key: `count`,
			default: 0,
		})
		disposeState(countAtom)
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).toHaveBeenCalledTimes(1)
		expect(logger.error).toHaveBeenCalledWith(
			`❌`,
			countAtom.type,
			countAtom.key,
			`Standalone atoms cannot be disposed.`,
		)
	})
	it(`deletes atoms that belong to a family`, () => {
		const countAtoms = atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		const countState = findState(countAtoms, `count`)
		getState(countState)
		disposeState(countState)
		expect(Internal.IMPLICIT.STORE.atoms.has(countState.key)).toBe(false)
		expect(Internal.IMPLICIT.STORE.valueMap.has(countState.key)).toBe(false)
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
	it(`does not delete downstream selectors from atom`, () => {
		const countKeysAtom = atom<string[]>({
			key: `countKeys`,
			default: [],
		})
		const countAtoms = atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		const doubleSelectors = selectorFamily<number, string>({
			key: `double`,
			get:
				(id) =>
				({ find, get }) =>
					get(find(countAtoms, id)) * 2,
		})
		const allDoublesSelector = selector<number[]>({
			key: `allDoubles`,
			get: ({ get }) =>
				get(countKeysAtom).map((key) => get(doubleSelectors, key)),
		})
		const countAtom = findState(countAtoms, `my-key`)
		const doubleSelector = findState(doubleSelectors, `my-key`)
		setState(countAtom, 2)
		setState(countKeysAtom, (current) => [...current, `my-key`])
		expect(getState(allDoublesSelector)).toEqual([4])
		disposeState(countAtoms, `my-key`)
		setState(countKeysAtom, (current) => [...current, `my-key`])
		expect(logger.error).not.toHaveBeenCalled()
		expect(Internal.IMPLICIT.STORE.atoms.has(countAtom.key)).toBe(false)
		expect(Internal.IMPLICIT.STORE.valueMap.has(countAtom.key)).toBe(false)
		expect(
			Internal.IMPLICIT.STORE.readonlySelectors.has(doubleSelector.key),
		).toBe(true)
		expect(Internal.IMPLICIT.STORE.valueMap.has(doubleSelector.key)).toBe(true)
		expect(
			Internal.IMPLICIT.STORE.readonlySelectors.has(allDoublesSelector.key),
		).toBe(true)
		expect(Internal.IMPLICIT.STORE.valueMap.has(allDoublesSelector.key)).toBe(
			false,
		)
		expect(getState(doubleSelector)).toBe(4)

		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
	it(`logs an error if the atom is not in the store`, () => {
		const countAtoms = atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		const countState = findState(countAtoms, `my-key`)
		getState(countState)
		disposeState(countState)
		disposeState(countState)
		expect(logger.error).toHaveBeenCalledTimes(1)
		setState(countAtoms, `my-key`, 1)
	})

	it(`does not delete a standalone selector`, () => {
		const countAtom = atom<number>({
			key: `count`,
			default: 0,
		})
		const doubleSelector = selector<number>({
			key: `double`,
			get: ({ get }) => get(countAtom),
		})
		disposeState(doubleSelector)
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).toHaveBeenCalledTimes(1)
		expect(logger.error).toHaveBeenCalledWith(
			`❌`,
			doubleSelector.type,
			doubleSelector.key,
			`Standalone selectors cannot be disposed.`,
		)
	})

	it(`deletes readonly selectors that belong to a family`, () => {
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
		getState(doubledState)
		disposeState(doubledState)
		expect(logger.error).not.toHaveBeenCalled()
		expect(Internal.IMPLICIT.STORE.writableSelectors.has(doubledState.key)).toBe(
			false,
		)
		expect(Internal.IMPLICIT.STORE.valueMap.has(doubledState.key)).toBe(false)
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
	it(`deletes writable selectors that belong to a family`, () => {
		const countAtoms = atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		const tripledSelectors = selectorFamily<number, string>({
			key: `tripled`,
			get:
				(id) =>
				({ get }) =>
					get(countAtoms, id) * 3,
			set:
				(id) =>
				({ set }, newValue) => {
					set(countAtoms, id, newValue / 3)
				},
		})
		const tripledState = findState(tripledSelectors, `my-key`)
		getState(tripledState)
		disposeState(tripledState)
		expect(logger.error).not.toHaveBeenCalled()
		expect(Internal.IMPLICIT.STORE.writableSelectors.has(tripledState.key)).toBe(
			false,
		)
		expect(Internal.IMPLICIT.STORE.valueMap.has(tripledState.key)).toBe(false)
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
	it(`disconnects selectors that have been allocated to a molecule`, () => {
		const countAtoms = atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		const tripledSelectors = selectorFamily<number, string>({
			key: `tripled`,
			get:
				(id) =>
				({ find, get }) =>
					get(find(countAtoms, id)) * 3,
		})
		Internal.IMPLICIT.STORE.config.lifespan = `immortal`
		const anarchy = new Anarchy()
		anarchy.allocate(`root`, `hi`)
		setState(countAtoms, `hi`, 1)
		const triple = getState(tripledSelectors, `hi`)
		expect(triple).toBe(3)
		disposeState(tripledSelectors, `hi`)

		expect(
			Internal.IMPLICIT.STORE.writableSelectors.has(tripledSelectors.key),
		).toBe(false)

		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
})
