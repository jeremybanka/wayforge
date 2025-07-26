import type { Logger } from "atom.io"
import {
	atomFamily,
	findState,
	getState,
	resetState,
	selectorFamily,
	setState,
} from "atom.io"
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
		resetState(coordinateStates, `a`)
		expect(getState(coordinateStates, `a`)).toEqual({ x: 0, y: 0 })
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
			set:
				([keyA, keyB]) =>
				({ set }, newValue) => {
					const pointA = getState(pointAtoms, keyA)
					const pointB = getState(pointAtoms, keyB)
					const angle = Math.atan2(pointB.y - pointA.y, pointB.x - pointA.x)
					const vector = { x: Math.cos(angle), y: Math.sin(angle) }
					set(pointAtoms, keyB, {
						x: pointA.x + vector.x * newValue,
						y: pointA.y + vector.y * newValue,
					})
				},
		})
		setState(pointAtoms, `a`, { x: 1, y: 1 })
		setState(pointAtoms, `b`, { x: 2, y: 2 })
		expect(getState(distanceSelectors, [`a`, `b`])).toBe(Math.SQRT2)

		setState(pointAtoms, `b`, { x: 11, y: 11 })
		expect(getState(distanceSelectors, [`a`, `b`])).toBe(14.142135623730951)

		setState(distanceSelectors, [`a`, `b`], 1)
		expect(getState(pointAtoms, `a`)).toEqual({ x: 1, y: 1 })
		expect(getState(pointAtoms, `b`)).toEqual({
			x: Math.SQRT2 / 2 + 1,
			y: Math.SQRT2 / 2 + 1,
		})

		resetState(distanceSelectors, [`a`, `b`])
		expect(getState(pointAtoms, `a`)).toEqual({ x: 0, y: 0 })
		expect(getState(pointAtoms, `b`)).toEqual({ x: 0, y: 0 })
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
})
