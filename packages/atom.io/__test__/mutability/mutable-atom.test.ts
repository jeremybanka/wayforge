import { vitest } from "vitest"

import { __INTERNAL__, setLogLevel, setState, subscribe } from "atom.io"
import {
	createMutableAtom,
	createMutableAtomFamily,
	getJsonToken,
	getTrackerToken,
} from "atom.io/mutable"
import { TransceiverSet } from "atom.io/tracker"

import * as UTIL from "../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 1
setLogLevel(LOG_LEVELS[CHOOSE])
const logger = __INTERNAL__.IMPLICIT.STORE.config.logger ?? console

beforeEach(() => {
	__INTERNAL__.clearStore()
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(UTIL, `stdout`)
})

describe(`mutable atomic state`, () => {
	it(`must hold a Transceiver whose changes can be tracked`, () => {
		const myMutableState = createMutableAtom({
			key: `my::mutable`,
			default: () => new TransceiverSet(),
			toJson: (set) => [...set],
			fromJson: (array) => new TransceiverSet(array),
		})
		const myJsonState = getJsonToken(myMutableState)
		const myTrackerState = getTrackerToken(myMutableState)
		subscribe(myMutableState, UTIL.stdout)
		subscribe(myJsonState, UTIL.stdout)
		subscribe(myTrackerState, UTIL.stdout)
		setState(myMutableState, (set) => set.add(`a`))
		expect(UTIL.stdout).toHaveBeenCalledWith({
			newValue: new TransceiverSet([`a`]),
			oldValue: new TransceiverSet([`a`]),
		})
		expect(UTIL.stdout).toHaveBeenCalledWith({
			newValue: [`a`],
			oldValue: [],
		})
		expect(UTIL.stdout).toHaveBeenCalledWith({
			newValue: `add:a`,
			oldValue: null,
		})
	})

	it(`has its own family function for ease of use`, () => {
		const findFlagsStateByUserId = createMutableAtomFamily<
			TransceiverSet<string>,
			string[],
			string
		>({
			key: `flagsByUserId::mutable`,
			default: () => new TransceiverSet(),
			toJson: (set) => [...set],
			fromJson: (array) => new TransceiverSet(array),
		})
		console.log(findFlagsStateByUserId)

		const myFlagsState = findFlagsStateByUserId(`my-user-id`)
		const findFlagsByUserIdJSON = getJsonToken(myFlagsState)
		const findFlagsByUserIdTracker = getTrackerToken(myFlagsState)

		subscribe(myFlagsState, UTIL.stdout)
		subscribe(findFlagsByUserIdJSON, UTIL.stdout)
		subscribe(findFlagsByUserIdTracker, UTIL.stdout)

		setState(myFlagsState, (set) => set.add(`a`))

		expect(UTIL.stdout).toHaveBeenCalledWith({
			newValue: new TransceiverSet([`a`]),
			oldValue: new TransceiverSet([`a`]),
		})
		expect(UTIL.stdout).toHaveBeenCalledWith({
			newValue: [`a`],
			oldValue: [],
		})
		expect(UTIL.stdout).toHaveBeenCalledWith({
			newValue: `add:a`,
			oldValue: null,
		})
	})
})
