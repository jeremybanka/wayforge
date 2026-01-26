import type { Logger } from "atom.io"
import { atom, AtomIOLogger, getState, timeline, undo } from "atom.io"
import * as Internal from "atom.io/internal"

import { createNullLogger } from "../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 0
let internalLogger: AtomIOLogger
const externalLogger: Logger = createNullLogger()

beforeEach(() => {
	Internal.clearStore(Internal.IMPLICIT.STORE)
	Internal.IMPLICIT.STORE.config.isProduction = true
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	Internal.IMPLICIT.STORE.loggers[1] = internalLogger = new AtomIOLogger(
		`info`,
		undefined,
		externalLogger,
	)
	vitest.spyOn(internalLogger, `error`).mockReset()
	vitest.spyOn(internalLogger, `warn`).mockReset()
	vitest.spyOn(internalLogger, `info`).mockReset()
	vitest.spyOn(externalLogger, `error`).mockReset()
	vitest.spyOn(externalLogger, `warn`).mockReset()
	vitest.spyOn(externalLogger, `info`).mockReset()
})

describe(`setLogLevel`, () => {
	it(`allows logging at the preferred level`, () => {
		Internal.IMPLICIT.STORE.loggers[1].logLevel = null
		atom<number>({
			key: `count`,
			default: 0,
		})
		expect(externalLogger.info).not.toHaveBeenCalled()
		Internal.IMPLICIT.STORE.loggers[1].logLevel = `info`
		const countAtom = atom<number>({
			key: `count`,
			default: 0,
		})
		expect(externalLogger.error).toHaveBeenCalled()
		Internal.IMPLICIT.STORE.loggers[1].logLevel = `error`
		const countTL = timeline({
			key: `count`,
			scope: [countAtom],
		})
		undo(countTL)
		expect(externalLogger.warn).not.toHaveBeenCalled()
		Internal.IMPLICIT.STORE.loggers[1].logLevel = `warn`
		undo(countTL)
		expect(externalLogger.warn).toHaveBeenCalled()
	})
	it(`filters out messages based on a predicate`, () => {
		internalLogger.filter = (icon) => icon === `📖`
		const countAtom = atom<number>({
			key: `count`,
			default: 0,
		})
		expect(internalLogger.info).toHaveBeenCalledOnce()
		expect(externalLogger.info).not.toHaveBeenCalled()
		atom<number>({
			key: `count`,
			default: 0,
		})
		expect(internalLogger.error).toHaveBeenCalledOnce()
		expect(externalLogger.error).not.toHaveBeenCalled()
		const countTL = timeline({
			key: `count`,
			scope: [countAtom],
		})
		undo(countTL)
		expect(internalLogger.warn).toHaveBeenCalledOnce()
		expect(externalLogger.warn).not.toHaveBeenCalled()
		getState(countAtom)
		getState(countAtom)
		expect(externalLogger.info).toHaveBeenCalledOnce()
		internalLogger.filter = (icon) => icon === `❌`
		atom<number>({
			key: `count`,
			default: 0,
		})
		expect(externalLogger.info).toHaveBeenCalledOnce()
		internalLogger.filter = (icon) => icon === `💁`
		undo(countTL)
		expect(externalLogger.warn).toHaveBeenCalledOnce()
	})
	it(`refines messages as needed, keeping large objects out of logs`, () => {
		class MyComplexThing {
			public id: string
			public constructor(id: string) {
				this.id = id
			}
		}
		internalLogger.filter = (...params) => {
			let idx = 0
			for (const param of params) {
				if (param instanceof MyComplexThing) {
					params[idx] = `Thing:${param.id}`
				}
				idx++
			}
			return params
		}
		internalLogger.error(
			`❌`,
			`atom`,
			`thingy`,
			`errored`,
			new MyComplexThing(`123`),
		)
		expect(externalLogger.error).toHaveBeenLastCalledWith(
			`❌`,
			`atom`,
			`thingy`,
			`errored`,
			`Thing:123`,
		)
		internalLogger.warn(
			`💁`,
			`atom`,
			`thingy`,
			`warned`,
			new MyComplexThing(`456`),
		)
		expect(externalLogger.warn).toHaveBeenLastCalledWith(
			`💁`,
			`atom`,
			`thingy`,
			`warned`,
			`Thing:456`,
		)
		internalLogger.info(
			`👍`,
			`atom`,
			`thingy`,
			`infoed`,
			new MyComplexThing(`789`),
		)
		expect(externalLogger.info).toHaveBeenLastCalledWith(
			`👍`,
			`atom`,
			`thingy`,
			`infoed`,
			`Thing:789`,
		)
	})
})
