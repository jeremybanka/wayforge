import type { Logger } from "atom.io"
import { Anarchy, getState, mutableAtom, setState } from "atom.io"
import * as Internal from "atom.io/internal"
import {
	filterOutInPlace,
	OList,
	oListDisposedKeyCleanupEffect,
} from "atom.io/transceivers/o-list"
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

it(`filterOutInPlace`, () => {
	const fruits = [`apple`, `banana`, `apple`, `orange`, `apple`]
	filterOutInPlace(fruits, `apple`)
	expect(fruits).toEqual([`banana`, `orange`])
	expect(logger.warn).not.toHaveBeenCalled()
	expect(logger.error).not.toHaveBeenCalled()
})

describe(`disposedKeyCleanup`, () => {
	describe(`set array element`, () => {
		test(`without previous value`, () => {
			const myMutableAtom = mutableAtom<OList<string>>({
				key: `myMutable`,
				class: OList,
				effects: [oListDisposedKeyCleanupEffect],
			})
			expect([...getState(myMutableAtom)]).toEqual([])

			const realm = new Anarchy()
			realm.allocate(`root`, `item::1`)
			setState(myMutableAtom, (array) => ((array[0] = `item::1`), array))
			expect([...getState(myMutableAtom)]).toEqual([`item::1`])
			realm.deallocate(`item::1`)
			expect([...getState(myMutableAtom)]).toEqual([])
			expect(logger.warn).not.toHaveBeenCalled()
			expect(logger.error).not.toHaveBeenCalled()
		})
	})
	test(`with previous value`, () => {
		const myMutableAtom = mutableAtom<OList<string>>({
			key: `myMutable`,
			class: OList,
			effects: [oListDisposedKeyCleanupEffect],
		})

		const realm = new Anarchy()
		realm.allocate(`root`, `item::0`)
		realm.allocate(`root`, `item::1`)
		setState(myMutableAtom, (array) => ((array[0] = `item::0`), array))
		expect([...getState(myMutableAtom)]).toEqual([`item::0`])
		setState(myMutableAtom, (array) => ((array[0] = `item::1`), array))
		expect([...getState(myMutableAtom)]).toEqual([`item::1`])
		realm.deallocate(`item::0`)
		expect([...getState(myMutableAtom)]).toEqual([`item::1`])
		realm.deallocate(`item::1`)
		expect([...getState(myMutableAtom)]).toEqual([])
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})

	test(`truncate array element`, () => {
		const myMutableAtom = mutableAtom<OList<string>>({
			key: `myMutable`,
			class: OList,
			effects: [oListDisposedKeyCleanupEffect],
		})
		expect([...getState(myMutableAtom)]).toEqual([])
		const realm = new Anarchy()
		realm.allocate(`root`, `item::1`)
		setState(myMutableAtom, (array) => ((array[0] = `item::1`), array))
		setState(myMutableAtom, (array) => ((array.length = 0), array))
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})

	describe(`pop or shift array element`, () => {
		test(`pop, item is present`, () => {
			const myMutableAtom = mutableAtom<OList<string>>({
				key: `myMutable`,
				class: OList,
				effects: [oListDisposedKeyCleanupEffect],
			})
			expect([...getState(myMutableAtom)]).toEqual([])
			const realm = new Anarchy()
			realm.allocate(`root`, `item::1`)
			setState(myMutableAtom, (array) => ((array[0] = `item::1`), array))
			expect([...getState(myMutableAtom)]).toEqual([`item::1`])
			setState(myMutableAtom, (array) => (array.pop(), array))
			expect([...getState(myMutableAtom)]).toEqual([])
			realm.deallocate(`item::1`)
			expect([...getState(myMutableAtom)]).toEqual([])
			expect(logger.warn).not.toHaveBeenCalled()
			expect(logger.error).not.toHaveBeenCalled()
		})
		test(`shift, item is not present`, () => {
			const myMutableAtom = mutableAtom<OList<string>>({
				key: `myMutable`,
				class: OList,
				effects: [oListDisposedKeyCleanupEffect],
			})
			expect([...getState(myMutableAtom)]).toEqual([])
			setState(myMutableAtom, (array) => (array.shift(), array))
			expect([...getState(myMutableAtom)]).toEqual([])
			expect(logger.warn).not.toHaveBeenCalled()
			expect(logger.error).not.toHaveBeenCalled()
		})
	})

	describe(`push or unshift array element`, () => {
		test(`push`, () => {
			const myMutableAtom = mutableAtom<OList<string>>({
				key: `myMutable`,
				class: OList,
				effects: [oListDisposedKeyCleanupEffect],
			})
			const realm = new Anarchy()
			realm.allocate(`root`, `item::1`)
			expect([...getState(myMutableAtom)]).toEqual([])
			setState(myMutableAtom, (array) => (array.push(`item::1`), array))
			expect([...getState(myMutableAtom)]).toEqual([`item::1`])
			expect(logger.warn).not.toHaveBeenCalled()
			expect(logger.error).not.toHaveBeenCalled()
		})
		test(`unshift`, () => {
			const myMutableAtom = mutableAtom<OList<string>>({
				key: `myMutable`,
				class: OList,
				effects: [oListDisposedKeyCleanupEffect],
			})
			const realm = new Anarchy()
			realm.allocate(`root`, `item::1`)
			expect([...getState(myMutableAtom)]).toEqual([])
			setState(myMutableAtom, (array) => (array.unshift(`item::1`), array))
			expect([...getState(myMutableAtom)]).toEqual([`item::1`])
			expect(logger.warn).not.toHaveBeenCalled()
			expect(logger.error).not.toHaveBeenCalled()
		})
	})

	test(`copyWithin`, () => {
		const myMutableAtom = mutableAtom<OList<string>>({
			key: `myMutable`,
			class: OList,
			effects: [oListDisposedKeyCleanupEffect],
		})
		const realm = new Anarchy()
		realm.allocate(`root`, `item::1`)
		realm.allocate(`root`, `item::2`)
		setState(myMutableAtom, (array) => (array.push(`item::1`, `item::2`), array))
		expect([...getState(myMutableAtom)]).toEqual([`item::1`, `item::2`])
		setState(myMutableAtom, (array) => (array.copyWithin(1, 0), array))
		expect([...getState(myMutableAtom)]).toEqual([`item::1`, `item::1`])
		realm.deallocate(`item::1`)
		expect([...getState(myMutableAtom)]).toEqual([])
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})

	test(`fill`, () => {
		const myMutableAtom = mutableAtom<OList<string>>({
			key: `myMutable`,
			class: OList,
			effects: [oListDisposedKeyCleanupEffect],
		})
		const realm = new Anarchy()
		realm.allocate(`root`, `item::1`)
		realm.allocate(`root`, `item::2`)
		realm.allocate(`root`, `item::3`)
		setState(myMutableAtom, (array) => (array.push(`item::1`, `item::2`), array))
		expect([...getState(myMutableAtom)]).toEqual([`item::1`, `item::2`])
		setState(myMutableAtom, (array) => (array.fill(`item::3`), array))
		expect([...getState(myMutableAtom)]).toEqual([`item::3`, `item::3`])
		realm.deallocate(`item::3`)
		expect([...getState(myMutableAtom)]).toEqual([])
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})

	test(`splice`, () => {
		const myMutableAtom = mutableAtom<OList<string>>({
			key: `myMutable`,
			class: OList,
			effects: [oListDisposedKeyCleanupEffect],
		})
		const realm = new Anarchy()
		realm.allocate(`root`, `item::1`)
		realm.allocate(`root`, `item::2`)
		realm.allocate(`root`, `item::3`)
		setState(myMutableAtom, (array) => (array.push(`item::1`, `item::2`), array))
		expect([...getState(myMutableAtom)]).toEqual([`item::1`, `item::2`])
		setState(myMutableAtom, (array) => (array.splice(1, 1, `item::3`), array))
		expect([...getState(myMutableAtom)]).toEqual([`item::1`, `item::3`])
		realm.deallocate(`item::1`)
		expect([...getState(myMutableAtom)]).toEqual([`item::3`])
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})

	test(`non-value changing methods, e.g, extend`, () => {
		const myMutableAtom = mutableAtom<OList<string>>({
			key: `myMutable`,
			class: OList,
			effects: [oListDisposedKeyCleanupEffect],
		})
		const realm = new Anarchy()
		realm.allocate(`root`, `item::1`)
		realm.allocate(`root`, `item::2`)
		setState(myMutableAtom, (array) => (array.push(`item::1`, `item::2`), array))
		expect([...getState(myMutableAtom)]).toEqual([`item::1`, `item::2`])
		setState(myMutableAtom, (array) => ((array.length = 3), array))
		expect([...getState(myMutableAtom)]).toEqual([
			`item::1`,
			`item::2`,
			undefined,
		])
		realm.deallocate(`item::1`)
		expect([...getState(myMutableAtom)]).toEqual([`item::2`, undefined])
		expect(logger.warn).toHaveBeenCalledTimes(1)
		expect(logger.error).not.toHaveBeenCalled()
	})
})

test(`disposed key cleanup (unhappy path)`, () => {
	const myMutableAtom = mutableAtom<OList<string>>({
		key: `myMutable`,
		class: OList,
		effects: [oListDisposedKeyCleanupEffect],
	})

	setState(myMutableAtom, (array) => (array.push(`item::1`, `item::2`), array))
	expect([...getState(myMutableAtom)]).toEqual([`item::1`, `item::2`])

	expect(logger.warn).toHaveBeenCalledWith(
		`❌`,
		`mutable_atom`,
		`myMutable`,
		`Added "item::2" to myMutable but it has not been allocated.`,
	)
	expect(logger.error).not.toHaveBeenCalled()
})
