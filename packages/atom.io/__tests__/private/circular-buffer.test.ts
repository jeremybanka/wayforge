import { CircularBuffer } from "atom.io/internal"

describe(`CircularBuffer`, () => {
	it(`retains a limited set of items`, () => {
		const circular = new CircularBuffer<number>(3)
		circular.add(1)
		circular.add(2)
		circular.add(3)
		expect(circular.buffer).toEqual([1, 2, 3])
		expect(circular.index).toEqual(0)
		circular.add(4)
		expect(circular.buffer).toEqual([4, 2, 3])
		expect(circular.index).toEqual(1)
		circular.add(5)
		expect(circular.buffer).toEqual([4, 5, 3])
		expect(circular.index).toEqual(2)
		circular.add(6)
		expect(circular.buffer).toEqual([4, 5, 6])
		expect(circular.index).toEqual(0)
	})
})
