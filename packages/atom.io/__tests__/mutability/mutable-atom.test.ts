import { vitest } from "vitest"

import type { Logger } from "atom.io"
import {
	atom,
	getState,
	redo,
	runTransaction,
	setState,
	subscribe,
	timeline,
	transaction,
	undo,
} from "atom.io"
import * as Internal from "atom.io/internal"
import { SetRTX } from "atom.io/transceivers/set-rtx"

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
	vitest.spyOn(Utils, `stdout0`)
	vitest.spyOn(Utils, `stdout1`)
	vitest.spyOn(Utils, `stdout2`)
})

describe(`mutable atomic state`, () => {
	it(`must hold a Transceiver whose changes can be tracked`, () => {
		const myMutableState = atom({
			key: `my::mutable`,
			mutable: true,
			default: () => new SetRTX(),
			toJson: (set) => [...set],
			fromJson: (array) => new SetRTX(array),
		})
		const myJsonState = Internal.getJsonToken(myMutableState)
		const myTrackerState = Internal.getUpdateToken(myMutableState)
		subscribe(myMutableState, Utils.stdout)
		subscribe(myJsonState, Utils.stdout)
		subscribe(myTrackerState, Utils.stdout)
		setState(myMutableState, (set) => set.add(`a`))
		expect(Utils.stdout).toHaveBeenCalledWith({
			newValue: new SetRTX([`a`]),
			oldValue: new SetRTX([`a`]),
		})
		expect(Utils.stdout).toHaveBeenCalledWith({
			newValue: [`a`],
			oldValue: [],
		})
		expect(Utils.stdout).not.toHaveBeenCalledWith({
			newValue: [`a`],
			oldValue: [`a`],
		})
		expect(Utils.stdout).toHaveBeenCalledWith({
			newValue: `0=add:"a"`,
			oldValue: null,
		})
	})

	it(`has its own family function for ease of use`, () => {
		const findFlagsStateByUserId = Internal.createMutableAtomFamily<
			SetRTX<string>,
			string[],
			string
		>(
			{
				key: `flagsByUserId::mutable`,
				mutable: true,
				default: () => new SetRTX(),
				toJson: (set) => [...set],
				fromJson: (array) => new SetRTX(array),
			},
			Internal.IMPLICIT.STORE,
		)

		const myFlagsState = findFlagsStateByUserId(`my-user-id`)
		const findFlagsByUserIdJSON = Internal.getJsonToken(myFlagsState)
		const findFlagsByUserIdTracker = Internal.getUpdateToken(myFlagsState)

		subscribe(myFlagsState, Utils.stdout)
		subscribe(findFlagsByUserIdJSON, Utils.stdout)
		subscribe(findFlagsByUserIdTracker, Utils.stdout)

		setState(myFlagsState, (set) => set.add(`a`))

		expect(Utils.stdout).toHaveBeenCalledWith({
			newValue: new SetRTX([`a`]),
			oldValue: new SetRTX([`a`]),
		})
		expect(Utils.stdout).toHaveBeenCalledWith({
			newValue: [`a`],
			oldValue: [],
		})
		expect(Utils.stdout).toHaveBeenCalledWith({
			newValue: `0=add:"a"`,
			oldValue: null,
		})
	})

	it(`can recover from a failed transaction`, () => {
		const myMutableState = atom({
			key: `my::mutable`,
			mutable: true,
			default: () => new SetRTX(),
			toJson: (set) => [...set],
			fromJson: (array) => new SetRTX(array),
		})

		const myTransaction = transaction({
			key: `myTx`,
			do: ({ set }) => {
				set(myMutableState, (mySet) => {
					mySet.transaction((next) => {
						next.add(`a`)
						next.add(`b`)
						return true
					})

					return mySet
				})
				throw new Error(`failed transaction`)
			},
		})

		const myJsonState = Internal.getJsonToken(myMutableState)
		subscribe(myJsonState, Utils.stdout)

		let caught: unknown
		try {
			runTransaction(myTransaction)()
		} catch (thrown) {
			caught = thrown
		} finally {
			expect(caught).toBeInstanceOf(Error)
			expect(Utils.stdout).not.toHaveBeenCalledWith({
				oldValue: [],
				newValue: [`a`, `b`],
			})
			expect(getState(myMutableState)).toEqual(new SetRTX())
		}
	})
})

describe(`mutable time traveling`, () => {
	it(`can travel back and forward in time`, () => {
		const myMutableState = atom({
			key: `my::mutable`,
			mutable: true,
			default: () => new SetRTX(),
			toJson: (set) => set.toJSON(),
			fromJson: (json) => SetRTX.fromJSON(json),
		})
		// debugger
		const myTL = timeline({
			key: `my::timeline`,
			atoms: [myMutableState],
		})
		const myJsonState = Internal.getJsonToken(myMutableState)
		const myTrackerState = Internal.getUpdateToken(myMutableState)
		subscribe(myMutableState, Utils.stdout0)
		subscribe(myJsonState, Utils.stdout1)
		subscribe(myTrackerState, Utils.stdout2)

		expect(getState(myMutableState)).toEqual(new SetRTX())
		setState(myMutableState, (set) => set.add(`a`))
		expect(getState(myMutableState)).toEqual(new SetRTX([`a`]))
		setState(myMutableState, (set) => set.add(`b`))
		expect(getState(myMutableState)).toEqual(new SetRTX([`a`, `b`]))
		undo(myTL)
		expect(getState(myMutableState)).toEqual(new SetRTX([`a`]))
		undo(myTL)
		expect(getState(myMutableState)).toEqual(new SetRTX())
		redo(myTL)
		expect(getState(myMutableState)).toEqual(new SetRTX([`a`]))
		redo(myTL)
		expect(getState(myMutableState)).toEqual(new SetRTX([`a`, `b`]))
	})
	it(`can travel back and forward in time with a transaction`, () => {
		const myMutableState = atom({
			key: `myMutableSet`,
			mutable: true,
			default: () => new SetRTX(),
			toJson: (set) => set.toJSON(),
			fromJson: (json) => SetRTX.fromJSON(json),
		})
		const myTL = timeline({
			key: `myTimeline`,
			atoms: [myMutableState],
		})
		const myTX = transaction<(newItem: string) => void>({
			key: `myTransaction`,
			do: ({ set }, newItem) => {
				set(myMutableState, (set) => set.add(newItem))
			},
		})

		const myJsonState = Internal.getJsonToken(myMutableState)
		const myTrackerState = Internal.getUpdateToken(myMutableState)
		subscribe(myMutableState, Utils.stdout0)
		subscribe(myJsonState, Utils.stdout1)
		subscribe(myTrackerState, Utils.stdout2)

		expect(getState(myMutableState)).toEqual(new SetRTX())
		runTransaction(myTX)(`a`)
		expect(getState(myMutableState)).toEqual(new SetRTX([`a`]))
		runTransaction(myTX)(`b`)
		expect(getState(myMutableState)).toEqual(new SetRTX([`a`, `b`]))
		undo(myTL)
		expect(getState(myMutableState)).toEqual(new SetRTX([`a`]))
		undo(myTL)
		expect(getState(myMutableState)).toEqual(new SetRTX())
		redo(myTL)
		expect(getState(myMutableState)).toEqual(new SetRTX([`a`]))
		redo(myTL)
		expect(getState(myMutableState)).toEqual(new SetRTX([`a`, `b`]))
	})
})
