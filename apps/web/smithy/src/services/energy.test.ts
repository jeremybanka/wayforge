import { getState } from "atom.io"
import { describe, expect, it } from "vitest"

import { energyAtoms } from "./energy"

describe(`energy`, () => {
	it(`should initialize default`, () => {
		expect(getState(energyAtoms, `0880057843761`)).toStrictEqual({
			colorA: {
				hue: 0,
				lum: 0,
				prefer: `sat`,
				sat: 0,
			},
			colorB: {
				hue: 0,
				lum: 0,
				prefer: `sat`,
				sat: 0,
			},
			icon: ``,
			name: ``,
			id: ``,
		})
	})
})
