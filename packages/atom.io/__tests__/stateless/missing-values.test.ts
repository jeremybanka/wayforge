import { readFile, readFileSync, writeFile, writeFileSync } from "fs"

import tmp from "tmp"
import { vitest } from "vitest"

import {
	AtomIOLogger,
	atom,
	getState,
	selector,
	setState,
	simpleLog,
	subscribe,
} from "atom.io"
import type { Loadable } from "atom.io/data"
import * as Internal from "atom.io/internal"
import * as Utils from "../__util__"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 3

let tmpDir: tmp.DirResult

function clearValueMap() {
	Internal.IMPLICIT.STORE.valueMap = new Map()
}

beforeEach(() => {
	Internal.clearStore()
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	const { logger } = Internal.IMPLICIT.STORE
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
	vitest.spyOn(Utils, `stdout`)
	tmpDir = tmp.dirSync({ unsafeCleanup: true })
	tmp.setGracefulCleanup()
})

describe(`atom`, () => {
	it.only(`can be modified and retrieved`, async () => {
		const count = atom<Loadable<number>>({
			key: `count`,
			default: () => {
				return new Promise<number>((resolve) => {
					console.log(`reading file`)
					readFile(`${tmpDir.name}/count.txt`, `utf8`, (error, data) => {
						console.log(`read file`, { data })
						if (error) {
							console.log(`error`, error.message)
							writeFile(`${tmpDir.name}/count.txt`, `0`, () => {
								console.log(`wrote 0. resolving`)
								resolve(0)
							})
							return
						}
						console.log(`found file. resolving`, parseInt(data, 10))
						resolve(parseInt(data, 10))
					})
				})
			},
			effects: [
				({ onSet, setSelf }) => {
					onSet(({ oldValue, newValue }) => {
						console.log(`onSet`, { oldValue, newValue })
						if (newValue instanceof Promise) {
							return
						}
						const promise = new Promise<number>((resolve) => {
							writeFile(`${tmpDir.name}/count.txt`, newValue.toString(), () => {
								console.log(`wrote`, newValue)
								resolve(newValue)
							})
						})
						console.log(`setting self`, promise)
						setSelf(promise)
					})
				},
			],
		})
		expect(await getState(count)).toBe(0)
		subscribe(count, (update) => {
			console.log(`subscription update`, update)
		})
		clearValueMap()
		setState(count, 1)
		clearValueMap()
		expect(await getState(count)).toBe(1)
		clearValueMap()
		setState(count, 2)
		clearValueMap()
		expect(await getState(count)).toBe(2)
	})
	it(`can be subscribed to`, () => {
		const name = atom<string>({
			key: `name`,
			default: `John`,
		})
		subscribe(name, Utils.stdout)
		setState(name, `Jane`)
		expect(Utils.stdout).toHaveBeenCalledWith({
			newValue: `Jane`,
			oldValue: `John`,
		})
	})
	it(`can use a function as a default value`, () => {
		const count = atom<number>({
			key: `count`,
			default: () => 0,
		})
		expect(getState(count)).toBe(0)
	})
	it(`can be verified whether an atom is its default value`, () => {
		const stats = atom<Record<number, number>>({
			key: `count`,
			default: () => ({ 0: 0, 1: 0, 2: 0 }),
		})
		expect(getState(stats)).toStrictEqual({ 0: 0, 1: 0, 2: 0 })

		setState(stats, { 0: 1, 1: 0, 2: 0 })
		expect(getState(stats)).toStrictEqual({ 0: 1, 1: 0, 2: 0 })
	})
})

describe(`selector`, () => {
	it(`can be modified and retrieved`, () => {
		const count = atom<number>({
			key: `count`,
			default: 0,
		})
		const double = selector<number>({
			key: `double`,
			get: ({ get }) => get(count) * 2,
		})
		setState(count, 1)
		expect(getState(double)).toBe(2)
		setState(count, 2)
		expect(getState(double)).toBe(4)
	})
	it(`can be subscribed to`, () => {
		const count = atom<number>({
			key: `count`,
			default: 0,
		})
		const double = selector<number>({
			key: `double`,
			get: ({ get }) => get(count) * 2,
		})
		subscribe(double, Utils.stdout)
		setState(count, 1)
		expect(Utils.stdout).toHaveBeenCalledWith({ newValue: 2, oldValue: 0 })
	})
	it(`can be set, propagating changes to all related atoms`, () => {
		const count = atom<number>({
			key: `count`,
			default: 0,
		})
		const double = selector<number>({
			key: `double`,
			get: ({ get }) => get(count) * 2,
			set: ({ set }, newValue) => set(count, newValue / 2),
		})
		const triple = selector<number>({
			key: `triple`,
			get: ({ get }) => get(count) * 3,
		})
		const doublePlusOne = selector<number>({
			key: `doublePlusOne`,
			get: ({ get }) => get(double) + 1,
			set: ({ set }, newValue) => set(double, newValue - 1),
		})
		setState(double, 20)
		expect(getState(count)).toBe(10)
		expect(getState(double)).toBe(20)
		expect(getState(triple)).toBe(30)
		expect(getState(doublePlusOne)).toBe(21)
		setState(doublePlusOne, 43)
		expect(getState(count)).toBe(21)
	})
	it(`may depend on more than one atom or selector`, () => {
		const firstNameState = atom<string>({
			key: `firstName`,
			default: `John`,
		})
		const lastNameState = atom<string>({
			key: `lastName`,
			default: `Doe`,
		})
		const fullNameState = selector<string>({
			key: `fullName`,
			get: ({ get }) => `${get(firstNameState)} ${get(lastNameState)}`,
		})
		expect(getState(fullNameState)).toBe(`John Doe`)
		setState(firstNameState, `Jane`)
		expect(getState(fullNameState)).toBe(`Jane Doe`)

		type Gender = `female` | `male` | `other`
		const TITLES: Record<Gender, string> = {
			male: `Mr.`,
			female: `Ms.`,
			other: `Mx.`,
		} as const

		const genderState = atom<Gender>({
			key: `gender`,
			default: `other`,
		})
		const modeOfAddressState = atom<`formal` | `informal`>({
			key: `modeOfAddress`,
			default: `informal`,
		})
		const greetingState = selector<string>({
			key: `greetingState`,
			get: ({ get }) => {
				const modeOfAddress = get(modeOfAddressState)
				if (modeOfAddress === `formal`) {
					return `Dear ${TITLES[get(genderState)]} ${get(lastNameState)},`
				}
				return `Hi ${get(firstNameState)}!`
			},
		})
		expect(getState(greetingState)).toBe(`Hi Jane!`)
		setState(firstNameState, `Janice`)
		expect(getState(greetingState)).toBe(`Hi Janice!`)
		setState(modeOfAddressState, `formal`)
		expect(getState(greetingState)).toBe(`Dear Mx. Doe,`)
		setState(genderState, `female`)
		expect(getState(greetingState)).toBe(`Dear Ms. Doe,`)
	})
	it(`can be verified whether a selector is its default value`, () => {
		const count = atom<number>({
			key: `count`,
			default: 0,
		})
		const double = selector<number>({
			key: `double`,
			get: ({ get }) => get(count) * 2,
		})
		expect(getState(double)).toBe(0)

		setState(count, 1)
		expect(getState(double)).toBe(2)
	})
})
