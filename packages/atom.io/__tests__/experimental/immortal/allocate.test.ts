import type { CtorToolkit, Logger } from "atom.io"
import {
	disposeState,
	getState,
	makeMolecule,
	makeRootMolecule,
	moleculeFamily,
} from "atom.io"
import { clearStore, IMPLICIT, withdraw } from "atom.io/internal"

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
		allocateIntoStore(`root`, `a`, IMPLICIT.STORE)
		allocateIntoStore(`root`, `b`, IMPLICIT.STORE)
		allocateIntoStore(`root`, `c`, IMPLICIT.STORE)
		allocateIntoStore(`root`, `d`, IMPLICIT.STORE)
		allocateIntoStore(`root`, `e`, IMPLICIT.STORE)
		allocateIntoStore(`root`, `f`, IMPLICIT.STORE)
	})
})
