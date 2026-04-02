import type { Logger, RegularAtomOptions } from "atom.io"
import { Silo } from "atom.io"
import { searchParamSync, storageSync } from "atom.io/web"

import * as Utils from "../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 2

let i = 0
let $: Silo
let willClearLocalStorage = false
let logger: Logger

beforeEach(() => {
	if (willClearLocalStorage) localStorage.clear()
	window.history.replaceState(null, ``, `/`)
	$ = new Silo({
		name: `react-store-${i}`,
		lifespan: `ephemeral`,
		isProduction: false,
	})
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
		$ = new Silo({
			name: `react-store-${i}`,
			lifespan: `ephemeral`,
			isProduction: false,
		})
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
		$ = new Silo({
			name: `react-store-${i}`,
			lifespan: `ephemeral`,
			isProduction: false,
		})
		myStringAtom = $.atom<string | null>(myStringAtomOptions)
		expect($.getState(myStringAtom)).toBe(`A`)
	})
})

describe(`searchParamSync`, () => {
	it(`should sync a value to the URL query params`, () => {
		window.history.replaceState(null, ``, `/?myString=%22B%22&keep=%22C%22#hash`)
		const myStringAtomOptions = {
			key: `myString`,
			default: `A`,
			effects: [searchParamSync(JSON, `myString`)],
		} satisfies RegularAtomOptions<string | null>
		let myStringAtom = $.atom<string | null>(myStringAtomOptions)
		expect($.getState(myStringAtom)).toBe(`B`)
		$.setState(myStringAtom, `D`)
		expect(window.location.search).toBe(`?myString=%22D%22&keep=%22C%22`)
		expect(window.location.hash).toBe(`#hash`)
		$ = new Silo({
			name: `react-store-${i}`,
			lifespan: `ephemeral`,
			isProduction: false,
		})
		myStringAtom = $.atom<string | null>(myStringAtomOptions)
		expect($.getState(myStringAtom)).toBe(`D`)
		$.setState(myStringAtom, null)
		expect(window.location.search).toBe(`?keep=%22C%22`)
	})

	it(`leaves the atom at its default when the search param is absent`, () => {
		window.history.replaceState(null, ``, `/?keep=%22C%22#hash`)
		const myStringAtom = $.atom<string | null>({
			key: `myString`,
			default: `A`,
			effects: [searchParamSync(JSON, `myString`)],
		})
		expect($.getState(myStringAtom)).toBe(`A`)
		expect(window.location.search).toBe(`?keep=%22C%22`)
		expect(window.location.hash).toBe(`#hash`)
	})

	it(`is okay when browser globals are unavailable, as they might be in SSR`, () => {
		const originalWindow = Object.getOwnPropertyDescriptor(globalThis, `window`)
		const setSelf = vitest.fn()
		const onSet = vitest.fn()

		Object.defineProperty(globalThis, `window`, {
			value: undefined,
			configurable: true,
			writable: true,
		})

		try {
			const effect = searchParamSync(JSON, `myString`)
			expect(effect({ setSelf, onSet } as never)).toBeUndefined()
			expect(setSelf).not.toHaveBeenCalled()
			expect(onSet).not.toHaveBeenCalled()
		} finally {
			if (originalWindow) {
				Object.defineProperty(globalThis, `window`, originalWindow)
			}
		}
	})

	it(`is okay when location or history are unavailable`, () => {
		const originalWindow = Object.getOwnPropertyDescriptor(globalThis, `window`)
		const setSelf = vitest.fn()
		const onSet = vitest.fn()

		try {
			Object.defineProperty(globalThis, `window`, {
				value: { location: undefined, history: {} },
				configurable: true,
				writable: true,
			})
			const effectWithoutLocation = searchParamSync(JSON, `myString`)
			expect(effectWithoutLocation({ setSelf, onSet } as never)).toBeUndefined()

			Object.defineProperty(globalThis, `window`, {
				value: { location: {}, history: undefined },
				configurable: true,
				writable: true,
			})
			const effectWithoutHistory = searchParamSync(JSON, `myString`)
			expect(effectWithoutHistory({ setSelf, onSet } as never)).toBeUndefined()

			expect(setSelf).not.toHaveBeenCalled()
			expect(onSet).not.toHaveBeenCalled()
		} finally {
			if (originalWindow) {
				Object.defineProperty(globalThis, `window`, originalWindow)
			}
		}
	})
})
