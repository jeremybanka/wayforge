import type { Logger } from "atom.io"
import {
	disposeState,
	findState,
	getState,
	mutableAtom,
	mutableAtomFamily,
	redo,
	runTransaction,
	setState,
	subscribe,
	timeline,
	transaction,
	undo,
} from "atom.io"
import * as Internal from "atom.io/internal"
import { OList } from "atom.io/transceivers/o-list"
import { SetRTX } from "atom.io/transceivers/set-rtx"
import { UList } from "atom.io/transceivers/u-list"
import { vitest } from "vitest"

import * as Utils from "../../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 3

let logger: Logger

beforeEach(() => {
	Internal.clearStore(Internal.IMPLICIT.STORE)
	Internal.IMPLICIT.STORE.config.isProduction = true
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = Internal.IMPLICIT.STORE.logger = Utils.createNullLogger()
	vitest.spyOn(logger, `error`).mockReset()
	vitest.spyOn(logger, `warn`).mockReset()
	vitest.spyOn(logger, `info`).mockReset()
	vitest.spyOn(Utils, `stdout`).mockReset()
	vitest.spyOn(Utils, `stdout0`).mockReset()
	vitest.spyOn(Utils, `stdout1`).mockReset()
	vitest.spyOn(Utils, `stdout2`).mockReset()
})

describe(`mutable atomic state`, () => {
	it(`must hold a Transceiver whose changes can be tracked`, () => {
		const myMutableAtom = mutableAtom<UList<string>>({
			key: `myMutable`,
			class: UList,
		})
		const myJsonState = Internal.getJsonToken(
			Internal.IMPLICIT.STORE,
			myMutableAtom,
		)
		const myTrackerState = Internal.getUpdateToken(myMutableAtom)
		subscribe(myMutableAtom, Utils.stdout0)
		subscribe(myJsonState, Utils.stdout1)
		subscribe(myTrackerState, Utils.stdout2)
		setState(myMutableAtom, (set) => set.add(`a`))
		expect(Utils.stdout0).toHaveBeenCalledWith({
			newValue: new UList([`a`]),
			oldValue: new UList([`a`]),
		})
		expect(Utils.stdout1).toHaveBeenCalledWith({
			newValue: [`a`],
			oldValue: [],
		})
		expect(Utils.stdout2).toHaveBeenCalledWith({
			newValue: `0\u001F\u0003a`,
			oldValue: null,
		})
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})

	it(`has its own family function for ease of use`, () => {
		const findFlagsStateByUserId = Internal.createMutableAtomFamily<
			OList<string>,
			string
		>(Internal.IMPLICIT.STORE, {
			key: `flagsByUserId::mutable`,
			class: OList,
		})

		const myFlagsState = findState(findFlagsStateByUserId, `my-user-id`)
		const findFlagsByUserIdJSON = Internal.getJsonToken(
			Internal.IMPLICIT.STORE,
			myFlagsState,
		)
		const findFlagsByUserIdTracker = Internal.getUpdateToken(myFlagsState)

		subscribe(myFlagsState, Utils.stdout0)
		subscribe(findFlagsByUserIdJSON, Utils.stdout1)
		subscribe(findFlagsByUserIdTracker, (u) => {
			// for (const k of u.newValue) console.log({ k })
			// console.log(Utils.toBytes(u.newValue))
			Utils.stdout2(u)
		})

		setState(myFlagsState, (ol) => ((ol[0] = `a`), ol))

		expect(new OList(`a`)).toEqual(new OList(`a`))
		expect(Utils.stdout0).toHaveBeenCalledTimes(1)
		expect(Utils.stdout1).toHaveBeenCalledWith({
			newValue: [`a`],
			oldValue: [],
		})
		expect(Utils.stdout2).toHaveBeenCalledWith({
			newValue: `0\u001F0\u001E\u0003a`,
			oldValue: null,
		})
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})

	it(`can recover from a failed transaction`, () => {
		const myMutableAtom = mutableAtom<SetRTX<string>>({
			key: `myMutable`,
			class: SetRTX,
		})

		const myTransaction = transaction({
			key: `myTx`,
			do: ({ set }) => {
				set(myMutableAtom, (mySet) => {
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
			myMutableAtom,
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
			const myMutable = getState(myMutableAtom)
			expect(myMutable).toEqual(new SetRTX())
		}
	})
})

describe(`mutable time traveling`, () => {
	afterEach(() => {
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
	it(`can travel back and forward in time`, () => {
		const myMutableAtoms = mutableAtomFamily<UList<string>, string>({
			key: `myMutable`,
			class: UList,
		})
		const myMutableAtom = findState(myMutableAtoms, `example`)
		const myTL = timeline({
			key: `myTimeline`,
			scope: [myMutableAtoms],
		})
		const myJsonState = Internal.getJsonToken(
			Internal.IMPLICIT.STORE,
			myMutableAtom,
		)
		const myTrackerState = Internal.getUpdateToken(myMutableAtom)
		subscribe(myMutableAtom, Utils.stdout0)
		subscribe(myJsonState, Utils.stdout1)
		subscribe(myTrackerState, Utils.stdout2)

		expect(getState(myMutableAtom)).toEqual(new UList())
		setState(myMutableAtom, (set) => set.add(`a`))
		expect(getState(myMutableAtom)).toEqual(new UList([`a`]))
		setState(myMutableAtom, (set) => set.add(`b`))
		expect(getState(myMutableAtom)).toEqual(new UList([`a`, `b`]))
		undo(myTL)
		expect(getState(myMutableAtom)).toEqual(new UList([`a`]))
		undo(myTL)
		expect(getState(myMutableAtom)).toEqual(new UList())
		redo(myTL)
		expect(getState(myMutableAtom)).toEqual(new UList([`a`]))
		redo(myTL)
		expect(getState(myMutableAtom)).toEqual(new UList([`a`, `b`]))
	})
	it(`can travel back and forward in time with a transaction`, () => {
		const myMutableAtom = mutableAtom<UList<string>>({
			key: `myMutable`,
			class: UList,
		})
		const myTL = timeline({
			key: `myTimeline`,
			scope: [myMutableAtom],
		})
		const myTX = transaction<(newItem: string) => void>({
			key: `myTransaction`,
			do: ({ set }, newItem) => {
				set(myMutableAtom, (s) => s.add(newItem))
			},
		})

		const myJsonState = Internal.getJsonToken(
			Internal.IMPLICIT.STORE,
			myMutableAtom,
		)
		const myTrackerState = Internal.getUpdateToken(myMutableAtom)
		subscribe(myMutableAtom, Utils.stdout0)
		subscribe(myJsonState, Utils.stdout1)
		subscribe(myTrackerState, Utils.stdout2)

		expect(getState(myMutableAtom)).toEqual(new UList())
		runTransaction(myTX)(`a`)
		expect(getState(myMutableAtom)).toEqual(new UList([`a`]))
		runTransaction(myTX)(`b`)
		expect(getState(myMutableAtom)).toEqual(new UList([`a`, `b`]))
		undo(myTL)
		expect(getState(myMutableAtom)).toEqual(new UList([`a`]))
		undo(myTL)
		expect(getState(myMutableAtom)).toEqual(new UList())
		redo(myTL)
		expect(getState(myMutableAtom)).toEqual(new UList([`a`]))
		redo(myTL)
		expect(getState(myMutableAtom)).toEqual(new UList([`a`, `b`]))
	})
})

describe(`mutable atom effects`, () => {
	afterEach(() => {
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
	it(`runs a callback when the atom is set`, () => {
		let setSize = 0
		const myMutableAtoms = mutableAtomFamily<UList<string>, string>({
			key: `myMutable`,
			class: UList,
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
		const myMutableAtom = mutableAtom<UList<string>>({
			key: `myMutable`,
			class: UList,
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

		letterSubject.next({ letter: `A` })
		expect(getState(myMutableAtom)).toEqual(new UList([`A`]))
		letterSubject.next({ letter: `B` })
		expect(getState(myMutableAtom)).toEqual(new UList([`A`, `B`]))
	})
})

describe(`graceful handling of hmr/duplicate atom keys`, () => {
	it(`logs an error if an atom is created with the same key as an existing atom`, () => {
		const myMutableAtom = mutableAtom<UList<string>>({
			key: `myMutable`,
			class: UList,
		})
		mutableAtom<UList<string>>({
			key: `myMutable`,
			class: UList,
		})
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).toHaveBeenCalledTimes(1)
		expect(logger.error).toHaveBeenCalledWith(
			`❌`,
			myMutableAtom.type,
			myMutableAtom.key,
			`Tried to create atom, but it already exists in the store.`,
		)
	})
})
