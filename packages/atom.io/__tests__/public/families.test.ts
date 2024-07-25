import type { Logger } from "atom.io"
import { atomFamily, getState, selectorFamily, setState, Silo } from "atom.io"
import { findState } from "atom.io/ephemeral"
import * as Internal from "atom.io/internal"
import { vitest } from "vitest"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
const CHOOSE = 1

let logger: Logger

beforeEach(() => {
	Internal.clearStore(Internal.IMPLICIT.STORE)
	Internal.IMPLICIT.STORE.loggers[0].logLevel = LOG_LEVELS[CHOOSE]
	logger = Internal.IMPLICIT.STORE.logger
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
})

describe(`atom families`, () => {
	it(`can be modified and retrieved`, () => {
		const coordinateStates = atomFamily<{ x: number; y: number }, string>({
			key: `coordinate`,
			default: { x: 0, y: 0 },
		})
		setState(findState(coordinateStates, `a`), { x: 1, y: 1 })
		expect(getState(findState(coordinateStates, `a`))).toEqual({ x: 1, y: 1 })
	})
})

describe(`selector families`, () => {
	it(`can be modified and retrieved`, () => {
		const pointAtoms = atomFamily<{ x: number; y: number }, string>({
			key: `point`,
			default: { x: 0, y: 0 },
		})
		const distanceSelectors = selectorFamily<number, [string, string]>({
			key: `distance`,
			get:
				([keyA, keyB]) =>
				({ get }) => {
					const pointA = get(pointAtoms, keyA)
					const pointB = get(pointAtoms, keyB)
					return Math.sqrt(
						(pointA.x - pointB.x) ** 2 + (pointA.y - pointB.y) ** 2,
					)
				},
		})
		setState(pointAtoms, `a`, { x: 1, y: 1 })
		setState(pointAtoms, `b`, { x: 2, y: 2 })
		expect(getState(distanceSelectors, [`a`, `b`])).toBe(Math.SQRT2)

		setState(pointAtoms, `b`, { x: 11, y: 11 })
		expect(getState(distanceSelectors, [`a`, `b`])).toBe(14.142135623730951)
	})
	it(`implicitly creates in an ephemeral store`, () => {
		const arrayAtoms = atomFamily<number[], string>({
			key: `array`,
			default: [],
		})
		const lengthSelectors = selectorFamily<number, string>({
			key: `length`,
			get:
				(key) =>
				({ get }) => {
					const array = get(arrayAtoms, key)
					return array.length
				},
		})
		expect(getState(lengthSelectors, `hi`)).toBe(0)
	})
	it(`won't implicitly create in an immortal store`, () => {
		const $ = new Silo({ name: `IMMORTAL`, lifespan: `immortal` })
		const arrayAtoms = $.atomFamily<number[], string>({
			key: `array`,
			default: [],
		})
		const lengthSelectors = $.selectorFamily<number, string>({
			key: `length`,
			get:
				(key) =>
				({ get }) => {
					const array = get(arrayAtoms, key)
					return array.length
				},
		})
		expect(() => $.getState(lengthSelectors, `hi`)).toThrowError(
			`Readonly Selector Family "length" member "hi" not found in store "IMMORTAL".`,
		)
	})
})
