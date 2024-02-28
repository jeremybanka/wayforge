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
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"
import { a } from "~/packages/anvl/src/json-schema/integer"
import * as Utils from "../__util__"

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
	vitest.spyOn(Utils, `stdout`)
})

describe(`tracker`, () => {
	test(`tracks the state of a mutable atom`, () => {
		const mutableSetState = atom({
			key: `mutableSetState`,
			default: () => new SetRTX(),
			mutable: true,
			toJson: (set) => [...set],
			fromJson: (array) => new SetRTX(array),
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
		const mutableSetState = atom({
			key: `mutableSetState`,
			default: () => new SetRTX(),
			mutable: true,
			toJson: (set) => [...set],
			fromJson: (array) => new SetRTX(array),
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
		const setAtoms = atomFamily<SetRTX<string>, SetRTXJson<string>, string>({
			key: `findSetState`,
			default: () => new SetRTX(),
			mutable: true,
			toJson: (set) => set.toJSON(),
			fromJson: (json) => SetRTX.fromJSON(json),
		})
		const findSetState = Internal.withdraw(setAtoms, Internal.IMPLICIT.STORE)
		const { findLatestUpdateState } = new FamilyTracker(
			findSetState,
			Internal.IMPLICIT.STORE,
		)

		expect(getState(findSetState(`a`))).toEqual(new SetRTX())
		expect(getState(findLatestUpdateState(`a`))).toEqual(null)
	})
	test(`updates the core of a new family member in a transaction`, () => {
		const setAtoms = atomFamily<SetRTX<string>, SetRTXJson<string>, string>({
			key: `findSetState`,
			default: () => new SetRTX(),
			mutable: true,
			toJson: (set) => set.toJSON(),
			fromJson: (json) => SetRTX.fromJSON(json),
		})
		const findSetState = Internal.withdraw(setAtoms, Internal.IMPLICIT.STORE)
		const { findLatestUpdateState } = new FamilyTracker(
			findSetState,
			Internal.IMPLICIT.STORE,
		)
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
