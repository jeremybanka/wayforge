import type { Logger } from "atom.io"
import { atom, AtomIOLogger, getState, timeline, undo } from "atom.io"
import * as Internal from "atom.io/internal"

import { createNullLogger } from "../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 0
let internalLogger: AtomIOLogger
const externalLogger: Logger = createNullLogger()

beforeEach(() => {
	Internal.clearStore(Internal.IMPLICIT.STORE)
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	Internal.IMPLICIT.STORE.loggers[1] = internalLogger = new AtomIOLogger(
		`info`,
		undefined,
		externalLogger,
	)
	vitest.spyOn(internalLogger, `error`)
	vitest.spyOn(internalLogger, `warn`)
	vitest.spyOn(internalLogger, `info`)
	vitest.spyOn(externalLogger, `error`)
	vitest.spyOn(externalLogger, `warn`)
	vitest.spyOn(externalLogger, `info`)
})

describe(`setLogLevel`, () => {
	it(`allows logging at the preferred level`, () => {
		Internal.IMPLICIT.STORE.loggers[1].logLevel = null
		atom<number>({
			key: `count`,
			default: 0,
		})
		expect(externalLogger.info).not.toHaveBeenCalled()
		Internal.IMPLICIT.STORE.loggers[1].logLevel = `info`
		const countState = atom<number>({
			key: `count`,
			default: 0,
		})
		expect(externalLogger.error).toHaveBeenCalled()
		Internal.IMPLICIT.STORE.loggers[1].logLevel = `error`
		const countTL = timeline({
			key: `count`,
			scope: [countState],
		})
		undo(countTL)
		expect(externalLogger.warn).not.toHaveBeenCalled()
		Internal.IMPLICIT.STORE.loggers[1].logLevel = `warn`
		undo(countTL)
		expect(externalLogger.warn).toHaveBeenCalled()
	})
	it(`filters messages based on a predicate`, () => {
		internalLogger.filter = (icon) => icon === `📖`
		const countState = atom<number>({
			key: `count`,
			default: 0,
		})
		expect(internalLogger.info).toHaveBeenCalledOnce()
		expect(externalLogger.info).not.toHaveBeenCalled()
		atom<number>({
			key: `count`,
			default: 0,
		})
		expect(internalLogger.error).toHaveBeenCalledOnce()
		expect(externalLogger.error).not.toHaveBeenCalled()
		const countTL = timeline({
			key: `count`,
			scope: [countState],
		})
		undo(countTL)
		expect(internalLogger.warn).toHaveBeenCalledOnce()
		expect(externalLogger.warn).not.toHaveBeenCalled()
		getState(countState)
		getState(countState)
		expect(externalLogger.info).toHaveBeenCalledOnce()
		internalLogger.filter = (icon) => icon === `❌`
		atom<number>({
			key: `count`,
			default: 0,
		})
		expect(externalLogger.info).toHaveBeenCalledOnce()
		internalLogger.filter = (icon) => icon === `💁`
		undo(countTL)
		expect(externalLogger.warn).toHaveBeenCalledOnce()
	})
})
