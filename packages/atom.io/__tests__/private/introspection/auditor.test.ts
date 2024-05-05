import { atomFamily } from "atom.io"
import { Auditor } from "atom.io/introspection"

describe(`Auditor`, () => {
	it(`lists resources`, () => {
		const auditor = new Auditor()
		const countAtoms = atomFamily<number, string>({
			key: `count`,
			default: 0,
		})
		countAtoms(`foo`)
		expect(auditor.listResources()[0][0].key).toEqual(`count("foo")`)
	})
})
