import { vitest } from "vitest"

import * as UTIL from "./__util__"
import {
	__INTERNAL__,
	atom,
	atomFamily,
	getState,
	setLogLevel,
	setState,
} from "../src"
import { TransceiverSet, tracker, trackerFamily } from "../tracker/src"

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
		const mutableSetState = atom<TransceiverSet<number>>({
			key: `mutableSetState`,
			default: new TransceiverSet(),
		})
		const trackerState = tracker(mutableSetState)

		expect(getState(mutableSetState)).toEqual(new TransceiverSet())
		expect(getState(trackerState)).toEqual(null)
		setState(trackerState, `add:5`)
		expect(getState(trackerState)).toEqual(`add:5`)
		expect(getState(mutableSetState)).toEqual(new TransceiverSet([5]))
		setState(trackerState, `add:6`)
		expect(getState(trackerState)).toEqual(`add:6`)
		expect(getState(mutableSetState)).toEqual(new TransceiverSet([5, 6]))
	})
})

describe(`trackerFamily`, () => {
	test(`tracks the state of a family of mutable atoms`, () => {
		const findSetState = atomFamily<TransceiverSet<number>, string>({
			key: `findSetState`,
			default: new TransceiverSet(),
		})
		const findTrackerState = trackerFamily(findSetState)

		expect(getState(findSetState(`a`))).toEqual(new TransceiverSet())
		expect(getState(findTrackerState(`a`))).toEqual(null)
	})
})
