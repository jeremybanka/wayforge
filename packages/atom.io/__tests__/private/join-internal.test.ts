import { getJoin, IMPLICIT } from "atom.io/internal"

describe(`join.internal`, () => {
	it(`throws if the join does not exist`, () => {
		// getJoin({ key: `a` })
		expect(() =>
			getJoin(IMPLICIT.STORE, {
				key: `a`,
				type: `join`,
				cardinality: `1:1`,
				a: `a`,
				b: `b`,
			}),
		).toThrow()
	})
})
