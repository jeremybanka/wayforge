import fsp from "node:fs/promises"

import type { Loadable, Logger, RegularAtomToken } from "atom.io"
import { atom, getState, setState } from "atom.io"
import * as Internal from "atom.io/internal"
import tmp from "tmp"
import { vitest } from "vitest"

import * as Utils from "../../__util__"

const DEBUG_LOGS = false

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 2

let logger: Logger
let tmpDir: tmp.DirResult

function clearValueMap() {
	Internal.IMPLICIT.STORE.valueMap = new Map()
}

async function waitForQueuedUpdate<T>(token: RegularAtomToken<T>, newValue: T) {
	while (!(getState(token) instanceof Promise)) {
		if (DEBUG_LOGS) console.log(`waiting for promise...`)
		await new Promise((resolve) => setImmediate(resolve))
	}
	while ((await getState(token)) !== newValue) {
		if (DEBUG_LOGS) console.log(`waiting for state update...`)
		await new Promise((resolve) => setImmediate(resolve))
	}
}

beforeEach(() => {
	Internal.clearStore(Internal.IMPLICIT.STORE)
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = Internal.IMPLICIT.STORE.logger = Utils.createNullLogger()
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(Utils, `stdout`)
	tmpDir = tmp.dirSync({ unsafeCleanup: true })
	tmp.setGracefulCleanup()
})

describe(`stateless data persistence strategies`, () => {
	describe(`effect strategy`, () => {
		test(`manual implementation`, async () => {
			const countAtom = atom<Loadable<number>>({
				key: `count`,
				default: async () => {
					try {
						const data = await fsp.readFile(`${tmpDir.name}/count.txt`, `utf8`)
						return Number.parseInt(data, 10)
					} catch (_) {
						await fsp.writeFile(`${tmpDir.name}/count.txt`, `0`)
						return 0
					}
				},
				effects: [
					({ onSet, setSelf }) => {
						onSet(({ oldValue, newValue }) => {
							if (newValue instanceof Promise) {
								return
							}
							if (oldValue instanceof Promise) {
								const unsub =
									Internal.IMPLICIT.STORE.on.operationClose.subscribe(
										`One-Shot: enqueue update to count.txt`,
										async () => {
											unsub()
											const resolvedOldValue = await oldValue
											if (resolvedOldValue === newValue) {
												return
											}
											setSelf(
												(async () => {
													await fsp.writeFile(
														`${tmpDir.name}/count.txt`,
														newValue.toString(),
													)
													return newValue
												})(),
											)
										},
									)
								return
							}
							const unsub = Internal.IMPLICIT.STORE.on.operationClose.subscribe(
								`One-Shot: enqueue update to count.txt`,
								() => {
									unsub()
									setSelf(
										(async (): Promise<number> => {
											await fsp.writeFile(
												`${tmpDir.name}/count.txt`,
												newValue.toString(),
											)
											return newValue
										})(),
									)
								},
							)
						})
					},
				],
			})

			expect(await getState(countAtom)).toBe(0)
			clearValueMap()
			setState(countAtom, 1)
			await waitForQueuedUpdate(countAtom, 1)
			clearValueMap()
			expect(await getState(countAtom)).toBe(1)
			clearValueMap()
			setState(countAtom, 2)
			await waitForQueuedUpdate(countAtom, 2)
			clearValueMap()
			expect(await getState(countAtom)).toBe(2)
			expect(logger.warn).not.toHaveBeenCalled()
			expect(logger.error).not.toHaveBeenCalled()
		})
	})
})
