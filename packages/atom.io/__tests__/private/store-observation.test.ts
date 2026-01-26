import type { Logger } from "atom.io"
import {
	atomFamily,
	findState,
	getState,
	selectorFamily,
	timeline,
	transaction,
} from "atom.io"
import * as Internal from "atom.io/internal"
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

afterEach(() => {
	expect(logger.warn).not.toHaveBeenCalled()
	expect(logger.error).not.toHaveBeenCalled()
})

describe(`store observation`, () => {
	test(`store.on.atomCreation fires on minting of each new AtomToken`, () => {
		Internal.IMPLICIT.STORE.on.atomCreation.subscribe(`test`, (atomToken) => {
			Utils.stdout(atomToken)
		})
		const countAtoms = atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		const a = findState(countAtoms, `a`)
		getState(a)
		const b = findState(countAtoms, `b`)
		getState(b)
		expect(Utils.stdout).toHaveBeenCalledWith(a)
		expect(Utils.stdout).toHaveBeenCalledWith(b)
	})
	test(`store.on.selectorCreation fires on minting of each new SelectorToken`, () => {
		Internal.IMPLICIT.STORE.on.selectorCreation.subscribe(
			`test`,
			(selectorToken) => {
				Utils.stdout(selectorToken)
			},
		)
		const zeroSelectors = selectorFamily<number, string>({
			key: `zero`,
			get: () => () => 0,
		})
		const c = findState(zeroSelectors, `c`)
		getState(c)
		const d = findState(zeroSelectors, `d`)
		getState(d)
		expect(Utils.stdout).toHaveBeenCalledWith(c)
		expect(Utils.stdout).toHaveBeenCalledWith(d)
	})
	test(`store.on.transactionCreation fires on minting of each new TransactionToken`, () => {
		Internal.IMPLICIT.STORE.on.transactionCreation.subscribe(
			`test`,
			(transactionToken) => {
				Utils.stdout(transactionToken)
			},
		)
		const tx = transaction({
			key: `tx`,
			do: () => null,
		})
		expect(Utils.stdout).toHaveBeenCalledWith(tx)
	})
	test(`store.on.timelineCreation fires on minting of each new TimelineToken`, () => {
		Internal.IMPLICIT.STORE.on.timelineCreation.subscribe(
			`test`,
			(timelineToken) => {
				Utils.stdout(timelineToken)
			},
		)
		const tl = timeline({
			key: `tl`,
			scope: [],
		})
		expect(Utils.stdout).toHaveBeenCalledWith(tl)
	})
})
