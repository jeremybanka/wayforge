import { readFileSync, writeFileSync } from "node:fs"

import type { Logger } from "atom.io"
import {
	atom,
	atomFamily,
	disposeState,
	findState,
	getState,
	setState,
} from "atom.io"
import * as Internal from "atom.io/internal"
import tmp from "tmp"
import { vitest } from "vitest"

import * as Utils from "../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 2

let logger: Logger
let tmpDir: tmp.DirResult

beforeEach(() => {
	Internal.clearStore(Internal.IMPLICIT.STORE)
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = Internal.IMPLICIT.STORE.logger = Utils.createNullLogger()
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(Utils, `stdout`)
	tmpDir = tmp.dirSync({ unsafeCleanup: true })
	writeFileSync(`${tmpDir.name}/name.txt`, `Mavis`)
	tmp.setGracefulCleanup()
})

describe(`atom effects`, () => {
	it(`runs a function onSet`, () => {
		const coordinateStates = atomFamily<{ x: number; y: number }, string>({
			key: `coordinate`,
			default: { x: 0, y: 0 },
			effects: (key) => [
				({ onSet }) => {
					onSet((newValue) => {
						Utils.stdout(`onSet`, key, newValue)
					})
				},
			],
		})
		setState(findState(coordinateStates, `a`), { x: 1, y: 1 })
		expect(Utils.stdout).toHaveBeenCalledWith(`onSet`, `a`, {
			newValue: { x: 1, y: 1 },
			oldValue: { x: 0, y: 0 },
		})
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
	it(`sets itself from the file-system, then writes to the file-system onSet`, () => {
		const nameState = atom<string>({
			key: `name`,
			default: ``,
			effects: [
				({ setSelf, onSet }) => {
					const name = readFileSync(`${tmpDir.name}/name.txt`, `utf8`)
					setSelf(name)
					onSet((change) => {
						writeFileSync(`${tmpDir.name}/name.txt`, change.newValue)
					})
				},
			],
		})
		expect(getState(nameState)).toBe(`Mavis`)
		setState(nameState, `Mavis2`)
		expect(readFileSync(`${tmpDir.name}/name.txt`, `utf8`)).toBe(`Mavis2`)
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
})

describe(`atom effect cleanup`, () => {
	test(`an effect can return a cleanup function`, () => {
		const coordinateStates = atomFamily<{ x: number; y: number }, string>({
			key: `coordinate`,
			default: { x: 0, y: 0 },
			effects: (key) => [
				({ onSet }) => {
					onSet((newValue) => {
						Utils.stdout(`onSet`, key, newValue)
					})
					return () => {
						Utils.stdout(`cleanup`, key)
					}
				},
			],
		})
		setState(findState(coordinateStates, `a`), { x: 1, y: 1 })
		expect(Utils.stdout).toHaveBeenCalledWith(`onSet`, `a`, {
			newValue: { x: 1, y: 1 },
			oldValue: { x: 0, y: 0 },
		})
		disposeState(findState(coordinateStates, `a`))
		expect(Utils.stdout).toHaveBeenCalledWith(`cleanup`, `a`)
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
})
