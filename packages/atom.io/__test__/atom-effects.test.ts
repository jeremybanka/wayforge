import { readFile, readFileSync, writeFile, writeFileSync } from "fs"

import tmp from "tmp"
import { vitest } from "vitest"

import {
	__INTERNAL__,
	atom,
	atomFamily,
	getState,
	setLogLevel,
	setState,
} from "../src"
import * as UTIL from "./__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 1
setLogLevel(LOG_LEVELS[CHOOSE])
const logger = __INTERNAL__.IMPLICIT.STORE.config.logger ?? console

let tmpDir: tmp.DirResult

beforeEach(() => {
	__INTERNAL__.clearStore()
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(UTIL, `stdout`)
	tmpDir = tmp.dirSync({ unsafeCleanup: true })
	writeFileSync(`${tmpDir.name}/name.txt`, `Mavis`)
	return () => tmpDir.removeCallback()
})

describe(`atom effects`, () => {
	it(`runs a function onSet`, () => {
		const findCoordinateState = atomFamily<{ x: number; y: number }, string>({
			key: `coordinate`,
			default: { x: 0, y: 0 },
			effects: (key) => [
				({ onSet }) => {
					onSet((newValue) => {
						UTIL.stdout(`onSet`, key, newValue)
					})
				},
			],
		})
		setState(findCoordinateState(`a`), { x: 1, y: 1 })
		expect(UTIL.stdout).toHaveBeenCalledWith(`onSet`, `a`, {
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
								UTIL.stdout(`done`),
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
									expect(UTIL.stdout).toHaveBeenCalledWith(`done`)
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
