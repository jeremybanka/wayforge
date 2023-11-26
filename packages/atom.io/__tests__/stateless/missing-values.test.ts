import { readFile, writeFile } from "fs"
import fsp from "fs/promises"

import tmp from "tmp"
import { vitest } from "vitest"

import type { Logger } from "atom.io"
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
	test(`automatic strategy`, async () => {
		const count = atom<Loadable<number>>({
			key: `count`,
			default: () => {
				return new Promise<number>((resolve) => {
					readFile(`${tmpDir.name}/count.txt`, `utf8`, (error, data) => {
						if (error) {
							writeFile(`${tmpDir.name}/count.txt`, `0`, () => {
								resolve(0)
							})
							return
						}
						resolve(parseInt(data, 10))
					})
				})
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
									() => {
										unsub()
										const promise = new Promise<number>((resolve) => {
											oldValue.then((resolvedOldValue) => {
												if (resolvedOldValue === newValue) {
													return
												}
												writeFile(
													`${tmpDir.name}/count.txt`,
													newValue.toString(),
													() => {
														resolve(newValue)
													},
												)
											})
										})
										setSelf(promise)
									},
								)
							return
						}
						const unsub =
							Internal.IMPLICIT.STORE.subject.operationStatus.subscribe(
								`One-Shot: enqueue update to count.txt`,
								() => {
									const promise = new Promise<number>((resolve) => {
										unsub()
										writeFile(
											`${tmpDir.name}/count.txt`,
											newValue.toString(),
											() => {
												resolve(newValue)
											},
										)
									})
									setSelf(promise)
								},
							)
					})
				},
			],
		})

		expect(await getState(count)).toBe(0)
		clearValueMap()
		setState(count, 1)
		clearValueMap()
		await new Promise((resolve) => setTimeout(resolve, 5))
		expect(await getState(count)).toBe(1)
		clearValueMap()
		setState(count, 2)
		clearValueMap()
		await new Promise((resolve) => setTimeout(resolve, 5))
		expect(await getState(count)).toBe(2)
	})
	test(`manual strategy`, async () => {
		const count = atom<Loadable<number>>({
			key: `count`,
			default: () => {
				return new Promise<number>((resolve) => {
					readFile(`${tmpDir.name}/count.txt`, `utf8`, (error, data) => {
						if (error) {
							writeFile(`${tmpDir.name}/count.txt`, `0`, () => {
								resolve(0)
							})
							return
						}
						resolve(parseInt(data, 10))
					})
				})
			},
		})

		async function writeCount(newValue: number): Promise<number> {
			await fsp.writeFile(`${tmpDir.name}/count.txt`, newValue.toString())
			return newValue
		}

		function updateCount(newValue: number): void {
			if (Internal.IMPLICIT.STORE.operation.open) {
				const unsub = Internal.IMPLICIT.STORE.subject.operationStatus.subscribe(
					`One-Shot: enqueue update to count.txt`,
					() => {
						unsub()
						const currentValue = getState(count)
						if (currentValue instanceof Promise) {
							currentValue.then((resolvedCurrentValue) => {
								if (resolvedCurrentValue === newValue) {
									return
								}
								setState(count, writeCount(newValue))
							})
							return
						}
						if (currentValue === newValue) {
							return
						}
						setState(count, writeCount(newValue))
					},
				)
				return
			}
			const currentValue = getState(count)
			if (currentValue instanceof Promise) {
				currentValue.then((resolvedCurrentValue) => {
					if (resolvedCurrentValue === newValue) {
						return
					}
					setState(count, writeCount(newValue))
				})
				return
			}
			if (currentValue === newValue) {
				return
			}
			setState(count, writeCount(newValue))
		}

		expect(await getState(count)).toBe(0)
		clearValueMap()
		updateCount(1)
		clearValueMap()
		await new Promise((resolve) => setTimeout(resolve, 5))
		expect(await getState(count)).toBe(1)
	})
})
