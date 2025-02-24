import { atom, AtomIOLogger, timeline, undo } from "atom.io"
import * as Internal from "atom.io/internal"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 2
const logger = new AtomIOLogger(LOG_LEVELS[CHOOSE])
Internal.IMPLICIT.STORE.loggers = [
	new AtomIOLogger(LOG_LEVELS[CHOOSE], () => true, logger),
]

beforeEach(() => {
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
})

describe(`setLogLevel`, () => {
	it(`allows logging at the preferred level`, () => {
		atom<number>({
			key: `count`,
			default: 0,
		})
		expect(logger.info).not.toHaveBeenCalled()
		Internal.IMPLICIT.STORE.loggers[0].logLevel = `info`
		const countState = atom<number>({
			key: `count`,
			default: 0,
		})
		expect(logger.error).toHaveBeenCalled()
		Internal.IMPLICIT.STORE.loggers[0].logLevel = `error`
		const countTL = timeline({
			key: `count`,
			scope: [countState],
		})
		undo(countTL)
		expect(logger.warn).not.toHaveBeenCalled()
		Internal.IMPLICIT.STORE.loggers[0].logLevel = `warn`
		undo(countTL)
		expect(logger.warn).toHaveBeenCalled()
	})
})
