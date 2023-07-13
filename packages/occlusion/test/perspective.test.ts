import { ID } from "~/apps/node/lodge/test/test-utils"

import { Perspective } from "../src"

const idFn = ID.style_000000_$()

describe(`Perspective`, () => {
	it(`constructs`, () => {
		const perspective = new Perspective()
		expect(perspective).toBeInstanceOf(Perspective)
	})
	it(`virtualizes an Identifier`, () => {
		const perspective = new Perspective({ idFn })
		const virtualIdentifier = perspective.occlude({
			id: idFn(),
			type: `Card`,
			isVirtual: false,
		})
		expect(virtualIdentifier).toEqual({
			id: `000000_1`,
			type: `Card`,
			isVirtual: true,
		})
	})
})
