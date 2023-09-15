import { vitest } from "vitest"

import {
	__INTERNAL__,
	atom,
	atomFamily,
	getState,
	runTransaction,
	setLogLevel,
	setState,
	transaction,
} from "atom.io"
import { tracker, trackerFamily } from "atom.io/internal"
import { TransceiverSet } from "~/packages/anvl/reactivity"
import * as UTIL from "../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 0
setLogLevel(LOG_LEVELS[CHOOSE])
const logger = __INTERNAL__.IMPLICIT.STORE.config.logger ?? console

beforeEach(() => {
	__INTERNAL__.clearStore()
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(UTIL, `stdout`)
})

describe(`tracker`, () => {
	test(`tracks the state of a mutable atom`, () => {
		const mutableSetState = atom<TransceiverSet<string>>({
			key: `mutableSetState`,
			default: new TransceiverSet(),
		})
		const trackerState = tracker(mutableSetState)

		expect(getState(mutableSetState)).toEqual(new TransceiverSet())
		expect(getState(trackerState)).toEqual(null)
		setState(trackerState, `add:x`)
		expect(getState(trackerState)).toEqual(`add:x`)
		expect(getState(mutableSetState)).toEqual(new TransceiverSet([`x`]))
		setState(trackerState, `add:y`)
		expect(getState(trackerState)).toEqual(`add:y`)
		expect(getState(mutableSetState)).toEqual(new TransceiverSet([`x`, `y`]))
	})

	test(`updates its core in a transaction`, () => {
		const mutableSetState = atom<TransceiverSet<string>>({
			key: `mutableSetState`,
			default: new TransceiverSet(),
		})
		const trackerState = tracker(mutableSetState)
		const updateTrackerTX = transaction({
			key: `updateTrackerTX`,
			do: ({ set }) => {
				set(trackerState, `add:x`)
				set(trackerState, `add:y`)
			},
		})

		expect(getState(mutableSetState)).toEqual(new TransceiverSet())
		expect(getState(trackerState)).toEqual(null)
		runTransaction(updateTrackerTX)()
		expect(getState(mutableSetState)).toEqual(new TransceiverSet([`x`, `y`]))
	})
})

describe(`trackerFamily`, () => {
	test(`tracks the state of a family of mutable atoms`, () => {
		const findSetState = atomFamily<TransceiverSet<string>, string>({
			key: `findSetState`,
			default: () => new TransceiverSet(),
		})
		const findTrackerState = trackerFamily(findSetState)

		expect(getState(findSetState(`a`))).toEqual(new TransceiverSet())
		expect(getState(findTrackerState(`a`))).toEqual(null)
	})
	test(`updates the core of a new family member in a transaction`, () => {
		const findSetState = atomFamily<TransceiverSet<string>, string>({
			key: `findSetState`,
			default: () => new TransceiverSet(),
		})
		const findTrackerState = trackerFamily(findSetState)
		const updateTrackerTX = transaction<(key: string) => void>({
			key: `updateTrackerTX`,
			do: ({ set }, key) => {
				const trackerState = findTrackerState(key)
				set(trackerState, `add:x`)
			},
		})

		expect(getState(findSetState(`a`))).toEqual(new TransceiverSet())
		expect(getState(findTrackerState(`a`))).toEqual(null)
		runTransaction(updateTrackerTX)(`a`)

		expect(getState(findSetState(`a`))).toEqual(new TransceiverSet([`x`]))
		expect(getState(findSetState(`b`))).toEqual(new TransceiverSet())
	})
})
