import { getJoin, join } from "atom.io/data"
import { IMPLICIT } from "../../internal/src/store"

describe(`join.internal`, () => {
	it(`throws if the join does not exist`, () => {
		// getJoin({ key: `a` })
		expect(() =>
			getJoin(
				{
					key: `a`,
					type: `join`,
					cardinality: `1:1`,
					a: `a`,
					b: `b`,
				},
				IMPLICIT.STORE,
			),
		).toThrow()
	})
})
