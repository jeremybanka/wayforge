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
import { SetRTX } from "atom.io/transceivers/set-rtx"
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
		const mutableSetState = mutableAtom({
			key: `mutableSetState`,
			class: SetRTX<string>,
		})
		const { latestUpdateState } = new Tracker(
			mutableSetState,
			Internal.IMPLICIT.STORE,
		)

		expect(getState(mutableSetState)).toEqual(new SetRTX())
		expect(getState(latestUpdateState)).toEqual(null)
		setState(latestUpdateState, `0=add:"x"`)
		expect(getState(latestUpdateState)).toEqual(`0=add:"x"`)
		expect(getState(mutableSetState)).toEqual(new SetRTX([`x`]))
		setState(latestUpdateState, `1=add:"y"`)
		expect(getState(latestUpdateState)).toEqual(`1=add:"y"`)
		expect(getState(mutableSetState)).toEqual(new SetRTX([`x`, `y`]))
	})

	test(`updates its core in a transaction`, () => {
		const mutableSetState = mutableAtom({
			key: `mutableSetState`,
			class: SetRTX<string>,
		})
		const tracker = new Tracker(mutableSetState, Internal.IMPLICIT.STORE)
		const updateTrackerTX = transaction({
			key: `updateTrackerTX`,
			do: ({ set }) => {
				set(tracker.latestUpdateState, `0=add:"x"`)
				set(tracker.latestUpdateState, `1=add:"y"`)
			},
		})

		expect(getState(mutableSetState)).toEqual(new SetRTX())
		expect(getState(tracker.latestUpdateState)).toEqual(null)
		runTransaction(updateTrackerTX)()
		expect(getState(mutableSetState)).toEqual(new SetRTX([`x`, `y`]))
	})
})

describe(`trackerFamily`, () => {
	test(`tracks the state of a family of mutable atoms`, () => {
		const setAtoms = mutableAtomFamily<SetRTX<string>, string>({
			key: `sets`,
			class: SetRTX,
		})

		const latestUpdateStates = Internal.getUpdateFamily(
			setAtoms,
			Internal.IMPLICIT.STORE,
		)

		expect(getState(setAtoms, `a`)).toEqual(new SetRTX())
		expect(getState(latestUpdateStates, `a`)).toEqual(null)
	})
	test(`updates the core of a new family member in a transaction`, () => {
		const setAtoms = mutableAtomFamily<SetRTX<string>, string>({
			key: `findSetState`,
			class: SetRTX,
		})

		const latestUpdateStates = Internal.getUpdateFamily(
			setAtoms,
			Internal.IMPLICIT.STORE,
		)
		const updateTrackerTX = transaction<(key: string) => void>({
			key: `updateTrackerTX`,
			do: ({ set }, key) => {
				const trackerState = findState(latestUpdateStates, key)
				set(trackerState, `0=add:"x"`)
			},
		})

		expect(getState(findState(setAtoms, `a`))).toEqual(new SetRTX())
		expect(getState(findState(latestUpdateStates, `a`))).toEqual(null)
		runTransaction(updateTrackerTX)(`a`)

		expect(getState(findState(setAtoms, `a`))).toEqual(new SetRTX([`x`]))
		expect(getState(findState(setAtoms, `b`))).toEqual(new SetRTX())
	})
})
