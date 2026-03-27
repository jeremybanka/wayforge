import { readFileSync, writeFileSync } from "node:fs"
import { readFile } from "node:fs/promises"

import type { Logger } from "atom.io"
import {
	atom,
	atomFamily,
	disposeState,
	findState,
	getState,
	mutableAtom,
	mutableAtomFamily,
	setState,
} from "atom.io"
import * as Internal from "atom.io/internal"
import { UList } from "atom.io/transceivers/u-list"
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
		const coordinateAtoms = atomFamily<{ x: number; y: number }, string>({
			key: `coordinate`,
			default: { x: 0, y: 0 },
			effects: (key) => [
				({ onSet }) => {
					onSet((update) => {
						Utils.stdout(`onSet`, key, update)
					})
				},
			],
		})
		setState(findState(coordinateAtoms, `a`), { x: 1, y: 1 })
		expect(Utils.stdout).toHaveBeenCalledWith(`onSet`, `a`, {
			newValue: { x: 1, y: 1 },
		})
		setState(coordinateAtoms, `a`, { x: 2, y: 2 })
		expect(Utils.stdout).toHaveBeenCalledWith(`onSet`, `a`, {
			newValue: { x: 2, y: 2 },
			oldValue: { x: 1, y: 1 },
		})
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
	it(`sets itself from the file-system, then writes to the file-system onSet`, () => {
		const nameAtom = atom<string>({
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
		expect(getState(nameAtom)).toBe(`Mavis`)
		setState(nameAtom, `Mavis2`)
		expect(readFileSync(`${tmpDir.name}/name.txt`, `utf8`)).toBe(`Mavis2`)
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
	it(`allows async effect setup to initialize an atom`, async () => {
		const jobDone = new Internal.Future(() => {})
		const nameAtom = atom<string>({
			key: `name`,
			default: ``,
			effects: [
				async ({ setSelf }) => {
					const name = await readFile(`${tmpDir.name}/name.txt`, `utf8`)
					jobDone.use(Promise.resolve())
					setSelf(name)
				},
			],
		})

		expect(getState(nameAtom)).toBe(``)
		await jobDone
		expect(getState(nameAtom)).toBe(`Mavis`)
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
	it(`allows async effect setup to register onSet`, async () => {
		const jobDone = new Internal.Future(() => {})
		const nameAtom = atom<string>({
			key: `name`,
			default: ``,
			effects: [
				async ({ onSet }) => {
					await Promise.resolve()
					onSet((change) => {
						writeFileSync(`${tmpDir.name}/name.txt`, change.newValue)
					})
					jobDone.use(Promise.resolve())
				},
			],
		})

		await jobDone
		setState(nameAtom, `Mavis2`)
		expect(readFileSync(`${tmpDir.name}/name.txt`, `utf8`)).toBe(`Mavis2`)
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
	it(`resets itself`, () => {
		const mySubject = new Internal.Subject<string>()
		const nameAtom = atom<string>({
			key: `name`,
			default: ``,
			effects: [
				({ resetSelf }) => {
					mySubject.subscribe(`waiting to reset`, () => {
						resetSelf()
					})
				},
			],
		})
		setState(nameAtom, `Mavis`)
		expect(getState(nameAtom)).toBe(`Mavis`)
		mySubject.next(`reset`)
		expect(getState(nameAtom)).toBe(``)
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
	it(`resets itself (mutable)`, () => {
		const mySubject = new Internal.Subject<string>()
		const nameAtom = mutableAtom<UList<string>>({
			key: `name`,
			class: UList,
			effects: [
				({ resetSelf }) => {
					mySubject.subscribe(`waiting to reset`, () => {
						resetSelf()
					})
				},
			],
		})
		setState(nameAtom, (current) => current.add(`Cat`))
		const setOriginal = getState(nameAtom)
		mySubject.next(`reset`)
		const setNew = getState(nameAtom)
		expect(setNew).not.toBe(setOriginal)
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
	it(`allows async effect setup to initialize a mutable atom`, async () => {
		const jobDone = new Internal.Future(() => {})
		const nameAtom = mutableAtom<UList<string>>({
			key: `name`,
			class: UList,
			effects: [
				async ({ setSelf }) => {
					await Promise.resolve()
					setSelf(new UList([`Cat`]))
					jobDone.use(Promise.resolve())
				},
			],
		})

		expect(getState(nameAtom)).toEqual(new UList())
		await jobDone
		expect(getState(nameAtom)).toEqual(new UList([`Cat`]))
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
	it(`allows mutable effects to subscribe with onSet and clean up`, () => {
		const listAtoms = mutableAtomFamily<UList<string>, string>({
			key: `list`,
			class: UList,
			effects: (key) => [
				({ onSet }) => {
					onSet((update) => {
						Utils.stdout(`onSet`, key, [...update.newValue])
					})
					return () => {
						Utils.stdout(`cleanup`, key)
					}
				},
			],
		})

		const atomA = findState(listAtoms, `a`)
		setState(atomA, (list) => list.add(`Cat`))
		disposeState(atomA)

		expect(Utils.stdout).toHaveBeenCalledWith(`onSet`, `a`, [`Cat`])
		expect(Utils.stdout).toHaveBeenCalledWith(`cleanup`, `a`)
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
})

describe(`atom effect cleanup`, () => {
	test(`an effect can return a cleanup function`, () => {
		const coordinateAtoms = atomFamily<{ x: number; y: number }, string>({
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
		setState(findState(coordinateAtoms, `a`), { x: 1, y: 1 })
		expect(Utils.stdout).toHaveBeenCalledWith(`onSet`, `a`, {
			newValue: { x: 1, y: 1 },
		})
		disposeState(findState(coordinateAtoms, `a`))
		expect(Utils.stdout).toHaveBeenCalledWith(`cleanup`, `a`)
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
	test(`an async effect cleanup still runs if the atom is disposed before setup resolves`, async () => {
		const setup = new Internal.Future<void>(() => {})
		const coordinateAtoms = atomFamily<{ x: number; y: number }, string>({
			key: `coordinate`,
			default: { x: 0, y: 0 },
			effects: (key) => [
				async () => {
					await setup
					Utils.stdout(`setup done`, `a`)
					return () => {
						Utils.stdout(`cleanup`, key)
					}
				},
			],
		})

		setState(coordinateAtoms, `a`, { x: 1, y: 1 })
		disposeState(coordinateAtoms, `a`)

		setup.use(Promise.resolve())

		await Promise.resolve()
		await Promise.resolve()
		await Promise.resolve()
		await Promise.resolve()

		expect(Utils.stdout).toHaveBeenCalledWith(`setup done`, `a`)
		expect(Utils.stdout).toHaveBeenCalledWith(`cleanup`, `a`)
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
	test(`a mutable atom can run async cleanup after disposal`, async () => {
		const setup = new Internal.Future<void>(() => {})
		const listAtoms = mutableAtomFamily<UList<string>, string>({
			key: `list`,
			class: UList,
			effects: (key) => [
				async () => {
					await setup
					Utils.stdout(`setup done`, key)
					return () => {
						Utils.stdout(`cleanup`, key)
					}
				},
			],
		})

		const atomA = findState(listAtoms, `a`)
		setState(atomA, (list) => list.add(`Cat`))
		disposeState(atomA)

		setup.use(Promise.resolve())

		await Promise.resolve()
		await Promise.resolve()
		await Promise.resolve()
		await Promise.resolve()

		expect(Utils.stdout).toHaveBeenCalledWith(`setup done`, `a`)
		expect(Utils.stdout).toHaveBeenCalledWith(`cleanup`, `a`)
		expect(logger.warn).not.toHaveBeenCalled()
		expect(logger.error).not.toHaveBeenCalled()
	})
})
