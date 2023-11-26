import { vitest } from "vitest"

import type { Logger } from "atom.io"

import {
	atom,
	atomFamily,
	getState,
	runTransaction,
	setState,
	transaction,
} from "atom.io"
import * as Internal from "atom.io/internal"
import { FamilyTracker, Tracker } from "atom.io/internal"
import { SetRTX } from "atom.io/transceivers/set-rtx"
import * as Utils from "../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 2

let logger: Logger

beforeEach(() => {
	Internal.clearStore()
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = Internal.IMPLICIT.STORE.logger
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(Utils, `stdout`)
})

describe(`tracker`, () => {
	test(`tracks the state of a mutable atom`, () => {
		const mutableSetState = atom<SetRTX<string>>({
			key: `mutableSetState`,
			default: new SetRTX(),
		})
		const { latestUpdateState } = new Tracker(mutableSetState)

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
		const mutableSetState = atom<SetRTX<string>>({
			key: `mutableSetState`,
			default: new SetRTX(),
		})
		const tracker = new Tracker(mutableSetState)
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
		const findSetState = atomFamily<SetRTX<string>, string>({
			key: `findSetState`,
			default: () => new SetRTX(),
		})
		const { findLatestUpdateState } = new FamilyTracker(findSetState)

		expect(getState(findSetState(`a`))).toEqual(new SetRTX())
		expect(getState(findLatestUpdateState(`a`))).toEqual(null)
	})
	test(`updates the core of a new family member in a transaction`, () => {
		const findSetState = atomFamily<SetRTX<string>, string>({
			key: `findSetState`,
			default: () => new SetRTX(),
		})
		const { findLatestUpdateState } = new FamilyTracker(findSetState)
		const updateTrackerTX = transaction<(key: string) => void>({
			key: `updateTrackerTX`,
			do: ({ set }, key) => {
				const trackerState = findLatestUpdateState(key)
				set(trackerState, `0=add:"x"`)
			},
		})

		expect(getState(findSetState(`a`))).toEqual(new SetRTX())
		expect(getState(findLatestUpdateState(`a`))).toEqual(null)
		runTransaction(updateTrackerTX)(`a`)

		expect(getState(findSetState(`a`))).toEqual(new SetRTX([`x`]))
		expect(getState(findSetState(`b`))).toEqual(new SetRTX())
	})
})
