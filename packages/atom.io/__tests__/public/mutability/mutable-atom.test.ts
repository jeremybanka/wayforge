import type { Logger } from "atom.io"
import {
	atom,
	atomFamily,
	disposeState,
	findState,
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
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"
import { vitest } from "vitest"

import * as Utils from "../../__util__"

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
	vitest.spyOn(Utils, `stdout0`)
	vitest.spyOn(Utils, `stdout1`)
	vitest.spyOn(Utils, `stdout2`)
})

describe(`mutable atomic state`, () => {
	it(`must hold a Transceiver whose changes can be tracked`, () => {
		const myMutableState = atom<SetRTX<string>, SetRTXJson<string>>({
			key: `letters`,
			mutable: true,
			default: () => new SetRTX<string>(),
			toJson: (set) => set.toJSON(),
			fromJson: (json) => SetRTX.fromJSON(json),
		})
		const myJsonState = Internal.getJsonToken(
			Internal.IMPLICIT.STORE,
			myMutableState,
		)
		const myTrackerState = Internal.getUpdateToken(myMutableState)
		subscribe(myMutableState, Utils.stdout0)
		subscribe(myJsonState, Utils.stdout1)
		subscribe(myTrackerState, Utils.stdout2)
		setState(myMutableState, (set) => set.add(`a`))
		expect(Utils.stdout0).toHaveBeenCalledWith({
			newValue: new SetRTX([`a`]),
			oldValue: new SetRTX([`a`]),
		})
		expect(Utils.stdout1).toHaveBeenCalledWith({
			newValue: {
				members: [`a`],
				cache: [],
				cacheLimit: 0,
				cacheUpdateNumber: 0,
				cacheIdx: -1,
			},
			oldValue: {
				members: [],
				cache: [],
				cacheLimit: 0,
				cacheUpdateNumber: -1,
				cacheIdx: -1,
			},
		})
		expect(Utils.stdout2).toHaveBeenCalledWith({
			newValue: `0=add:"a"`,
			oldValue: null,
		})
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})

	it(`has its own family function for ease of use`, () => {
		const findFlagsStateByUserId = Internal.createMutableAtomFamily<
			SetRTX<string>,
			SetRTXJson<string>,
			string
		>(Internal.IMPLICIT.STORE, {
			key: `flagsByUserId::mutable`,
			mutable: true,
			default: () => new SetRTX(),
			toJson: (set) => set.toJSON(),
			fromJson: (array) => SetRTX.fromJSON(array),
		})

		const myFlagsState = findState(findFlagsStateByUserId, `my-user-id`)
		const findFlagsByUserIdJSON = Internal.getJsonToken(
			Internal.IMPLICIT.STORE,
			myFlagsState,
		)
		const findFlagsByUserIdTracker = Internal.getUpdateToken(myFlagsState)

		subscribe(myFlagsState, Utils.stdout0)
		subscribe(findFlagsByUserIdJSON, Utils.stdout1)
		subscribe(findFlagsByUserIdTracker, Utils.stdout2)

		setState(myFlagsState, (set) => set.add(`a`))

		expect(Utils.stdout0).toHaveBeenCalledWith({
			newValue: new SetRTX([`a`]),
			oldValue: new SetRTX([`a`]),
		})
		expect(Utils.stdout1).toHaveBeenCalledWith({
			newValue: {
				members: [`a`],
				cache: [],
				cacheLimit: 0,
				cacheUpdateNumber: 0,
				cacheIdx: -1,
			},
			oldValue: {
				members: [],
				cache: [],
				cacheLimit: 0,
				cacheUpdateNumber: -1,
				cacheIdx: -1,
			},
		})
		expect(Utils.stdout2).toHaveBeenCalledWith({
			newValue: `0=add:"a"`,
			oldValue: null,
		})
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})

	it(`can recover from a failed transaction`, () => {
		const myMutableState = atom<SetRTX<string>, string[]>({
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

		const myJsonState = Internal.getJsonToken(
			Internal.IMPLICIT.STORE,
			myMutableState,
		)
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
	afterEach(() => {
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
	it(`can travel back and forward in time`, () => {
		const myMutableStates = atomFamily<
			SetRTX<string>,
			SetRTXJson<string>,
			string
		>({
			key: `myMutable`,
			mutable: true,
			default: () => new SetRTX(),
			toJson: (set) => set.toJSON(),
			fromJson: (json) => SetRTX.fromJSON(json),
		})
		const myMutableState = findState(myMutableStates, `example`)
		const myTL = timeline({
			key: `myTimeline`,
			scope: [myMutableStates],
		})
		const myJsonState = Internal.getJsonToken(
			Internal.IMPLICIT.STORE,
			myMutableState,
		)
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
		const myMutableState = atom<SetRTX<string>, SetRTXJson<string>>({
			key: `myMutableSet`,
			mutable: true,
			default: () => new SetRTX(),
			toJson: (set) => set.toJSON(),
			fromJson: (json) => SetRTX.fromJSON(json),
		})
		const myTL = timeline({
			key: `myTimeline`,
			scope: [myMutableState],
		})
		const myTX = transaction<(newItem: string) => void>({
			key: `myTransaction`,
			do: ({ set }, newItem) => {
				set(myMutableState, (s) => s.add(newItem))
			},
		})

		const myJsonState = Internal.getJsonToken(
			Internal.IMPLICIT.STORE,
			myMutableState,
		)
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

describe(`mutable atom effects`, () => {
	afterEach(() => {
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
	it(`runs a callback when the atom is set`, () => {
		let setSize = 0
		const myMutableAtoms = atomFamily<
			SetRTX<string>,
			SetRTXJson<string>,
			string
		>({
			key: `myMutableAtoms`,
			default: () => new SetRTX(),
			mutable: true,
			toJson: (s) => s.toJSON(),
			fromJson: (json) => SetRTX.fromJSON(json),
			effects: () => [
				({ onSet }) => {
					onSet(({ newValue }) => {
						setSize += newValue.size
					})
					return () => {
						setSize = 0
					}
				},
			],
		})

		setState(myMutableAtoms, `myMutableState`, (prev) => prev.add(`a`))
		expect(setSize).toBe(1)
		disposeState(myMutableAtoms, `myMutableState`)
		expect(setSize).toBe(0)
	})
	it(`can set a mutable atom in response to an external event`, () => {
		const letterSubject = new Internal.StatefulSubject<{ letter: string }>({
			letter: `A`,
		})
		const myMutableState = atom<SetRTX<string>, SetRTXJson<string>>({
			key: `myMutableState`,
			default: () => new SetRTX([letterSubject.state.letter]),
			mutable: true,
			toJson: (s) => s.toJSON(),
			fromJson: (json) => SetRTX.fromJSON(json),
			effects: [
				({ setSelf }) => {
					const unsubscribe = letterSubject.subscribe(
						`mutable atom effect`,
						({ letter }) => {
							setSelf((s) => s.add(letter))
						},
					)
					return unsubscribe
				},
			],
		})

		letterSubject.next({ letter: `B` })
		expect(getState(myMutableState)).toEqual(new SetRTX([`A`, `B`]))
	})
})

describe(`graceful handling of hmr/duplicate atom keys`, () => {
	it(`logs an error if an atom is created with the same key as an existing atom`, () => {
		const myMutableState = atom<SetRTX<string>, SetRTXJson<string>>({
			key: `myMutableState`,
			default: () => new SetRTX(),
			mutable: true,
			toJson: (s) => s.toJSON(),
			fromJson: (json) => SetRTX.fromJSON(json),
		})
		atom<SetRTX<string>, SetRTXJson<string>>({
			key: `myMutableState`,
			default: () => new SetRTX(),
			mutable: true,
			toJson: (s) => s.toJSON(),
			fromJson: (json) => SetRTX.fromJSON(json),
		})
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).toHaveBeenCalledTimes(1)
		expect(logger.error).toHaveBeenCalledWith(
			`❌`,
			myMutableState.type,
			myMutableState.key,
			`Tried to create atom, but it already exists in the store.`,
		)
	})
})
