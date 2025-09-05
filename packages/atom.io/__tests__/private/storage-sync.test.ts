import type { Logger, RegularAtomOptions } from "atom.io"
import { Silo } from "atom.io"
import { storageSync } from "atom.io/web"

import * as Utils from "../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 2

let i = 0
let $: Silo
let willClearLocalStorage = false
let logger: Logger

beforeEach(() => {
	if (willClearLocalStorage) localStorage.clear()
	$ = new Silo({ name: `react-store-${i}`, lifespan: `ephemeral` })
	$.store.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = $.store.logger = Utils.createNullLogger()
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(Utils, `stdout`)
	i++
	willClearLocalStorage = true
})

afterEach(() => {
	expect(logger.warn).not.toHaveBeenCalled()
	expect(logger.error).not.toHaveBeenCalled()
})

describe(`storageSync`, () => {
	it(`should sync a value to localStorage`, () => {
		const myStringAtomOptions = {
			key: `myString`,
			default: `A`,
			effects: [storageSync(localStorage, JSON, `myString`)],
		} satisfies RegularAtomOptions<string | null>
		let myStringAtom = $.atom<string | null>(myStringAtomOptions)
		$.setState(myStringAtom, `B`)
		$ = new Silo({ name: `react-store-${i}`, lifespan: `ephemeral` })
		myStringAtom = $.atom<string | null>(myStringAtomOptions)
		expect($.getState(myStringAtom)).toBe(`B`)
		$.setState(myStringAtom, null)
		expect(localStorage.length).toBe(0)
	})
	it(`is okay with storage being undefined, as it might be in SSR`, () => {
		const myStringAtomOptions = {
			key: `myString`,
			default: `A`,
			effects: [storageSync(undefined, JSON, `myString`)],
		}
		let myStringAtom = $.atom<string | null>(myStringAtomOptions)
		$.setState(myStringAtom, `B`)
		$ = new Silo({ name: `react-store-${i}`, lifespan: `ephemeral` })
		myStringAtom = $.atom<string | null>(myStringAtomOptions)
		expect($.getState(myStringAtom)).toBe(`A`)
	})
})
