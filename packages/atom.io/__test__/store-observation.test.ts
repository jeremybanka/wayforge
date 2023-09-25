import { vitest } from "vitest"

import { atom, selector, setLogLevel, timeline, transaction } from "atom.io"
import * as __INTERNAL__ from "atom.io/internal"
import * as UTIL from "./__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 0
setLogLevel(LOG_LEVELS[CHOOSE])
const logger = __INTERNAL__.IMPLICIT.STORE.config.logger ?? console

beforeEach(() => {
	__INTERNAL__.clearStore()
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(UTIL, `stdout`)
})

describe(`store observation`, () => {
	test(`store.subject.atomCreation fires on minting of each new AtomToken`, () => {
		__INTERNAL__.IMPLICIT.STORE.subject.atomCreation.subscribe(
			`test`,
			(atomToken) => UTIL.stdout(atomToken),
		)
		const a = atom({
			key: `a`,
			default: null,
		})
		const b = atom({
			key: `b`,
			default: null,
		})
		expect(UTIL.stdout).toHaveBeenCalledWith(a)
		expect(UTIL.stdout).toHaveBeenCalledWith(b)
	})
	test(`store.subject.selectorCreation fires on minting of each new SelectorToken`, () => {
		__INTERNAL__.IMPLICIT.STORE.subject.selectorCreation.subscribe(
			`test`,
			(selectorToken) => UTIL.stdout(selectorToken),
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
		expect(UTIL.stdout).toHaveBeenCalledWith(c)
		expect(UTIL.stdout).toHaveBeenCalledWith(d)
	})
	test(`store.subject.transactionCreation fires on minting of each new TransactionToken`, () => {
		__INTERNAL__.IMPLICIT.STORE.subject.transactionCreation.subscribe(
			`test`,
			(transactionToken) => UTIL.stdout(transactionToken),
		)
		const tx = transaction({
			key: `tx`,
			do: () => null,
		})
		expect(UTIL.stdout).toHaveBeenCalledWith(tx)
	})
	test(`store.subject.timelineCreation fires on minting of each new TimelineToken`, () => {
		__INTERNAL__.IMPLICIT.STORE.subject.timelineCreation.subscribe(
			`test`,
			(timelineToken) => UTIL.stdout(timelineToken),
		)
		const tl = timeline({
			key: `tl`,
			atoms: [],
		})
		expect(UTIL.stdout).toHaveBeenCalledWith(tl)
	})
})
