import { vitest } from "vitest"

import type { Logger } from "atom.io"

import {
	atomFamily,
	findState,
	getState,
	selectorFamily,
	setState,
} from "atom.io"
import * as Internal from "atom.io/internal"

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
		const findCoordinateState = atomFamily<{ x: number; y: number }, string>({
			key: `coordinate`,
			default: { x: 0, y: 0 },
		})
		setState(findCoordinateState(`a`), { x: 1, y: 1 })
		expect(getState(findCoordinateState(`a`))).toEqual({ x: 1, y: 1 })
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
				({ find, get }) => {
					const pointA = get(find(pointAtoms, keyA))
					const pointB = get(find(pointAtoms, keyB))
					return Math.sqrt(
						(pointA.x - pointB.x) ** 2 + (pointA.y - pointB.y) ** 2,
					)
				},
		})
		setState(findState(pointAtoms, `a`), { x: 1, y: 1 })
		setState(findState(pointAtoms, `b`), { x: 2, y: 2 })
		expect(getState(findState(distanceSelectors, [`a`, `b`]))).toBe(
			1.4142135623730951,
		)

		setState(findState(pointAtoms, `b`), { x: 11, y: 11 })
		expect(getState(findState(distanceSelectors, [`a`, `b`]))).toBe(
			14.142135623730951,
		)
	})
})
