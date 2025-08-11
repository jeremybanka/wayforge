import type { Logger, SelectorToken } from "atom.io"
import { getState, selector } from "atom.io"
import * as Internal from "atom.io/internal"
import { evictDownstreamFromSelector } from "atom.io/internal/set-state/evict-downstream"
import { vitest } from "vitest"

import * as Utils from "../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 2
let logger: Logger

beforeEach(() => {
	Internal.clearStore(Internal.IMPLICIT.STORE)
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = Internal.IMPLICIT.STORE.logger = Utils.createNullLogger()
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(Utils, `stdout`)
})

describe(`evictDownStreamFromSelector`, () => {
	test(`should evict the correct selectors`, () => {
		function node(key: string, upstream: SelectorToken<any>[]) {
			return selector<string>({
				key,
				get({ get }) {
					for (const sel of upstream) {
						get(sel)
					}
					return key
				},
			})
		}
		const a = node(`a`, [])
		const b = node(`b`, [])
		const c = node(`c`, [])
		const ab = node(`ab`, [a, b])
		const abb = node(`abb`, [ab, b])
		const abbc = node(`abbc`, [abb, c])
		getState(abbc)
		// console.log(Internal.IMPLICIT.STORE.selectorGraph)
		const vMap = Internal.IMPLICIT.STORE.valueMap
		assert(vMap.has(`a`))
		assert(vMap.has(`b`))
		assert(vMap.has(`ab`))
		assert(vMap.has(`abb`))
		assert(vMap.has(`abbc`))
		const selectorB = Internal.IMPLICIT.STORE.readonlySelectors.get(`b`)
		assert(selectorB)
		Internal.openOperation(Internal.IMPLICIT.STORE, b)
		evictDownstreamFromSelector(Internal.IMPLICIT.STORE, `b`)
		assert(vMap.has(`a`))
		assert(vMap.has(`b`))
		assert(!vMap.has(`ab`))
		assert(!vMap.has(`abb`))
		assert(!vMap.has(`abbc`))
	})
})
