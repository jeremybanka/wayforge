import type { Logger } from "atom.io"
import {
	Anarchy,
	getState,
	mutableAtom,
	runTransaction,
	setState,
	transaction,
} from "atom.io"
import * as Internal from "atom.io/internal"
import {
	UList,
	uListDisposedKeyCleanupEffect,
} from "atom.io/transceivers/u-list"
import { vitest } from "vitest"

import * as Utils from "../../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 3

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

describe(`effects`, () => {
	afterEach(() => {
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})

	it(`disposed key cleanup`, () => {
		const myMutableAtom = mutableAtom<UList<string>>({
			key: `myMutable`,
			class: UList,
			effects: [uListDisposedKeyCleanupEffect],
		})
		expect(getState(myMutableAtom)).toEqual(new UList())

		const realm = new Anarchy()
		realm.allocate(`root`, `item::1`)
		setState(myMutableAtom, (set) => set.add(`item::1`))
		expect(getState(myMutableAtom)).toEqual(new UList([`item::1`]))
		realm.deallocate(`item::1`)
		expect(getState(myMutableAtom)).toEqual(new UList())

		realm.allocate(`root`, `item::2`)
		setState(myMutableAtom, (set) => set.add(`item::2`))
		setState(myMutableAtom, (set) => (set.clear(), set))
	})
	it(`disposed key cleanup (transaction)`, () => {
		const myMutableAtom = mutableAtom<UList<string>>({
			key: `myMutable`,
			class: UList,
			effects: [uListDisposedKeyCleanupEffect],
		})
		expect(getState(myMutableAtom)).toEqual(new UList())

		const realm = new Anarchy()
		realm.allocate(`root`, `item::1`)

		runTransaction(
			transaction({
				key: `hi`,
				do: ({ set }) => {
					set(myMutableAtom, (s) => s.add(`item::1`))
				},
			}),
		)()
		expect(getState(myMutableAtom)).toEqual(new UList([`item::1`]))

		realm.deallocate(`item::1`)
		expect(getState(myMutableAtom)).toEqual(new UList())
	})
})
