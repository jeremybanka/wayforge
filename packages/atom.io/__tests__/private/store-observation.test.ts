import { vitest } from "vitest"

import type { Logger } from "atom.io"
import { atom, selector, timeline, transaction } from "atom.io"
import * as Internal from "atom.io/internal"
import * as Utils from "../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 0

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

describe(`store observation`, () => {
	test(`store.on.atomCreation fires on minting of each new AtomToken`, () => {
		Internal.IMPLICIT.STORE.on.atomCreation.subscribe(`test`, (atomToken) =>
			Utils.stdout(atomToken),
		)
		const a = atom({
			key: `a`,
			default: null,
		})
		const b = atom({
			key: `b`,
			default: null,
		})
		expect(Utils.stdout).toHaveBeenCalledWith(a)
		expect(Utils.stdout).toHaveBeenCalledWith(b)
	})
	test(`store.on.selectorCreation fires on minting of each new SelectorToken`, () => {
		Internal.IMPLICIT.STORE.on.selectorCreation.subscribe(
			`test`,
			(selectorToken) => Utils.stdout(selectorToken),
		)
		const c = selector({
			key: `c`,
			get: () => null,
		})
		const d = selector({
			key: `d`,
			get: () => null,
			set: () => null,
		})
		expect(Utils.stdout).toHaveBeenCalledWith(c)
		expect(Utils.stdout).toHaveBeenCalledWith(d)
	})
	test(`store.on.transactionCreation fires on minting of each new TransactionToken`, () => {
		Internal.IMPLICIT.STORE.on.transactionCreation.subscribe(
			`test`,
			(transactionToken) => Utils.stdout(transactionToken),
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
			(timelineToken) => Utils.stdout(timelineToken),
		)
		const tl = timeline({
			key: `tl`,
			atoms: [],
		})
		expect(Utils.stdout).toHaveBeenCalledWith(tl)
	})
})
