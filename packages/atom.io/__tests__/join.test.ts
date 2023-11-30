import { createJoin } from "atom.io/data"
import { vitest } from "vitest"

import { type Logger, subscribe } from "atom.io"

import * as Internal from "atom.io/internal"
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
	const playersInRooms = createJoin(
		{
			key: `playersInRooms`,
			between: [`room`, `player`],
			cardinality: `1:n`,
		},
		undefined,
		Internal.IMPLICIT.STORE,
	)
	const joshuaRoomsState = Internal.getJsonToken(
		playersInRooms.findRelatedKeysState(`joshua`),
	)
	subscribe(joshuaRoomsState, Utils.stdout)

	playersInRooms.junction.set({ player: `joshua`, room: `lobby` })

	expect(Utils.stdout).toHaveBeenCalledWith({
		oldValue: [],
		newValue: [`lobby`],
	})
})
