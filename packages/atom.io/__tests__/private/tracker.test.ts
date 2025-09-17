import type { Logger } from "atom.io"
import {
	findState,
	getState,
	mutableAtom,
	mutableAtomFamily,
	runTransaction,
	setState,
	transaction,
} from "atom.io"
import * as Internal from "atom.io/internal"
import { Tracker } from "atom.io/internal"
import { UList } from "atom.io/transceivers/u-list"
import { vitest } from "vitest"

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
	vitest.spyOn(Utils, `stdout`)
})

afterEach(() => {
	expect(logger.warn).not.toHaveBeenCalled()
	expect(logger.error).not.toHaveBeenCalled()
})

describe(`tracker`, () => {
	test(`tracks the state of a mutable atom`, () => {
		const mutableSetState = mutableAtom<UList<string>>({
			key: `mutableSetState`,
			class: UList,
		})
		const { latestSignalToken } = new Tracker(
			mutableSetState,
			Internal.IMPLICIT.STORE,
		)

		expect(getState(mutableSetState)).toEqual(new UList())
		expect(getState(latestSignalToken)).toEqual(null)
		setState(latestSignalToken, { type: `add`, value: `x` })
		expect(getState(latestSignalToken)).toEqual({ type: `add`, value: `x` })
		expect(getState(mutableSetState)).toEqual(new UList([`x`]))
		setState(latestSignalToken, { type: `add`, value: `y` })
		expect(getState(latestSignalToken)).toEqual({ type: `add`, value: `y` })
		expect(getState(mutableSetState)).toEqual(new UList([`x`, `y`]))
	})

	test(`updates its core in a transaction`, () => {
		const mutableSetState = mutableAtom<UList<string>>({
			key: `mutableSetState`,
			class: UList,
		})
		const tracker = new Tracker(mutableSetState, Internal.IMPLICIT.STORE)
		const updateTrackerTX = transaction({
			key: `updateTrackerTX`,
			do: ({ set }) => {
				set(tracker.latestSignalToken, { type: `add`, value: `x` })
				set(tracker.latestSignalToken, { type: `add`, value: `y` })
			},
		})

		expect(getState(mutableSetState)).toEqual(new UList())
		expect(getState(tracker.latestSignalToken)).toEqual(null)
		runTransaction(updateTrackerTX)()
		expect(getState(mutableSetState)).toEqual(new UList([`x`, `y`]))
	})
})

describe(`trackerFamily`, () => {
	test(`tracks the state of a family of mutable atoms`, () => {
		const setAtoms = mutableAtomFamily<UList<string>, string>({
			key: `sets`,
			class: UList,
		})

		const latestUpdateStates = Internal.getUpdateFamily(
			setAtoms,
			Internal.IMPLICIT.STORE,
		)

		expect(getState(setAtoms, `a`)).toEqual(new UList())
		expect(getState(latestUpdateStates, `a`)).toEqual(null)
	})
	test(`updates the core of a new family member in a transaction`, () => {
		const setAtoms = mutableAtomFamily<UList<string>, string>({
			key: `findSetState`,
			class: UList,
		})

		const latestUpdateStates = Internal.getUpdateFamily(
			setAtoms,
			Internal.IMPLICIT.STORE,
		)
		const updateTrackerTX = transaction<(key: string) => void>({
			key: `updateTrackerTX`,
			do: ({ set }, key) => {
				const trackerState = findState(latestUpdateStates, key)
				set(trackerState, { type: `add`, value: `x` })
			},
		})

		expect(getState(findState(setAtoms, `a`))).toEqual(new UList())
		expect(getState(findState(latestUpdateStates, `a`))).toEqual(null)
		runTransaction(updateTrackerTX)(`a`)

		expect(getState(findState(setAtoms, `a`))).toEqual(new UList([`x`]))
		expect(getState(findState(setAtoms, `b`))).toEqual(new UList())
	})
})
