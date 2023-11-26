import fsp from "fs/promises"

import tmp from "tmp"
import { vitest } from "vitest"

import type { AtomToken, Logger } from "atom.io"
import { atom, getState, setState } from "atom.io"
import type { Loadable } from "atom.io/data"
import * as Internal from "atom.io/internal"
import * as Utils from "../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 3

let logger: Logger
let tmpDir: tmp.DirResult

function clearValueMap() {
	Internal.IMPLICIT.STORE.valueMap = new Map()
}

async function waitForQueuedUpdate<T>(atom: AtomToken<T>, newValue: T) {
	while (!(getState(atom) instanceof Promise)) {
		console.log(`waiting for promise...`)
		await new Promise((resolve) => setImmediate(resolve))
	}
	while ((await getState(atom)) !== newValue) {
		console.log(`waiting for state update...`)
		await new Promise((resolve) => setImmediate(resolve))
	}
}

beforeEach(() => {
	Internal.clearStore()
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = Internal.IMPLICIT.STORE.logger
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
			const count = atom<Loadable<number>>({
				key: `count`,
				default: async () => {
					try {
						const data = await fsp.readFile(`${tmpDir.name}/count.txt`, `utf8`)
						return parseInt(data, 10)
					} catch (error) {
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
									Internal.IMPLICIT.STORE.subject.operationStatus.subscribe(
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
							const unsub =
								Internal.IMPLICIT.STORE.subject.operationStatus.subscribe(
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

			expect(await getState(count)).toBe(0)
			clearValueMap()
			setState(count, 1)
			await waitForQueuedUpdate(count, 1)
			clearValueMap()
			expect(await getState(count)).toBe(1)
			clearValueMap()
			setState(count, 2)
			await waitForQueuedUpdate(count, 2)
			clearValueMap()
			expect(await getState(count)).toBe(2)
		})
	})
})
