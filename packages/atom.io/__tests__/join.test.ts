import { vitest } from "vitest"
import { createJoin } from "../data/src/join"
import { IMPLICIT } from "../internal/src"

import { type Logger, getState, setState, subscribe } from "atom.io"

import * as Internal from "atom.io/internal"
import { SetRTX } from "../transceivers/set-rtx/src"
import * as Utils from "./__util__"

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
})

test(`join`, () => {
	const myJoin = createJoin(
		{
			key: `myJoin`,
			between: [`a`, `b`],
			cardinality: `n:n`,
		},
		undefined,
		IMPLICIT.STORE,
	)
	const jsonTokenA = Internal.getJsonToken(myJoin.findRelatedKeysState(`a`))
	subscribe(jsonTokenA, Utils.stdout)

	myJoin.junction.set({ a: `a`, b: `b` })

	expect(Utils.stdout).toHaveBeenCalledWith({
		newValue: [],
		oldValue: [],
	})
})
