import { vitest } from "vitest"

import {
	__INTERNAL__,
	getState,
	runTransaction,
	setLogLevel,
	setState,
	subscribe,
	transaction,
} from "atom.io"
import {
	createMutableAtom,
	createMutableAtomFamily,
	getJsonToken,
	getTrackerToken,
} from "atom.io/internal"

import { TransceiverSet } from "~/packages/anvl/reactivity"
import { withdraw } from "../../internal/src"
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
			mutable: true,
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
			mutable: true,
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

	it(`can recover from a failed transaction`, () => {
		const myMutableState = createMutableAtom({
			key: `my::mutable`,
			mutable: true,
			default: () => new TransceiverSet(),
			toJson: (set) => [...set],
			fromJson: (array) => new TransceiverSet(array),
		})

		const myTransaction = transaction({
			key: `myTx`,
			do: ({ set }) => {
				set(myMutableState, (mySet) => {
					mySet.startTransaction()
					mySet.add(`a`)
					mySet.add(`b`)
					mySet.applyTransaction()
					return mySet
				})
				throw new Error(`failed transaction`)
			},
		})

		const myJsonState = getJsonToken(myMutableState)
		subscribe(myJsonState, UTIL.stdout)

		let caught: unknown
		try {
			runTransaction(myTransaction)()
		} catch (thrown) {
			caught = thrown
		} finally {
			expect(caught).toBeInstanceOf(Error)
			expect(UTIL.stdout).not.toHaveBeenCalledWith({
				oldValue: [],
				newValue: [`a`, `b`],
			})
			expect(getState(myMutableState)).toEqual(new TransceiverSet())
		}
	})
})
