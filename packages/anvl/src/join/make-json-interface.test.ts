import { Join } from "."

describe(`makeJsonInterface`, () => {
	it(`exports a join to json and imports from json`, () => {
		const join0 = new Join({
			relationType: `1:n`,
		})
			.from(`a`)
			.to(`b`)
		const transform0 = join0.makeJsonInterface()
		const json0 = transform0.toJson(join0)
		const join1 = transform0.fromJson(json0)
		expect(join1.a).toStrictEqual(join0.a)
		expect(join1.b).toStrictEqual(join0.b)
		expect(join1.relationType).toStrictEqual(join0.relationType)
		expect(join1.relations).toBe(join0.relations)
	})
})
