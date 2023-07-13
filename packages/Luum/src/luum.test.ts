import { Luum } from "./luum"
describe(`Luum`, () => {
	it(`creates a new instance`, () => {
		const luum = new Luum()
		expect(luum).toBeInstanceOf(Luum)
	})
})
