import type { Logger } from "atom.io"
import { atomFamily, selectorFamily, timeline, transaction } from "atom.io"
import * as Internal from "atom.io/internal"
import { vitest } from "vitest"

import { findState } from "../../ephemeral/src/find-state"
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
		Internal.IMPLICIT.STORE.on.atomCreation.subscribe(`test`, (atomToken) => {
			Utils.stdout(atomToken)
		})
		const atoms = atomFamily<number, string>({
			key: `atoms`,
			default: 0,
		})
		const a = findState(atoms, `a`)
		const b = findState(atoms, `b`)
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
		const selectors = selectorFamily<number, string>({
			key: `selectors`,
			get: () => () => 0,
		})
		const c = findState(selectors, `c`)
		const d = findState(selectors, `d`)
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
