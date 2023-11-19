import { AtomIOLogger, atom, timeline, undo } from "atom.io"
import * as __INTERNAL__ from "atom.io/internal"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 2
const logger = { ...console }
__INTERNAL__.IMPLICIT.STORE.loggers = [
	new AtomIOLogger(logger, LOG_LEVELS[CHOOSE]),
]

beforeEach(() => {
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
})

describe(`setLogLevel`, () => {
	it(`allows logging at the preferred level`, () => {
		atom({
			key: `count`,
			default: 0,
		})
		expect(logger.info).not.toHaveBeenCalled()
		__INTERNAL__.IMPLICIT.STORE.loggers[0].logLevel = `info`
		const countState = atom({
			key: `count`,
			default: 0,
		})
		expect(logger.error).toHaveBeenCalled()
		__INTERNAL__.IMPLICIT.STORE.loggers[0].logLevel = `error`
		const countTL = timeline({
			key: `count`,
			atoms: [countState],
		})
		undo(countTL)
		expect(logger.warn).not.toHaveBeenCalled()
		__INTERNAL__.IMPLICIT.STORE.loggers[0].logLevel = `warn`
		undo(countTL)
		expect(logger.warn).toHaveBeenCalled()
	})
})
