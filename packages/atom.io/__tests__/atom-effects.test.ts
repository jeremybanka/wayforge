import { readFile, readFileSync, writeFile, writeFileSync } from "fs"

import tmp from "tmp"
import { vitest } from "vitest"

import type { Logger } from "atom.io"

import { atom, atomFamily, getState, setState } from "atom.io"
import * as Internal from "atom.io/internal"
import * as Utils from "./__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 1

let logger: Logger

let tmpDir: tmp.DirResult

beforeEach(() => {
	Internal.clearStore(Internal.IMPLICIT.STORE)
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = Internal.IMPLICIT.STORE.logger
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
		const findCoordinateState = atomFamily<{ x: number; y: number }, string>({
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
		setState(findCoordinateState(`a`), { x: 1, y: 1 })
		expect(Utils.stdout).toHaveBeenCalledWith(`onSet`, `a`, {
			newValue: { x: 1, y: 1 },
			oldValue: { x: 0, y: 0 },
		})
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
	})
	test(`effects can operate with asynchronous functions`, async () =>
		new Promise<void>((pass) => {
			const nameState = atom<string>({
				key: `name`,
				default: ``,
				effects: [
					({ setSelf, onSet }) => {
						const filename = `${tmpDir.name}/name.txt`
						readFile(filename, `utf8`, (_, data) => {
							setSelf(data)
						})
						onSet((change) => {
							writeFile(`${tmpDir.name}/name.txt`, change.newValue, () =>
								Utils.stdout(`done`),
							)
						})
					},
				],
			})
			let triesRemaining = 10
			setInterval(() => {
				if (triesRemaining-- > 0) {
					const name = getState(nameState)
					if (name === `Mavis`) {
						expect(getState(nameState)).toBe(`Mavis`)
						setState(nameState, `Mavis2`)
						triesRemaining = 10
						setInterval(() => {
							const written = readFileSync(`${tmpDir.name}/name.txt`, `utf8`)
							if (triesRemaining-- > 0) {
								if (written === `Mavis2`) {
									expect(written).toBe(`Mavis2`)
									expect(Utils.stdout).toHaveBeenCalledWith(`done`)
									pass()
								}
							} else {
								expect(readFileSync(`${tmpDir.name}/name.txt`, `utf8`)).toBe(
									`Mavis2`,
								)
							}
						}, 10)
					}
				} else {
					expect(getState(nameState)).toBe(`Mavis`)
				}
			}, 10)
		}))
})
