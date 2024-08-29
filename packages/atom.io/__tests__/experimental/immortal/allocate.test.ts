import type { Logger } from "atom.io"
import { clearStore, IMPLICIT } from "atom.io/internal"

import { allocateIntoStore } from "~/packages/atom.io/src/allocate"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 2

let logger: Logger

beforeEach(() => {
	clearStore(IMPLICIT.STORE)
	IMPLICIT.STORE.config.lifespan = `immortal`
	IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = IMPLICIT.STORE.logger
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
})
describe(`moleculeFamily`, () => {
	test(`exclusive molecule hierarchy`, () => {
		allocateIntoStore(IMPLICIT.STORE, `root`, `a`)
		allocateIntoStore(IMPLICIT.STORE, `root`, `b`)
		allocateIntoStore(IMPLICIT.STORE, `root`, `c`)
		allocateIntoStore(IMPLICIT.STORE, `root`, `d`)
		allocateIntoStore(IMPLICIT.STORE, `root`, `e`)
		allocateIntoStore(IMPLICIT.STORE, `root`, `f`)
	})
})
